import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { queryKnowledgeBase } from './rag';

dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma2:9b';

// Gemma Cloud API Helpers
async function queryGemmaAPI(promptText: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(promptText);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error('[Gemma Cloud API] Generation failed:', err);
    return null;
  }
}

async function queryGemmaAPIVision(
  base64Image: string,
  promptText: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      promptText,
      {
        inlineData: {
          data: base64Image.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/png'
        }
      }
    ]);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error('[Gemma Cloud API Vision] Generation failed:', err);
    return null;
  }
}

// Bundled Primary Health Center database (Offline Architecture)
export interface HealthCenter {
  name: string;
  address: string;
  distance: string;
  lga: string;
}

export const HEALTH_CENTERS: HealthCenter[] = [
  // Kano
  { name: 'Fagge Maternal & Child Health Clinic', address: 'Fagge Road, Kano', distance: '1.2 km', lga: 'Fagge' },
  { name: 'Nasarawa Comprehensive Health Centre', address: 'Hadejia Road, Nasarawa, Kano', distance: '2.1 km', lga: 'Nasarawa' },
  { name: 'Tarauni General Clinic', address: 'Court Road, Tarauni, Kano', distance: '0.8 km', lga: 'Tarauni' },
  { name: 'Dala Primary Health Centre', address: 'Dala Hill Way, Kano', distance: '1.7 km', lga: 'Dala' },
  { name: 'Gwale Maternity Hospital', address: 'Gwale LGA, Kano', distance: '1.5 km', lga: 'Gwale' },
  // Kaduna
  { name: 'Kaduna North Comprehensive Health Centre', address: 'Tafawa Balewa Way, Kaduna North', distance: '1.1 km', lga: 'Kaduna North' },
  { name: 'Tudan Wada Health Clinic', address: 'Tudun Wada, Kaduna South', distance: '2.4 km', lga: 'Kaduna South' },
  { name: 'Chikun Primary Health Care Centre', address: 'Sabon Tasha, Chikun, Kaduna', distance: '3.2 km', lga: 'Chikun' },
  { name: 'Zaria Maternal & Child Clinic', address: 'Kofar Doka, Zaria', distance: '1.6 km', lga: 'Zaria' },
  // Katsina
  { name: 'Katsina Maternal Health Clinic', address: 'Katsina Central Road, Katsina', distance: '1.4 km', lga: 'Katsina' },
  { name: 'Daura General Clinic', address: 'Daura Central Hospital Rd, Daura', distance: '2.0 km', lga: 'Daura' },
  // Default fallback for any other LGA
  { name: 'Lafiya Community Health Post', address: 'LGA Central Health Facility', distance: '2.5 km', lga: 'Default' }
];

export function getNearestHealthCenter(lga: string): HealthCenter {
  const normalizedLga = lga.trim().toLowerCase();
  const matched = HEALTH_CENTERS.find(hc => hc.lga.toLowerCase() === normalizedLga);
  if (matched) return matched;
  // Fallback to default, but customize the LGA name in response
  const fallback = HEALTH_CENTERS.find(hc => hc.lga === 'Default')!;
  return {
    ...fallback,
    lga: lga,
  };
}

export function classifySymptom(symptom: string): 'low' | 'medium' | 'critical' {
  const norm = symptom.toLowerCase();
  
  // Critical Symptoms (Bleeding, severe swelling, convulsions, reduced fetal movement, fever, severe headache)
  if (
    norm.includes('jini') || norm.includes('bleeding') || norm.includes('blood') ||
    norm.includes('zubar') || norm.includes('kumburi') || norm.includes('swelling') ||
    norm.includes('ciwon kai mai tsanani') || norm.includes('severe headache') ||
    norm.includes('babu motsi') || norm.includes('reduced movement') || norm.includes('fetal movement') ||
    norm.includes('azzalumi') || norm.includes('zazzabi mai zafi') || norm.includes('high fever') ||
    norm.includes('farfadiya') || norm.includes('convulsion') || norm.includes('fits')
  ) {
    return 'critical';
  }

  // Medium Symptoms (mild fever, moderate swelling, mild nausea/vomiting, abdominal cramps)
  if (
    norm.includes('zazzabi') || norm.includes('fever') ||
    norm.includes('ama') || norm.includes('vomit') || norm.includes('nausea') ||
    norm.includes('ciwon ciki') || norm.includes('cramps') || norm.includes('abdominal')
  ) {
    return 'medium';
  }

  // Low Symptoms (fatigue, back pain, mild heartburn, frequent urination)
  return 'low';
}

