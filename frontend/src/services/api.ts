import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Interfaces matching backend models
export interface User {
  id: string;
  name: string;
  lga: string;
  trimester: string;
  languagePreference: 'ha' | 'en';
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isDiagnosticCard?: boolean;
  diagnosticReport?: {
    testType: string;
    result: string;
    urgency: 'low' | 'medium' | 'critical';
    details: string;
    actionSteps: string[];
  };
}

export interface SymptomCard {
  id: string;
  userId: string;
  symptoms: string[];
  urgency: 'low' | 'medium' | 'critical';
  actionStep: string;
  createdAt: string;
  cardText?: string; // Generated card format
}

export interface HealthCenter {
  name: string;
  address: string;
  distance: string;
  lga: string;
}

// Configurable API Base URL. 
// Uses 10.0.2.2 for Android Emulator, localhost for iOS/Web, or custom ENV.
const getBaseUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_URL;
  
  if (!url) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      url = `http://${ip}:3000`;
    } else if (typeof window !== 'undefined' && window.location) {
      url = `http://${window.location.hostname}:3000`;
    } else {
      url = 'http://localhost:3000';
    }
  }

  // Rewrite localhost/127.0.0.1 on Android emulator to host system mapping
  if (Platform.OS === 'android' && url.includes('localhost')) {
    return url.replace('localhost', '10.0.2.2');
  }
  if (Platform.OS === 'android' && url.includes('127.0.0.1')) {
    return url.replace('127.0.0.1', '10.0.2.2');
  }

  if (url.includes('192.168.1.101')) {
    url = url.replace('192.168.1.101', '172.20.10.4');
  }

  return url;
};

const BASE_URL = getBaseUrl();
console.log('[Lafiya API] BASE_URL is set to:', BASE_URL);

export const api = {
  async register(name: string, lga: string, trimester: string, languagePreference: 'ha' | 'en'): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, lga, trimester, languagePreference }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async login(name: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async getRecommendations(trimester: string, lang: 'ha' | 'en'): Promise<{
    exercises: string[];
    foods: string[];
    avoid: string[];
    reminders: { title: string; subtitle: string; time: string; type: string }[];
  }> {
    const res = await fetch(`${BASE_URL}/auth/recommendations?trimester=${trimester}&lang=${lang}`);
    if (!res.ok) {
      throw new Error('Failed to fetch recommendations');
    }
    return res.json();
  },

  async diagnose(image: string, type: 'urine' | 'malaria' | 'rash' | 'other', lang: 'ha' | 'en'): Promise<{
    testType: string;
    result: string;
    urgency: 'low' | 'medium' | 'critical';
    details: string;
    actionSteps: string[];
  }> {
    const res = await fetch(`${BASE_URL}/auth/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, type, lang }),
    });
    if (!res.ok) {
      throw new Error('Diagnosis failed');
    }
    return res.json();
  },

  async sendMessage(
    userId: string,
    conversationId: string | null,
    message: string
  ): Promise<{
    conversationId: string;
    response: string;
    urgency: 'low' | 'medium' | 'critical';
    autoSymptomCard: SymptomCard | null;
  }> {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, conversationId, message }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  async createSymptomCard(userId: string, symptoms: string[], urgency: 'low' | 'medium' | 'critical'): Promise<SymptomCard> {
    const res = await fetch(`${BASE_URL}/symptom-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, symptoms, urgency }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create symptom card');
    }
    return res.json();
  },

  async getHealthCenters(lga: string): Promise<HealthCenter[]> {
    const res = await fetch(`${BASE_URL}/health-centers/${encodeURIComponent(lga)}`);
    if (!res.ok) {
      throw new Error('Failed to fetch health centers');
    }
    return res.json();
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    const res = await fetch(`${BASE_URL}/conversations/${userId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return res.json();
  },

  async clearConversations(userId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/conversations/${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error('Failed to clear conversations');
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`${BASE_URL}/messages/${conversationId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch messages');
    }
    return res.json();
  }
};
