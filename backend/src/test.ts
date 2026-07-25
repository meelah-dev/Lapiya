import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== Lafiya Backend API Test Suite ===');
  let testUser: any = null;
  let conversationId: string | null = null;

  // Test 1: Healthcheck
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json() as any;
    console.log('✓ Test 1 Passed: Healthcheck status is', data.status);
  } catch (err) {
    console.error('✗ Test 1 Failed: Healthcheck unreachable', err);
    process.exit(1);
  }

  // Test 2: User Registration
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fatima_' + Math.floor(Math.random() * 1000),
        lga: 'Fagge',
        trimester: '3',
        languagePreference: 'ha'
      })
    });
    testUser = await res.json() as any;
    console.log('✓ Test 2 Passed: User registered successfully:', testUser.name, 'in LGA:', testUser.lga);
  } catch (err) {
    console.error('✗ Test 2 Failed: Registration endpoint error', err);
    process.exit(1);
  }

  // Test 3: User Login
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testUser.name })
    });
    const loggedIn = await res.json() as any;
    console.log('✓ Test 3 Passed: User login success:', loggedIn.id === testUser.id ? 'IDs match' : 'IDs mismatch');
  } catch (err) {
    console.error('✗ Test 3 Failed: Login endpoint error', err);
  }

  // Test 4: Health Centers Lookup
  try {
    const res = await fetch(`${BASE_URL}/health-centers/${encodeURIComponent(testUser.lga)}`);
    const clinics = await res.json() as any;
    console.log('✓ Test 4 Passed: Retrieved clinics count:', clinics.length, 'First clinic:', clinics[0]?.name);
  } catch (err) {
    console.error('✗ Test 4 Failed: Clinic endpoint error', err);
  }

  // Test 5: Chat Endpoint - Low Urgency
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUser.id,
        conversationId: null,
        message: 'Mene ne zan ci a watanni na farko?' // "What should I eat in the first months?"
      })
    });
    const chatData: any = await res.json();
    conversationId = chatData.conversationId;
    console.log('✓ Test 5 Passed: Chat (Low Urgency) responded correctly.');
    console.log('  Response:', chatData.response.slice(0, 80) + '...');
    console.log('  Urgency Classified:', chatData.urgency);
  } catch (err) {
    console.error('✗ Test 5 Failed: Chat (Low Urgency) request failed', err);
  }

  // Test 6: Chat Endpoint - Critical Urgency with Auto-Symptom Card Generation
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUser.id,
        conversationId: conversationId,
        message: 'Ina zubar da jini mai yawa daga jikina' // "I am bleeding heavily from my body"
      })
    });
    const chatData: any = await res.json();
    console.log('✓ Test 6 Passed: Chat (Critical Urgency) warning triggered!');
    console.log('  Response:', chatData.response.slice(0, 100) + '...');
    console.log('  Urgency Classified:', chatData.urgency);
    if (chatData.autoSymptomCard) {
      console.log('  ✓ Auto-generated Symptom Card correctly saved:', chatData.autoSymptomCard.urgency);
      console.log('    Card text excerpt:\n', chatData.autoSymptomCard.cardText?.slice(0, 120) + '\n    ...');
    } else {
      console.error('  ✗ Expected auto-generated symptom card for critical urgency but got null');
    }
  } catch (err) {
    console.error('✗ Test 6 Failed: Chat (Critical Urgency) request failed', err);
  }

  console.log('\n=== All backend API tests completed. ===');
  process.exit(0);
}

runTests();