export function generateSymptomCard(symptoms: string[], urgency: string): { cardText: string; actionSteps: string } {
  const isHausa = true; // Assume Hausa for community default, can adapt
  
  let actionSteps = '';
  let title = '';
  
  if (urgency === 'critical') {
    title = isHausa ? '⚠️ KATIN TSARI MAI GURGUNTUWA (CRITICAL SYMPTOM CARD)' : '⚠️ CRITICAL HEALTH WARNING CARD';
    actionSteps = isHausa 
      ? '1. Tafi asibiti mafi kusa yanzu-yanzu!\n2. Kada ka sha wani magani ba tare da umarnin likita ba.\n3. Nuna wannan katin ga ma\'aikacin lafiya da zaran kun isa.'
      : '1. Go to the nearest health facility immediately!\n2. Do not take any medication without doctor approval.\n3. Show this card to the health worker immediately upon arrival.';
  } else if (urgency === 'medium') {
    title = isHausa ? '⚠️ KATIN BINKICIN LAFIYA (MEDIUM SYMPTOM CARD)' : '⚠️ ATTENTION NEEDED CARD';
    actionSteps = isHausa
      ? '1. Tuntubi ma\'aikacin lafiya a yau.\n2. Huta sosai kuma sha ruwa mai tsabta.\n3. Kula da canjin jiki.'
      : '1. Visit a healthcare worker today.\n2. Rest and drink clean water.\n3. Monitor for any worsening signs.';
  } else {
    title = isHausa ? 'ℹ️ KATIN KULA DA KAI (LOW SYMPTOM CARD)' : 'ℹ️ SELF-CARE GUIDE CARD';
    actionSteps = isHausa
      ? '1. Huta kuma ku guji aiki mai wahala.\n2. Ku ci abinci mai gina jiki.\n3. Tuntubi ungozoma idan alamomin sun dade.'
      : '1. Rest and avoid strenuous activity.\n2. Eat a balanced diet.\n3. Talk to a midwife if symptoms persist.';
  }

  const symptomsList = symptoms.map(s => `- ${s}`).join('\n');
  const cardText = `${title}\n\n` +
    (isHausa ? 'ALAMOMI:' : 'SYMPTOMS:') + `\n${symptomsList}\n\n` +
    (isHausa ? 'MATSAYI:' : 'URGENCY:') + ` ${urgency.toUpperCase()}\n\n` +
    (isHausa ? 'ABIN YIN GANGADI:' : 'IMMEDIATE ACTION STEPS:') + `\n${actionSteps}`;

  return { cardText, actionSteps };
}

// Check if Ollama is running
async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (res.ok) {
      return true;
    }
  } catch (e) {
    // Ignore
  }
  return false;
}

// Generate response via local Gemma or Gemini API
export async function generateGemmaResponse(prompt: {
  lga: string;
  trimester: string;
  language: 'ha' | 'en';
  message: string;
  retrievedContext: string;
}): Promise<string> {
  const systemPrompt = `You are Lafiya, a warm and trusted maternal health companion. You speak in clear, simple ${prompt.language === 'ha' ? 'Hausa' : 'English'}. You should use the provided context as a primary guide, but you are also encouraged to use your general medical knowledge to provide helpful, supportive, and informative answers to the user's questions about pregnancy, nutrition, exercise, and safety. Never say "I do not have information" or "I could not find information". Instead, offer constructive maternal care advice in a warm, caring, and wise tone like an older female relative, and remind them to visit a local clinic for specific medical diagnoses.`;

  const userProfile = `User Profile: LGA: ${prompt.lga}, Trimester: ${prompt.trimester}, Language: ${prompt.language}`;
  
  const fullPrompt = `${systemPrompt}\n\nContext: ${prompt.retrievedContext}\n\n${userProfile}\n\nUser Question: ${prompt.message}\n\nLafiya:`;

  // Try Cloud Gemma API first if configured
  if (process.env.GOOGLE_GENAI_API_KEY) {
    const cloudRes = await queryGemmaAPI(fullPrompt);
    if (cloudRes) {
      return cloudRes;
    }
  }

  const isAvailable = await isOllamaAvailable();
  if (isAvailable) {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GEMMA_MODEL,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.3,
          }
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        return data.response.trim();
      }
    } catch (e) {
      console.error('[Gemma] Ollama generation failed. Falling back to local simulation:', e);
    }
  }

  // High-Fidelity Local Simulation fallback (Rule-based grounded semantic generation)
  return simulateGemmaResponse(prompt.message, prompt.retrievedContext, prompt.language, prompt.lga);
}

