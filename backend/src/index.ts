import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();
import { db, pool } from './db/connection';
import { users, conversations, messages, symptomCards } from './db/schema';
import { eq, desc } from 'drizzle-orm';
import { queryKnowledgeBase } from './services/rag';
import { generateGemmaResponse, classifySymptom, getNearestHealthCenter, generateSymptomCard, getMaternalGuide, analyzeDiagnosticImage } from './services/gemma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lafiya-backend' });
});

// 1. POST /auth/register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, lga, trimester, languagePreference } = req.body;
    if (!name || !lga || !trimester) {
      return res.status(400).json({ error: 'Name, LGA, and trimester are required.' });
    }

    // Check if user already exists
    const matched = await db.select().from(users).where(eq(users.name, name));
    if (matched.length > 0) {
      const [updatedUser] = await db.update(users).set({
        lga,
        trimester,
        languagePreference: languagePreference || 'ha'
      }).where(eq(users.name, name)).returning();
      return res.status(200).json(updatedUser);
    }

    const [newUser] = await db.insert(users).values({
      name,
      lga,
      trimester,
      languagePreference: languagePreference || 'ha'
    }).returning();

    res.status(201).json(newUser);
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user.', details: err.message });
  }
});

// 2. POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required to login.' });
    }

    const matchedUsers = await db.select().from(users).where(eq(users.name, name));
    if (matchedUsers.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Return the latest user with this name
    res.json(matchedUsers[matchedUsers.length - 1]);
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.', details: err.message });
  }
});

// GET /auth/recommendations
app.get('/auth/recommendations', async (req, res) => {
  try {
    const trimester = (req.query.trimester as string) || '1';
    const lang = (req.query.lang as 'ha' | 'en') || 'ha';
    
    const guide = await getMaternalGuide(trimester, lang);
    res.json(guide);
  } catch (err: any) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations.', details: err.message });
  }
});

// POST /auth/diagnose
app.post('/auth/diagnose', async (req, res) => {
  try {
    const { image, type, lang } = req.body;
    if (!image || !type) {
      return res.status(400).json({ error: 'image (base64) and type (urine/malaria/rash/other) are required.' });
    }
    const report = await analyzeDiagnosticImage(image, type, lang || 'ha');
    res.json(report);
  } catch (err: any) {
    console.error('Diagnosis error:', err);
    res.status(500).json({ error: 'Failed to process diagnostic image.', details: err.message });
  }
});

// 3. POST /chat
app.post('/chat', async (req, res) => {
  try {
    const { userId, conversationId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required.' });
    }

    // 1. Fetch user profile
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 2. Ensure active conversation
    let activeConvId = conversationId;
    if (!activeConvId) {
      const [newConv] = await db.insert(conversations).values({ userId }).returning();
      activeConvId = newConv.id;
    } else {
      const [existingConv] = await db.select().from(conversations).where(eq(conversations.id, activeConvId));
      if (!existingConv) {
        const [newConv] = await db.insert(conversations).values({ userId }).returning();
        activeConvId = newConv.id;
      }
    }

    // 3. Save user's message
    await db.insert(messages).values({
      conversationId: activeConvId,
      role: 'user',
      content: message,
    });

    // 4. Query RAG vector store
    const language = user.languagePreference as 'ha' | 'en';
    const ragDocs = await queryKnowledgeBase(message, language, 3);
    const contextText = ragDocs.map(d => `[${d.title}]: ${d.content}`).join('\n\n');

    // 5. Generate Response via Gemma (with local simulation fallback)
    const responseContent = await generateGemmaResponse({
      lga: user.lga,
      trimester: user.trimester,
      language,
      message,
      retrievedContext: contextText,
    });

    // 6. Save assistant's message
    await db.insert(messages).values({
      conversationId: activeConvId,
      role: 'assistant',
      content: responseContent,
    });

    // 7. Auto-detect critical symptoms for emergency handling
    const urgency = classifySymptom(message);
    let autoSymptomCard = null;

    if (urgency === 'critical') {
      // Auto-generate symptom card for screenshot
      const symptomsList = [message];
      const cardDetails = generateSymptomCard(symptomsList, 'critical');
      const [savedCard] = await db.insert(symptomCards).values({
        userId,
        symptoms: symptomsList,
        urgency: 'critical',
        actionStep: cardDetails.actionSteps,
      }).returning();
      autoSymptomCard = {
        ...savedCard,
        cardText: cardDetails.cardText,
      };
    }

    res.json({
      conversationId: activeConvId,
      response: responseContent,
      urgency,
      autoSymptomCard,
    });

  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal chat processing error.', details: err.message });
  }
});

// 4. POST /symptom-card
app.post('/symptom-card', async (req, res) => {
  try {
    const { userId, symptoms, urgency } = req.body;
    if (!userId || !symptoms || !urgency) {
      return res.status(400).json({ error: 'userId, symptoms, and urgency are required.' });
    }

    const cardDetails = generateSymptomCard(symptoms, urgency);

    const [savedCard] = await db.insert(symptomCards).values({
      userId,
      symptoms,
      urgency,
      actionStep: cardDetails.actionSteps,
    }).returning();

    res.status(201).json({
      ...savedCard,
      cardText: cardDetails.cardText,
    });
  } catch (err: any) {
    console.error('Symptom card creation error:', err);
    res.status(500).json({ error: 'Failed to create symptom card.', details: err.message });
  }
});

// 5. GET /health-centers/:lga
app.get('/health-centers/:lga', (req, res) => {
  try {
    const { lga } = req.params;
    const center = getNearestHealthCenter(lga);
    // Return matching LGA health centers, and include default fallback list
    res.json([center]);
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching health center.', details: err.message });
  }
});

// 6. GET /conversations/:userId
app.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const convs = await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
    res.json(convs);
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching conversations.', details: err.message });
  }
});

// DELETE /conversations/:userId
app.delete('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userConvs = await db.select().from(conversations).where(eq(conversations.userId, userId));
    for (const conv of userConvs) {
      await db.delete(messages).where(eq(messages.conversationId, conv.id));
    }
    await db.delete(conversations).where(eq(conversations.userId, userId));
    res.json({ success: true });
  } catch (err: any) {
    console.error('Clear conversations error:', err);
    res.status(500).json({ error: 'Failed to clear conversations.', details: err.message });
  }
});

// 7. GET /messages/:conversationId
app.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err: any) {
    res.status(500).json({ error: 'Error fetching messages.', details: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Lafiya backend listening on port ${PORT}`);
});
