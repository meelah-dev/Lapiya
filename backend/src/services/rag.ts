import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config();

// Knowledge Base types
export interface Document {
  id: string;
  category: string;
  language: 'ha' | 'en';
  title: string;
  content: string;
}

// In-Memory Backup Vector Store for zero-setup local execution
class InMemoryVectorStore {
  private documents: Document[] = [];

  async addDocuments(docs: Document[]) {
    this.documents.push(...docs);
  }

  // A simple TF-IDF / Jaccard similarity search fallback
  async search(query: string, language: 'ha' | 'en', limit = 3): Promise<Document[]> {
    const filtered = this.documents.filter(d => d.language === language);
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    if (queryTerms.length === 0) {
      return filtered.slice(0, limit);
    }

    const scored = filtered.map(doc => {
      const docText = `${doc.title} ${doc.content}`.toLowerCase();
      let score = 0;
      for (const term of queryTerms) {
        if (docText.includes(term)) {
          // Exact term match
          score += 1.0;
          // Count occurrences
          const regex = new RegExp(term, 'g');
          const matches = docText.match(regex);
          if (matches) score += matches.length * 0.1;
        }
      }
      // Boost if category matches query keywords
      if (query.toLowerCase().includes(doc.category.toLowerCase())) {
        score += 2.0;
      }
      return { doc, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.doc);
  }

  getAll() {
    return this.documents;
  }
}

const backupStore = new InMemoryVectorStore();
let chromaClient: ChromaClient | null = null;
let collection: any = null;

const CHROMA_PATH = process.env.CHROMA_URL || 'http://localhost:8000';

async function initChroma() {
  try {
    chromaClient = new ChromaClient({ path: CHROMA_PATH });
    // Attempt a simple heartbeat to check connection
    await chromaClient.heartbeat();
    console.log(`[RAG] Connected to ChromaDB at ${CHROMA_PATH}`);
    collection = await chromaClient.getOrCreateCollection({
      name: 'lafiya_maternal_health',
    });
  } catch (err) {
    console.log('[RAG] ChromaDB not available. Using robust In-Memory local vector search.');
    chromaClient = null;
    collection = null;
  }
}

// Initialize on load
initChroma();

export async function addDocumentsToVectorStore(docs: Document[]) {
  // Always seed the backup store
  await backupStore.addDocuments(docs);

  if (collection) {
    try {
      const ids = docs.map(d => d.id);
      const metadatas = docs.map(d => ({ category: d.category, language: d.language, title: d.title }));
      const documents = docs.map(d => d.content);
      
      // We let ChromaDB use its default embedding function
      await collection.add({
        ids,
        metadatas,
        documents,
      });
      console.log(`[RAG] Successfully added ${docs.length} documents to ChromaDB.`);
    } catch (err) {
      console.error('[RAG] Error adding to ChromaDB, falling back to backup store:', err);
    }
  }
}

export async function queryKnowledgeBase(query: string, language: 'ha' | 'en', limit = 3): Promise<Document[]> {
  if (collection) {
    try {
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit,
        where: { language },
      });

      if (results && results.documents && results.documents[0] && results.documents[0].length > 0) {
        const docs: Document[] = [];
        for (let i = 0; i < results.documents[0].length; i++) {
          const content = results.documents[0][i];
          const metadata = results.metadatas[0][i];
          const id = results.ids[0][i];
          docs.push({
            id,
            category: metadata.category,
            language: metadata.language,
            title: metadata.title,
            content,
          });
        }
        return docs;
      }
    } catch (err) {
      console.error('[RAG] ChromaDB query failed, using backup store:', err);
    }
  }

  // Fallback to local memory search
  return backupStore.search(query, language, limit);
}

export function getAllStoredDocuments() {
  return backupStore.getAll();
}