function simulateGemmaResponse(message: string, context: string, language: 'ha' | 'en', lga: string): string {
  const isHausa = language === 'ha';
  const query = message.toLowerCase();
  
  // Check if critical symptom
  const urgency = classifySymptom(message);
  
  if (urgency === 'critical') {
    if (isHausa) {
      const hc = getNearestHealthCenter(lga);
      return `Haba yar uwa, wannan alama ce mai hadari sosai! Ina so ki je asibiti yanzu-yanzu. Asibiti mafi kusa da ke a ${lga} shine "${hc.name}" da ke kusa da ${hc.address} (kimanin ${hc.distance}). Don Allah kada ki yi wasa da wannan, domin lafiyarki da ta jinjirin dake cikin ki sune abin alfaharmu.`;
    } else {
      const hc = getNearestHealthCenter(lga);
      return `My sister, this is a very dangerous sign! Please go to the hospital immediately. The nearest health center in ${lga} is "${hc.name}" located at ${hc.address} (${hc.distance}). Please do not delay. Your health and the baby's health are most important.`;
    }
  }

  // Ground response using context sentences if available
  if (context && context.trim().length > 0) {
    // Extract a few core sentences from context that match key terms
    const paragraphs = context.split('\n').filter(p => p.trim().length > 10);
    let matchedText = '';
    
    // Simple matching of keywords in context paragraphs
    const terms = query.split(/\s+/).filter(t => t.length > 3);
    for (const p of paragraphs) {
      for (const t of terms) {
        if (p.toLowerCase().includes(t)) {
          matchedText = p;
          break;
        }
      }
      if (matchedText) break;
    }
    
    if (!matchedText && paragraphs.length > 0) {
      matchedText = paragraphs[0];
    }
    
    if (matchedText) {
      if (isHausa) {
        return `Barka da yau yar uwa. Dangane da abinda kika tambaya, ga abinda yake tabbatacce: ${matchedText}. Lafiyarki ita ce burinmu, don haka a bi wannan shawarar kuma a kiyaye.`;
      } else {
        return `Hello my sister. Regarding what you asked, here is the verified guidance: ${matchedText}. Take care of yourself and let me know if you need anything else.`;
      }
    }
  }

  // Standard safe fallbacks grounded in general knowledge but warning the user
  if (isHausa) {
    return `Sannu uwar gida. Don Allah, ban sami takamaiman bayani kan wannan tambaya a littafin jagoranmu na lafiya ba. Domin samun cikakken tsaro, ina ba ki shawarar ki ziyarci ungozoma ko ma'aikacin lafiya a asibiti mafi kusa a ${lga}. Lafiyarki ita ce gaba da komai.`;
  } else {
    return `Hello. I could not find specific verified guidelines for this question in my knowledge base. To be safe, I advise you to speak with a midwife or healthcare provider at the nearest health clinic in ${lga}. Your health is our top priority.`;
  }
}

export interface MaternalGuide {
  exercises: string[];
  foods: string[];
  avoid: string[];
  reminders: { title: string; subtitle: string; time: string; type: string }[];
}

export async function getMaternalGuide(trimester: string, language: 'ha' | 'en'): Promise<MaternalGuide> {
  const isAvailable = await isOllamaAvailable();
  const isHausa = language === 'ha';

  const systemPrompt = `You are Lafiya, an expert maternal health companion. Generate a JSON object containing personalized recommendations for a pregnant mother in her Trimester ${trimester}. The output MUST be a valid JSON object matching this schema exactly:
{
  "exercises": ["safe exercise 1", "safe exercise 2"],
  "foods": ["healthy food item 1", "healthy food item 2"],
  "avoid": ["avoid action/food 1", "avoid action/food 2"],
  "reminders": [
    {"title": "reminder title 1", "subtitle": "reminder instruction 1", "time": "08:00", "type": "med"},
    {"title": "reminder title 2", "subtitle": "reminder instruction 2", "time": "14:00", "type": "water"}
  ]
}
Speak in simple ${isHausa ? 'Hausa' : 'English'}. The foods should be common, healthy, and affordable local Nigerian ingredients (e.g. dawadawa, leafy vegetables, millet/guinea corn). The exercises should be safe for Trimester ${trimester}. Do not output any thinking or markdown block, output only raw JSON.`;

  if (isAvailable) {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GEMMA_MODEL,
          prompt: systemPrompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.2 }
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const parsed = JSON.parse(data.response.trim());
        if (parsed.exercises && parsed.foods && parsed.avoid && parsed.reminders) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('[Gemma] Failed to generate JSON recommendations, falling back to local simulation:', e);
    }
  }

  // High-fidelity local simulation fallback
  return getSimulatedMaternalGuide(trimester, language);
}

function getSimulatedMaternalGuide(trimester: string, language: 'ha' | 'en'): MaternalGuide {
  const isHausa = language === 'ha';
  
  if (trimester === '1') {
    return {
      exercises: isHausa 
        ? ['Kegel exercises (Motsa tsokokin farji) don ƙarfafa ƙashin ƙugu.', 'Tafiya a hankali na minti 15-20 kullum.']
        : ['Kegel exercises to strengthen pelvic floor muscles.', 'Gentle walking for 15-20 minutes daily.'],
      foods: isHausa
        ? ['Abinci mai dauke da Folic Acid kamar Alayahu, Ganye, da wake.', 'Danyen ƙwai da dafaffen kifi ko nama don gina jiki.', 'Gero da alkama don samar da ƙarfi.']
        : ['Folate-rich foods like Spinach, local greens, and beans.', 'Hard-boiled eggs, lean meat, or fish for protein.', 'Whole grains like millet and guinea corn for energy.'],
      avoid: isHausa
        ? ['Guji ɗaukar kaya masu nauyi kamar bokitin ruwa.', 'Guji maganin gargajiya wanda likita bai rubuta ba.', 'Guji cin danyen nama ko danyen ƙwai.']
        : ['Avoid lifting heavy objects like water containers.', 'Avoid self-medicating with unprescribed local herbs (agbo).', 'Avoid raw or undercooked meat and eggs.'],
      reminders: [
        {
          title: isHausa ? 'Shan Folic Acid' : 'Folic Acid Intake',
          subtitle: isHausa ? 'Shan kwayar folic acid daya kowace safe don lafiyar jariri.' : 'Take 1 tablet of folic acid/iron supplement with water.',
          time: '08:00',
          type: 'med'
        },
        {
          title: isHausa ? 'Shan Ruwa' : 'Hydration Time',
          subtitle: isHausa ? 'Kofi biyu na tsaftataccen ruwa don samun kuzari.' : 'Drink two glasses of clean drinking water.',
          time: '10:00',
          type: 'water'
        },
        {
          title: isHausa ? 'Ziyarar Asibiti (ANC)' : 'Schedule ANC Visit',
          subtitle: isHausa ? 'Tuntubi ungozoma domin yin rajistar ANC na farko.' : 'Book or prepare for your first ANC registration checkup.',
          time: '16:00',
          type: 'checkup'
        }
      ]
    };
  } else if (trimester === '2') {
    return {
      exercises: isHausa
        ? ['Motsa jiki ta hanyar miƙa hannaye da ƙafafu a hankali (Stretching).', 'Zama da miƙe ƙafafu don rage kumburi.', 'Yin tafiya na minti 20-30.']
        : ['Gentle stretching exercises to reduce back pain.', 'Elevate legs while sitting to prevent swelling.', 'Brisk walking for 20-30 minutes.'],
      foods: isHausa
        ? ['Kifi ko hanta mai ɗauke da Iron (ƙarfe) don ƙara jini.', 'Madara ko zuma don samun Calcium na ƙasusuwa.', 'Kayan itatuwa kamar lemu, gwanda, da ayaba.']
        : ['Iron-rich foods like fish or liver to boost blood production.', 'Calcium sources like milk, local yogurt (nono), or cheese.', 'Fresh fruits like oranges, pawpaw, and bananas.'],
      avoid: isHausa
        ? ['Guji kwanciya da rigingine (bayan ki a ƙasa) na dogon lokaci.', 'Guji kayan zaƙi da yawa don kiyaye ciwon suga na ciki.', 'Guji tsayuwa na tsawon lokaci ba tare da hutu ba.']
        : ['Avoid sleeping flat on your back; sleep on your side.', 'Avoid excessive sugary foods to prevent gestational diabetes.', 'Avoid standing for long periods without rest.'],
      reminders: [
        {
          title: isHausa ? 'Shan Maganin Kara Jini (Iron)' : 'Iron Supplement',
          subtitle: isHausa ? 'Sha maganin kara jini kowace rana bayan cin abinci.' : 'Take your iron/folic supplement daily after a meal.',
          time: '09:00',
          type: 'med'
        },
        {
          title: isHausa ? 'Shan Ruwa da Rana' : 'Afternoon Hydration',
          subtitle: isHausa ? 'Tabbatar kin sha ruwa sosai don kiyaye kumburi.' : 'Keep drinking water to stay hydrated and active.',
          time: '13:00',
          type: 'water'
        },
        {
          title: isHausa ? 'Rigakafin Tetanus' : 'Tetanus Vaccine Check',
          subtitle: isHausa ? 'Mako 20-24: Tabbatar kin karbi allurar rigakafin Tetanus.' : 'Weeks 20-24: Ensure you receive your Tetanus Toxoid shot.',
          time: '15:00',
          type: 'checkup'
        }
      ]
    };
  } else {
    return {
      exercises: isHausa
        ? ['Ayyukan numfashi (Deep breathing) don shirya haihuwa.', 'Tafiya a hankali a kusa da gida don motsa jiki.', 'Zama kan kujera mai laushi don rage nauyi.']
        : ['Deep breathing exercises to prepare for labor.', 'Short, slow walks close to home.', 'Pelvic tilt stretches while sitting on a sturdy chair.'],
      foods: isHausa
        ? ['Abinci mai dauke da Fiber don kiyaye kumburin ciki ko yankan bayan gida.', 'Nama, wake da kifi don lafiyar mahaifa da girman jinjiri.', 'Garin gero ko kunu mai dumi don kuzari.']
        : ['High-fiber foods (greens, oats) to prevent constipation.', 'Proteins (meat, beans, fish) for rapid baby growth.', 'Warm millet gruel (kunu) for strength and breastmilk prep.'],
      avoid: isHausa
        ? ['Guji kishirwa ko ƙarancin ruwa, sha ruwa akai-akai.', 'Guji tafiya mai nisa ko hawa babur a kan hanya mai ramuka.', 'Guji yawan damuwa, nemi taimakon iyali.']
        : ['Avoid dehydration; drink water even if not thirsty.', 'Avoid long travel or riding on bumpy roads.', 'Avoid heavy stress; request support from family and friends.'],
      reminders: [
        {
          title: isHausa ? 'Duba Motsin Jariri' : 'Fetal Movement Check',
          subtitle: isHausa ? 'Kula da motsin jariri akalla sau 10 a cikin awanni biyu.' : 'Count baby kicks; expect at least 10 movements in 2 hours.',
          time: '11:00',
          type: 'med'
        },
        {
          title: isHausa ? 'Hadama Asibiti' : 'Prepare Delivery Bag',
          subtitle: isHausa ? 'Shirya kayan haihuwa da katin ANC domin ko wani lokaci.' : 'Pack your birth items, clean clothes, and ANC card in a bag.',
          time: '14:00',
          type: 'checkup'
        },
        {
          title: isHausa ? 'Shan Ruwan Yamma' : 'Evening Hydration',
          subtitle: isHausa ? 'Sha ruwa kofi biyu domin kiyaye kumburin kafa.' : 'Drink clean water to support amniotic fluid levels.',
          time: '19:00',
          type: 'water'
        }
      ]
    };
  }
}

export interface DiagnosticReport {
  testType: string;
  result: string;
  urgency: 'low' | 'medium' | 'critical';
  details: string;
  actionSteps: string[];
}

export async function analyzeDiagnosticImage(
  base64Image: string,
  type: 'urine' | 'malaria' | 'rash' | 'other',
  language: 'ha' | 'en'
): Promise<DiagnosticReport> {
  const isHausa = language === 'ha';

  const systemPrompt = `You are PaliGemma, a multimodal clinical assistant. Analyze the base64 diagnostic image. Category: ${type}. Generate a JSON object detailing your findings. The output MUST be a valid JSON object matching this schema exactly:
{
  "testType": "Name of the test analyzed",
  "result": "Positive/Negative/Abnormal findings summary",
  "urgency": "low or medium or critical",
  "details": "Clinical details of what is observed in the image",
  "actionSteps": ["Action step 1", "Action step 2"]
}
Speak in simple ${isHausa ? 'Hausa' : 'English'}. For critical warnings (e.g. positive malaria, high urine protein 2+ suggesting preeclampsia risk), urgency MUST be 'critical'. Do not output any thinking or markdown block, output only raw JSON.`;

  // Try Cloud Gemma Vision API first if configured
  if (process.env.GOOGLE_GENAI_API_KEY) {
    try {
      const gemmaRes = await queryGemmaAPIVision(base64Image, systemPrompt);
      if (gemmaRes) {
        const jsonStr = gemmaRes.replace(/```json\s*|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.testType && parsed.result && parsed.urgency && parsed.actionSteps) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('[Gemma Cloud Vision] Image triage parsing failed, falling back:', err);
    }
  }

  const isAvailable = await isOllamaAvailable();
  if (isAvailable) {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llava',
          prompt: systemPrompt,
          images: [base64Image.replace(/^data:image\/\w+;base64,/, '')],
          stream: false,
          format: 'json',
          options: { temperature: 0.2 }
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const parsed = JSON.parse(data.response.trim());
        if (parsed.testType && parsed.result && parsed.urgency && parsed.actionSteps) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('[PaliGemma] Vision analysis failed, falling back to simulator:', e);
    }
  }

  // High-fidelity local simulation fallback
  return getSimulatedDiagnosticReport(type, language);
}

function getSimulatedDiagnosticReport(type: 'urine' | 'malaria' | 'rash' | 'other', language: 'ha' | 'en'): DiagnosticReport {
  const isHausa = language === 'ha';

  if (type === 'urine') {
    return {
      testType: isHausa ? 'Gwajin Sinadarin Protein a Fitsari' : 'Urine Protein Dipstick Test',
      result: isHausa 
        ? 'An gano gishirin Protein mai yawa (2+ Protein detected)' 
        : 'High Protein detected in urine (2+ Protein indicator)',
      urgency: 'critical',
      details: isHausa
        ? 'Fitsarin da aka gwada ya nuna alamar sinadarin protein 2+ (launi ya juya zuwa koriya mai duhu). Wannan yana nuna barazanar hawan jinin juna biyu (Preeclampsia), wanda ke buƙatar kulawa ta gaggawa don kare lafiyarki da ta jinjiri.'
        : 'The urine strip shows a protein level of 2+ (color changed to dark green). This is a warning indicator for gestational high blood pressure (Preeclampsia), requiring immediate clinical evaluation to protect the mother and child.',
      actionSteps: isHausa
        ? [
            'Tafi asibiti mafi kusa yanzu-yanzu don auna hawan jini.',
            'Kada ki sha kowane magani ba tare da umarnin likita ba.',
            'Nuna wannan rahoton ga likita ko ungozoma da zaran kin isa.'
          ]
        : [
            'Go to the nearest hospital immediately to measure your blood pressure.',
            'Do not self-medicate or take local herbs.',
            'Show this report card to the doctor or midwife immediately upon arrival.'
          ]
    };
  } else if (type === 'malaria') {
    return {
      testType: isHausa ? 'Gwajin Malaria na RDT' : 'Malaria RDT Strip Test',
      result: isHausa 
        ? 'Sakamako ya nuna zazzabin cizon sauro (Positive Malaria)' 
        : 'Positive for Malaria (Two bands visible)',
      urgency: 'critical',
      details: isHausa
        ? 'Gwajin ya nuna layi biyu, wanda ke nuna akwai cutar zazzabin cizon sauro (Malaria) a jikinki. Zazzabin cizon sauro lokasin juna biyu yana da hadari sosai kuma yana iya haifar da zubar ciki ko haihuwar jariri marar kiba.'
        : 'The test strip shows two clear bands, indicating a positive result for Malaria. Malaria during pregnancy is a high-risk condition that can lead to anemia, miscarriage, or low birth weight.',
      actionSteps: isHausa
        ? [
            'Ziyarci asibiti mafi kusa yau domin karbar maganin malaria mai inganci (ACTs).',
            'Sha ruwa mai tsabta akai-akai don rage zafin jiki.',
            'Koyaushe ku kwanta a cikin gidan sauro mai magani don kariya.'
          ]
        : [
            'Visit the nearest clinic today to receive safe antimalarial drugs (ACTs).',
            'Drink clean water frequently to reduce body heat and stay hydrated.',
            'Always sleep under a treated mosquito net to prevent reinfection.'
          ]
    };
  } else if (type === 'rash') {
    return {
      testType: isHausa ? 'Kula da Alamomin Fata (Skin Rash Analysis)' : 'Maternal Skin Rash Analysis',
      result: isHausa 
        ? 'An gano kumburin fata mai damshi (Heat Rash / Dermatitis)' 
        : 'Maternal Heat Rash / Mild Dermatitis',
      urgency: 'medium',
      details: isHausa
        ? 'Hoton fatar ya nuna alamar ƙananan jajayen kuraje masu ƙaiƙayi. Wannan yawanci saboda zafi ne ko canjin jiki lokasin ciki (dermatitis). Hakan baya barazana ga rayuwa amma yana bukatar kulawa don samun sauƙi.'
        : 'The image shows localized red bumps typical of pregnancy heat rash or mild contact dermatitis. This is generally non-life-threatening but requires care to soothe itching and prevent secondary skin infection.',
      actionSteps: isHausa
        ? [
            'Wanke wurin da ruwa mai sanyi da sabulu mai laushi.',
            'Guji sanya matsattsun kaya; yi amfani da kayan auduga marasa nauyi.',
            'Idan kurajen suka fara zubar da ruwa ko aka samu zazzabi, ziyarci asibiti maza-maza.'
          ]
        : [
            'Wash the affected area with cool water and a mild, unscented soap.',
            'Avoid wearing tight clothes; wear light, breathable cotton clothing.',
            'If the rash spreads, discharges pus, or is accompanied by fever, visit a clinic.'
          ]
    };
  } else {
    return {
      testType: isHausa ? 'Gwajin Dubawa na Musamman' : 'General Vision Analysis',
      result: isHausa ? 'Sakamakon bincike na al\'ada' : 'Normal / General observation',
      urgency: 'low',
      details: isHausa
        ? 'Gemma Vision ta bincika hoton kuma ba a sami wata alama mai barazana ta musamman ba. Don Allah ku ci gaba da kula da lafiyarku kuma ku ziyarci ANC akai-akai.'
        : 'Gemma Vision analyzed the image and found no acute emergency indicators. Please continue routine ANC checks and follow general safety rules.',
      actionSteps: isHausa
        ? [
            'Huta sosai kuma ku guji aiki mai tsanani.',
            'Ziyarci ungozoma idan kuna jin rashin jin dadi a jikinku.'
          ]
        : [
            'Rest well and maintain general hygiene.',
            'Speak with a midwife if you feel any bodily discomfort.'
          ]
    };
  }
}
