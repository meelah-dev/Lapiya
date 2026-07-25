import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Modal,
  Alert
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiteRTLMService } from '../services/litert';
import { api, Message, SymptomCard } from '../services/api';

interface ChatScreenProps {
  user: any;
  navigation: any;
  route: any;
}

export default function ChatScreen({ user, navigation, route }: ChatScreenProps) {
  const isHausa = user?.languagePreference === 'ha';
  const initialMsg = route?.params?.initialMessage || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null); // Track which message is speaking

  // Critical Warning Banner State
  const [criticalWarning, setCriticalWarning] = useState<string | null>(null);
  const [activeSymptomCard, setActiveSymptomCard] = useState<SymptomCard | null>(null);

  const [offlineModeActive, setOfflineModeActive] = useState(false);
  const waveIntervalRef = useRef<any>(null);

  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);
  const activeSoundRef = useRef<Audio.Sound | null>(null);

  // Check if offline mode is active on mount
  useEffect(() => {
    const checkOfflineMode = async () => {
      try {
        const useOnDevice = await AsyncStorage.getItem('@lafiya_use_ondevice');
        setOfflineModeActive(useOnDevice === 'true');
      } catch (err) {
        console.log('Error checking offline mode state:', err);
      }
    };
    checkOfflineMode();
  }, []);

  // Initialize expo-av Audio settings to play even when device is on silent/vibrate
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.log('Error configuring Audio setup:', err);
      }
    };
    setupAudio();
  }, []);

  // Diagnostics uploader inline states
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagType, setDiagType] = useState<'urine' | 'malaria' | 'rash'>('urine');
  const [diagImage, setDiagImage] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const handleLoadDiagSample = () => {
    if (diagType === 'urine') {
      setDiagImage(require('../../assets/ultrasound.png'));
    } else if (diagType === 'malaria') {
      setDiagImage(require('../../assets/baby_illustration.png'));
    } else {
      setDiagImage(require('../../assets/profile.png'));
    }
  };

  const handleRunDiag = async () => {
    if (!diagImage || diagLoading) return;
    setDiagLoading(true);

    const userMsgContent = isHausa 
      ? `Na ɗora hoton gwajin (${diagType === 'urine' ? 'fitsari' : diagType === 'malaria' ? 'malaria' : 'kurajen fata'}) don duba alamomi.`
      : `Uploaded a ${diagType} image for AI diagnostic scan.`;
      
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      conversationId: conversationId || '',
      role: 'user',
      content: userMsgContent,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIA...';
      const reportData = await api.diagnose(mockBase64, diagType, user?.languagePreference || 'ha');
      
      const assistantMsg: Message = {
        id: Math.random().toString(),
        conversationId: conversationId || '',
        role: 'assistant',
        content: isHausa ? 'Sakamakon binciken AI:' : 'AI diagnostic result:',
        isDiagnosticCard: true,
        diagnosticReport: reportData,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      // Reset attachment
      setShowDiagnostics(false);
      setDiagImage(null);

      // Auto-read aloud report
      speakMessage(
        assistantMsg.id,
        `${reportData.testType}. Sakamako: ${reportData.result}. Bayani: ${reportData.details}. Shawara: ${reportData.actionSteps.join('. ')}`
      );

      if (reportData.urgency === 'critical') {
        setCriticalWarning(
          isHausa 
            ? '⚠️ SAKAMAKO: Gwajin ya nuna hadari! Ziyarci asibiti maza-maza.'
            : '⚠️ CRITICAL: Diagnostic scan indicates severe markers! Visit a clinic immediately.'
        );
      }
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: Math.random().toString(),
        conversationId: conversationId || '',
        role: 'assistant',
        content: isHausa 
          ? 'Kuskure: An kasa bincika hoton. Sake gwadawa.' 
          : 'Failed to analyze diagnostic photo. Please check connection and try again.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setDiagLoading(false);
    }
  };

  const flatListRef = useRef<FlatList>(null);

  // Initialize and load conversations
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return;
      try {
        const convs = await api.getConversations(user.id);
        if (convs.length > 0) {
          setConversationId(convs[0].id);
          const history = await api.getMessages(convs[0].id);
          setMessages(history);
        }
        
        // If navigated with initial message, send it immediately
        if (initialMsg) {
          sendUserMessage(initialMsg);
        }
      } catch (err) {
        console.error('Failed to init chat', err);
      }
    };
    initializeChat();
  }, [user, initialMsg]);

  // Scroll to end helper
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle Text-To-Speech (TTS)
  const speakMessage = async (msgId: string, text: string) => {
    // 1. Stop if clicking the same speaking bubble
    if (isSpeaking === msgId) {
      if (activeSoundRef.current) {
        try {
          await activeSoundRef.current.stopAsync();
          await activeSoundRef.current.unloadAsync();
        } catch (e) {}
        activeSoundRef.current = null;
      }
      Speech.stop();
      setIsSpeaking(null);
      return;
    }

    // 2. Stop any active speech/sound
    Speech.stop();
    if (activeSoundRef.current) {
      try {
        await activeSoundRef.current.stopAsync();
        await activeSoundRef.current.unloadAsync();
      } catch (e) {}
      activeSoundRef.current = null;
    }
    
    setIsSpeaking(msgId);

    // 3. If offline, use local robotic TTS fallback
    if (offlineModeActive) {
      Speech.speak(text, {
        language: isHausa ? 'ha' : 'en',
        onDone: () => setIsSpeaking(null),
        onError: () => setIsSpeaking(null),
      });
      return;
    }

    // 4. Stream high-fidelity Google Cloud voice online
    try {
      const language = isHausa ? 'ha' : 'en';
      // Strip emojis
      const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodeURIComponent(cleanText.substring(0, 230))}`;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: ttsUrl },
        { shouldPlay: true }
      );
      activeSoundRef.current = sound;
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(null);
          sound.unloadAsync().catch(() => {});
          activeSoundRef.current = null;
        }
      });
    } catch (err) {
      console.error('High fidelity TTS failed, falling back to speech:', err);
      Speech.speak(text, {
        language: isHausa ? 'ha' : 'en',
        onDone: () => setIsSpeaking(null),
        onError: () => setIsSpeaking(null),
      });
    }
  };

  // Clean TTS on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      if (activeSoundRef.current) {
        activeSoundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const sendUserMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    
    // Add user message locally first
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      conversationId: conversationId || '',
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInputText('');
    setLoading(true);

    // 1. Route to LiteRT-LM on-device inference if Offline Mode is active
    if (offlineModeActive) {
      try {
        const localRes = await LiteRTLMService.generateResponse(
          textToSend.trim(),
          user?.trimester || '1',
          user?.languagePreference || 'ha'
        );

        const assistantMsg: Message = {
          id: Math.random().toString(),
          conversationId: conversationId || 'local_conversation',
          role: 'assistant',
          content: localRes.response,
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, assistantMsg]);
        if (autoSpeakEnabled) {
          speakMessage(assistantMsg.id, localRes.response);
        }

        if (localRes.urgency === 'critical') {
          setCriticalWarning(
            isHausa 
              ? '⚠️ DANGER: Sakamakon offline AI ya nuna wannan alamar tana da hadari! Don Allah tafi asibiti.'
              : '⚠️ EMERGENCY: On-device AI indicates this is a critical symptom! Go to a clinic immediately.'
          );
        } else {
          setCriticalWarning(null);
        }
      } catch (err) {
        console.error('Local inference failed:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Otherwise query remote server backend

    try {
      const res = await api.sendMessage(user.id, conversationId, textToSend.trim());
      setConversationId(res.conversationId);
      
      const assistantMsg: Message = {
        id: Math.random().toString(),
        conversationId: res.conversationId,
        role: 'assistant',
        content: res.response,
        createdAt: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      // Automatically speak the response if enabled
      if (autoSpeakEnabled) {
        speakMessage(assistantMsg.id, res.response);
      }

      // Handle Critical Symptom response
      if (res.urgency === 'critical') {
        setCriticalWarning(
          isHausa 
            ? '⚠️ DANGER: Lafiya ta classify wannan a matsayin GAGGAWA! Don Allah tafi asibiti yanzu.'
            : '⚠️ EMERGENCY: This is a critical symptom! Please go to the nearest healthcare center immediately.'
        );
        if (res.autoSymptomCard) {
          setActiveSymptomCard(res.autoSymptomCard);
        }
      } else {
        setCriticalWarning(null);
        setActiveSymptomCard(null);
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      // Fallback message error
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        conversationId: conversationId || '',
        role: 'assistant',
        content: isHausa 
          ? 'Yi hakuri, na kasa haduwa da sabar. Da fatan zaki duba intanet dinki.' 
          : 'Sorry, I failed to reach the server. Please check your connection.',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'processing' | 'speaking'>('listening');
  const [waveformBars, setWaveformBars] = useState<number[]>([15, 30, 20, 45, 10, 25, 35, 15]);

  // Handle live interactive voice input session
  const handleVoiceInput = () => {
    Speech.stop();
    setIsSpeaking(null);
    
    setVoiceStatus('listening');
    setVoiceModalVisible(true);

    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
    }

    // Dynamic wave animation interval
    waveIntervalRef.current = setInterval(() => {
      setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 35) + 10));
    }, 120);
  };

  // Speak voice response inside the modal using high-fidelity google TTS or local Speech
  const speakVoiceResponse = async (msgId: string, text: string) => {
    Speech.stop();
    if (activeSoundRef.current) {
      try {
        await activeSoundRef.current.stopAsync();
        await activeSoundRef.current.unloadAsync();
      } catch (e) {}
      activeSoundRef.current = null;
    }

    setIsSpeaking(msgId);

    const onAudioFinished = () => {
      setIsSpeaking(null);
      setVoiceStatus('listening');
      if (waveIntervalRef.current) {
        clearInterval(waveIntervalRef.current);
      }
      // Re-trigger standard listening visualizer
      waveIntervalRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 35) + 10));
      }, 120);
    };

    // If offline, use local Speech
    if (offlineModeActive) {
      Speech.speak(text, {
        language: isHausa ? 'ha' : 'en',
        onDone: onAudioFinished,
        onError: onAudioFinished,
      });
      return;
    }

    // Stream high fidelity online
    try {
      const language = isHausa ? 'ha' : 'en';
      const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodeURIComponent(cleanText.substring(0, 230))}`;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: ttsUrl },
        { shouldPlay: true }
      );
      activeSoundRef.current = sound;
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          activeSoundRef.current = null;
          onAudioFinished();
        }
      });
    } catch (err) {
      console.error('Voice response TTS failed, falling back:', err);
      Speech.speak(text, {
        language: isHausa ? 'ha' : 'en',
        onDone: onAudioFinished,
        onError: onAudioFinished,
      });
    }
  };

  // User manually stops listening
  const handleStopListening = async () => {
    if (voiceStatus !== 'listening') return;
    
    setVoiceStatus('processing');
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }

    const isFirst = user?.trimester === '1';
    const isSecond = user?.trimester === '2';
    let mockQuery = '';

    if (isHausa) {
      if (isFirst) {
        mockQuery = 'Ina jin yawan tashin zuciya da kasala da safe';
      } else if (isSecond) {
        mockQuery = 'Wane abinci ne mai kyau ga jaririna?';
      } else {
        mockQuery = 'Kafafuna suna kumburi idan na dade a tsaye';
      }
    } else {
      if (isFirst) {
        mockQuery = 'I feel regular morning sickness and exhaustion';
      } else if (isSecond) {
        mockQuery = 'What foods are rich in calcium and iron for pregnancy?';
      } else {
        mockQuery = 'My feet swell up in the evening';
      }
    }

    // Add user message locally
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      conversationId: conversationId || '',
      role: 'user',
      content: mockQuery,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      let responseContent = '';
      let activeConvId = conversationId;

      if (offlineModeActive) {
        const localRes = await LiteRTLMService.generateResponse(
          mockQuery.trim(),
          user?.trimester || '1',
          user?.languagePreference || 'ha'
        );
        responseContent = localRes.response;
      } else {
        const res = await api.sendMessage(user.id, conversationId, mockQuery.trim());
        activeConvId = res.conversationId;
        setConversationId(res.conversationId);
        responseContent = res.response;
      }

      // Add assistant response locally
      const assistantMsg: Message = {
        id: Math.random().toString(),
        conversationId: activeConvId || 'voice_conv',
        role: 'assistant',
        content: responseContent,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Transition to speaking state and start active speaking wave
      setVoiceStatus('speaking');
      waveIntervalRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 30) + 12));
      }, 120);

      await speakVoiceResponse(assistantMsg.id, responseContent);

    } catch (err) {
      console.error('Voice manual submit failed:', err);
      setVoiceStatus('listening');
    }
  };

  // User manually cancels voice session
  const handleCancelVoice = () => {
    setVoiceModalVisible(false);
    Speech.stop();
    if (activeSoundRef.current) {
      activeSoundRef.current.unloadAsync().catch(() => {});
      activeSoundRef.current = null;
    }
    setIsSpeaking(null);
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }
  };

  // User selects preset chip
  const handleSelectPreset = async (text: string) => {
    if (voiceStatus !== 'listening') return;

    setVoiceStatus('processing');
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }

    // Add user message locally
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      conversationId: conversationId || '',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      let responseContent = '';
      let activeConvId = conversationId;

      if (offlineModeActive) {
        const localRes = await LiteRTLMService.generateResponse(
          text.trim(),
          user?.trimester || '1',
          user?.languagePreference || 'ha'
        );
        responseContent = localRes.response;
      } else {
        const res = await api.sendMessage(user.id, conversationId, text.trim());
        activeConvId = res.conversationId;
        setConversationId(res.conversationId);
        responseContent = res.response;
      }

      // Add assistant response locally
      const assistantMsg: Message = {
        id: Math.random().toString(),
        conversationId: activeConvId || 'voice_conv',
        role: 'assistant',
        content: responseContent,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Transition to speaking state and start active speaking wave
      setVoiceStatus('speaking');
      waveIntervalRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 30) + 12));
      }, 120);

      await speakVoiceResponse(assistantMsg.id, responseContent);

    } catch (err) {
      console.error('Voice preset flow failed:', err);
      setVoiceStatus('listening');
    }
  };

  // Clear AI chat history both locally and on the server backend
  const handleClearChat = async () => {
    Alert.alert(
      isHausa ? 'Goge Tattaunawa' : 'Clear Chat History',
      isHausa 
        ? 'Shin kuna da tabbacin kuna son goge duk tattaunawarku da Lafiya?' 
        : 'Are you sure you want to delete all your conversations with Lafiya?',
      [
        { text: isHausa ? 'A\'a' : 'Cancel', style: 'cancel' },
        { 
          text: isHausa ? 'Goge' : 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.clearConversations(user.id);
              setMessages([]);
              setConversationId(null);
              setCriticalWarning(null);
              setActiveSymptomCard(null);
            } catch (err) {
              console.error('Failed to clear chat:', err);
              Alert.alert(
                isHausa ? 'Kuskure' : 'Error',
                isHausa ? 'Kasa goge tattaunawar.' : 'Failed to clear chat.'
              );
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Urgent Warning Banner */}
        {criticalWarning && (
          <View style={styles.warningBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 }}>
              <Ionicons name="warning" size={20} color="#FAF8F5" />
              <Text style={[styles.warningText, { flex: 1, textAlign: 'left' }]}>{criticalWarning}</Text>
            </View>
            <View style={styles.bannerActions}>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => navigation.navigate('Clinics')}
              >
                <Text style={styles.bannerBtnText}>
                  {isHausa ? 'Asibitoci' : 'Find Clinics'}
                </Text>
              </TouchableOpacity>
              {activeSymptomCard && (
                <TouchableOpacity
                  style={[styles.bannerBtn, { backgroundColor: '#FAF8F5' }]}
                  onPress={() => navigation.navigate('SymptomCard', { card: activeSymptomCard })}
                >
                  <Text style={[styles.bannerBtnText, { color: '#C25A3F' }]}>
                    {isHausa ? 'Katin Alama' : 'Symptom Card'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Offline Mode Banner */}
        {offlineModeActive && (
          <View style={styles.offlineStatusBanner}>
            <Ionicons name="airplane" size={12} color="#FAF8F5" />
            <Text style={styles.offlineStatusText}>
              {isHausa ? 'Yana aiki ba tare da intanet ba (Gemma-2B)' : 'Running Offline Mode (Gemma-2B)'}
            </Text>
          </View>
        )}

        {/* Voice Companion Settings & Controls Bar */}
        <View style={styles.controlsBar}>
          <Text style={styles.controlsBarTitle}>
            {isHausa ? 'Zabuka:' : 'Settings Bar:'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.controlToggleBtn, autoSpeakEnabled && styles.controlToggleBtnActive]}
              onPress={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
            >
              <Ionicons 
                name={autoSpeakEnabled ? "volume-high" : "volume-mute-outline"} 
                size={13} 
                color={autoSpeakEnabled ? "#FAF8F5" : "#D37A50"} 
              />
              <Text style={[styles.controlToggleText, autoSpeakEnabled && styles.controlToggleTextActive]}>
                {isHausa ? 'Murya' : 'Auto-Speak'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlToggleBtn, { borderColor: '#C25A3F' }]}
              onPress={handleClearChat}
            >
              <Ionicons 
                name="trash-outline" 
                size={13} 
                color="#C25A3F" 
              />
              <Text style={[styles.controlToggleText, { color: '#C25A3F' }]}>
                {isHausa ? 'Goge Hira' : 'Clear Chat'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            
            // Inline Diagnostic Triage Bubble Card
            if (item.isDiagnosticCard && item.diagnosticReport) {
              const rep = item.diagnosticReport;
              const urgencyColor = rep.urgency === 'critical' ? '#C25A3F' : rep.urgency === 'medium' ? '#E4C599' : '#93966B';
              return (
                <View style={[styles.bubbleWrapper, styles.assistantWrapper]}>
                  <View style={styles.assistantAvatar}>
                    <Text style={styles.avatarLetter}>L</Text>
                  </View>
                  <View style={[styles.inlineReportCard, { borderColor: urgencyColor }]}>
                    <View style={[styles.inlineReportRibbon, { backgroundColor: urgencyColor }]}>
                      <Text style={styles.inlineReportRibbonText}>
                        {isHausa ? 'SAKAMAKON DUBAN AI' : 'AI VISION DIAGNOSIS REPORT'}
                      </Text>
                    </View>

                    <View style={styles.inlineReportContent}>
                      <Text style={styles.inlineReportLabel}>{isHausa ? 'GWADA NAU\'IN:' : 'TEST TYPE:'}</Text>
                      <Text style={styles.inlineReportVal}>{rep.testType}</Text>

                      <Text style={styles.inlineReportLabel}>{isHausa ? 'SAKAMAKO:' : 'FINDINGS:'}</Text>
                      <Text style={[styles.inlineReportVal, { color: urgencyColor, fontWeight: 'bold' }]}>{rep.result}</Text>

                      {/* Listen audio button */}
                      <TouchableOpacity
                        onPress={() => speakMessage(
                          item.id,
                          `${rep.testType}. Sakamako: ${rep.result}. Bayani: ${rep.details}. Shawara: ${rep.actionSteps.join('. ')}`
                        )}
                        style={[styles.inlineAudioBtn, isSpeaking === item.id && styles.inlineAudioBtnActive]}
                        accessibilityLabel="Listen Report"
                      >
                        <Ionicons name={isSpeaking === item.id ? "stop-circle" : "volume-high"} size={14} color="#FAF8F5" />
                        <Text style={styles.inlineAudioBtnText}>
                          {isSpeaking === item.id 
                            ? (isHausa ? 'Tsaya' : 'Stop') 
                            : (isHausa ? 'Saurara' : 'Listen')}
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.inlineReportLabel}>{isHausa ? 'BAYANI:' : 'DETAILS:'}</Text>
                      <Text style={styles.inlineReportDetails}>{rep.details}</Text>

                      <Text style={styles.inlineReportLabel}>{isHausa ? 'ABIN YIN GANGADI:' : 'RECOMMENDED ACTION STEPS:'}</Text>
                      {rep.actionSteps.map((step: string, idx: number) => (
                        <View key={idx} style={styles.inlineStepRow}>
                          <Ionicons 
                            name={rep.urgency === 'critical' ? 'alert-circle' : 'checkmark-circle'} 
                            size={14} 
                            color={urgencyColor} 
                            style={{ marginTop: 2 }}
                          />
                          <Text style={styles.inlineStepText}>{step}</Text>
                        </View>
                      ))}

                      {rep.urgency === 'critical' && (
                        <TouchableOpacity 
                          style={styles.inlineClinicBtn}
                          onPress={() => navigation.navigate('Clinics')}
                        >
                          <Text style={styles.inlineClinicBtnText}>
                            {isHausa ? 'Nemo Asibiti Maza-Maza' : 'Find Clinics Now'}
                          </Text>
                          <Ionicons name="arrow-forward" size={14} color="#FAF8F5" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
                {!isUser && (
                  <View style={styles.assistantAvatar}>
                    <Text style={styles.avatarLetter}>L</Text>
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
                    {item.content}
                  </Text>
                  {!isUser && (
                    <TouchableOpacity
                      onPress={() => speakMessage(item.id, item.content)}
                      style={styles.speakerIconContainer}
                      accessibilityLabel="Speak Out"
                    >
                      <Ionicons
                        name={isSpeaking === item.id ? 'stop-circle-outline' : 'volume-high-outline'}
                        size={20}
                        color="#93966B"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContainer}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isHausa 
                  ? 'Sannu yar uwa! Ni ce Lafiya, mai taimaka muku. Kuna iya magana da ni a murya ko rubutu.' 
                  : 'Hello my sister! I am Lafiya, your maternal assistant. You can speak to me or type your question.'}
              </Text>
            </View>
          }
        />

        {/* Inline Diagnostic Picker Panel */}
        {showDiagnostics && (
          <View style={styles.inlineDiagnosticPanel}>
            <View style={styles.diagnosticPanelHeader}>
              <Text style={styles.diagnosticPanelTitle}>
                {isHausa ? 'Binciken Hoto (PaliGemma Triage)' : 'Photo Triage (PaliGemma Triage)'}
              </Text>
              <TouchableOpacity onPress={() => setShowDiagnostics(false)} style={styles.closePanelBtn}>
                <Ionicons name="close" size={18} color="#C25A3F" />
              </TouchableOpacity>
            </View>

            {/* Selector Tabs */}
            <View style={styles.panelTabs}>
              <TouchableOpacity 
                style={[styles.panelTab, diagType === 'urine' && styles.panelTabActive]}
                onPress={() => { setDiagType('urine'); setDiagImage(null); }}
              >
                <Text style={[styles.panelTabText, diagType === 'urine' && styles.panelTabTextActive]}>Urine Strip</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.panelTab, diagType === 'malaria' && styles.panelTabActive]}
                onPress={() => { setDiagType('malaria'); setDiagImage(null); }}
              >
                <Text style={[styles.panelTabText, diagType === 'malaria' && styles.panelTabTextActive]}>Malaria RDT</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.panelTab, diagType === 'rash' && styles.panelTabActive]}
                onPress={() => { setDiagType('rash'); setDiagImage(null); }}
              >
                <Text style={[styles.panelTabText, diagType === 'rash' && styles.panelTabTextActive]}>Skin Rash</Text>
              </TouchableOpacity>
            </View>

            {/* Actions Row */}
            <View style={styles.panelActionRow}>
              {diagImage ? (
                <View style={styles.attachedThumbnailWrapper}>
                  <Image source={diagImage} style={styles.attachedThumbnail} />
                  <Text style={styles.attachedText} numberOfLines={1}>
                    {isHausa ? 'Hoto a haɗe' : 'Attached'}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.loadSampleBtn} onPress={handleLoadDiagSample}>
                  <Ionicons name="images-outline" size={16} color="#D37A50" />
                  <Text style={styles.loadSampleBtnText}>{isHausa ? 'Load Sample' : 'Load Sample'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.runDiagBtn, !diagImage && styles.runDiagBtnDisabled]} 
                onPress={handleRunDiag}
                disabled={!diagImage || diagLoading}
              >
                {diagLoading ? (
                  <ActivityIndicator size="small" color="#FAF8F5" />
                ) : (
                  <Text style={styles.runDiagBtnText}>{isHausa ? 'Bincika Hoto' : 'Analyze Vision'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Typing Indicator Bubble */}
        {loading && (
          <View style={styles.typingContainer}>
            <View style={styles.assistantAvatar}>
              <Text style={styles.avatarLetter}>L</Text>
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>
                {isHausa ? 'Lafiya tana rubutawa...' : 'Lafiya is typing...'}
              </Text>
              <ActivityIndicator size="small" color="#93966B" style={{ marginLeft: 4 }} />
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setShowDiagnostics(!showDiagnostics)}
            accessibilityLabel="Scan Test"
          >
            <Ionicons name="camera-outline" size={22} color="#D37A50" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isHausa ? 'Rubuta tambaya a nan...' : 'Type a question here...'}
            placeholderTextColor="#A09890"
            multiline
            accessibilityLabel="Chat Input"
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => sendUserMessage(inputText)}
              accessibilityLabel="Send Button"
            >
              <Ionicons name="send" size={18} color="#FAF8F5" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={handleVoiceInput}
              accessibilityLabel="Voice Button"
            >
              {isRecording ? (
                <ActivityIndicator color="#FAF8F5" size="small" />
              ) : (
                <Ionicons name="mic" size={20} color="#FAF8F5" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Interactive Voice Consultation Modal */}
        <Modal
          visible={voiceModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setVoiceModalVisible(false)}
        >
          <View style={styles.voiceModalOverlay}>
            <View style={styles.voiceModalContent}>
              <Text style={styles.voiceModalTitle}>
                {isHausa ? 'Tattaunawa da Lafiya' : 'Lafiya Voice Consultation'}
              </Text>
              
              {/* Pulsing mic icon (Manually triggers send on tap) */}
              <TouchableOpacity 
                style={styles.micCircleContainer} 
                onPress={handleStopListening}
                disabled={voiceStatus !== 'listening'}
              >
                <View style={[styles.micCircleGlow, voiceStatus === 'listening' && styles.micCircleGlowActive]}>
                  <View style={styles.micCircleInner}>
                    <Ionicons 
                      name={voiceStatus === 'processing' ? "hourglass-outline" : voiceStatus === 'speaking' ? "volume-high" : "mic"} 
                      size={32} 
                      color="#FAF8F5" 
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Status subtitle */}
              <Text style={styles.voiceStatusText}>
                {voiceStatus === 'listening' 
                  ? (isHausa ? 'Lafiya tana sauraron ku...' : 'Lafiya is listening...') 
                  : voiceStatus === 'processing'
                  ? (isHausa ? 'Tana auna muryar ku...' : 'Analyzing your voice...')
                  : (isHausa ? 'Lafiya tana magana...' : 'Lafiya is speaking...')}
              </Text>

              {/* Dynamic waveform visualizer */}
              {(voiceStatus === 'listening' || voiceStatus === 'speaking') && (
                <View style={styles.waveformContainer}>
                  {waveformBars.map((height, idx) => (
                    <View 
                      key={idx} 
                      style={[styles.waveformBar, { height: height }]} 
                    />
                  ))}
                </View>
              )}

              {/* Quick Interactive Presets */}
              <View style={styles.presetsWrapper}>
                <Text style={styles.presetsTitle}>
                  {isHausa ? 'Katsalandan ko Zabi Wata Alama:' : 'Or tap a preset topic to speak:'}
                </Text>
                <View style={styles.presetsGrid}>
                  {(isHausa 
                    ? [
                        { label: '🩺 Zazzabi da Ciwon Kai', text: 'Ina jin zazzabi mai zafi da ciwon kai' },
                        { label: '🥦 Abinci Mai Kyau', text: 'Wane irin abinci ne ya kamata in ci a halin yanzu?' },
                        { label: '🚶‍♀️ Motsa Jiki Safe', text: 'Wane irin motsa jiki ne mai lafiya a yanzu?' }
                      ]
                    : [
                        { label: '🩺 Swelling & Headache', text: 'I have swollen legs and a severe headache' },
                        { label: '🥦 Safe Local Foods', text: 'What local nutrition is best for my baby?' },
                        { label: '🚶‍♀️ Safe Exercises', text: 'What daily exercises can I do safely?' }
                      ]
                  ).map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.presetChip, voiceStatus !== 'listening' && { opacity: 0.5 }]}
                      onPress={() => handleSelectPreset(preset.text)}
                      disabled={voiceStatus !== 'listening'}
                    >
                      <Text style={styles.presetChipText}>{preset.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity 
                style={styles.voiceCloseBtn}
                onPress={handleCancelVoice}
              >
                <Text style={styles.voiceCloseBtnText}>
                  {isHausa ? 'Soke' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  keyboardContainer: {
    flex: 1,
  },
  warningBanner: {
    backgroundColor: '#C25A3F',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  warningText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  bannerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  bannerBtn: {
    backgroundColor: 'rgba(250, 248, 245, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bannerBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  assistantWrapper: {
    alignSelf: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#93966B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarLetter: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#D37A50',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FAF8F5',
  },
  assistantText: {
    color: '#2E2A25',
  },
  speakerIconContainer: {
    alignSelf: 'flex-end',
    marginTop: 6,
    padding: 2,
  },
  speakerIcon: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#93966B',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E4C599',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#2E2A25',
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D37A50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#FAF8F5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#93966B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#C25A3F',
  },
  voiceIcon: {
    fontSize: 18,
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
  },
  // Inline Diagnostics Picker Styles
  inlineDiagnosticPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4C599',
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  diagnosticPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosticPanelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  closePanelBtn: {
    padding: 2,
  },
  panelTabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  panelTab: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  panelTabActive: {
    backgroundColor: '#D37A50',
    borderColor: '#D37A50',
  },
  panelTabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D37A50',
  },
  panelTabTextActive: {
    color: '#FAF8F5',
  },
  panelActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  loadSampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D37A50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  loadSampleBtnText: {
    color: '#D37A50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attachedThumbnailWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachedThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  attachedText: {
    fontSize: 11,
    color: '#93966B',
    fontWeight: '600',
    maxWidth: 80,
  },
  runDiagBtn: {
    backgroundColor: '#D37A50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  runDiagBtnDisabled: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  runDiagBtnText: {
    color: '#FAF8F5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Inline Report Card message bubble styles
  inlineReportCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginRight: 24,
    marginLeft: 8,
  },
  inlineReportRibbon: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  inlineReportRibbonText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  inlineReportContent: {
    padding: 12,
  },
  inlineReportLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A09890',
    marginTop: 6,
    marginBottom: 2,
  },
  inlineReportVal: {
    fontSize: 12,
    color: '#2E2A25',
    fontWeight: '600',
  },
  inlineAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#93966B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  inlineAudioBtnActive: {
    backgroundColor: '#C25A3F',
  },
  inlineAudioBtnText: {
    color: '#FAF8F5',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inlineReportDetails: {
    fontSize: 12,
    color: '#2E2A25',
    lineHeight: 18,
  },
  inlineStepRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    alignItems: 'flex-start',
  },
  inlineStepText: {
    fontSize: 11,
    color: '#2E2A25',
    flex: 1,
    lineHeight: 16,
  },
  inlineClinicBtn: {
    flexDirection: 'row',
    backgroundColor: '#C25A3F',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  inlineClinicBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 11,
  },
  offlineStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#93966B',
    paddingVertical: 4,
    gap: 4,
  },
  offlineStatusText: {
    color: '#FAF8F5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(46, 42, 37, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  voiceModalContent: {
    backgroundColor: '#FAF8F5',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginBottom: 20,
  },
  micCircleContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micCircleGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(211, 122, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micCircleGlowActive: {
    backgroundColor: 'rgba(211, 122, 80, 0.4)',
  },
  micCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D37A50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#D37A50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  voiceStatusText: {
    fontSize: 14,
    color: '#D37A50',
    fontWeight: '600',
    marginBottom: 20,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 6,
    marginBottom: 24,
  },
  waveformBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#93966B',
  },
  presetsWrapper: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4C599',
    marginBottom: 24,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A09890',
    marginBottom: 12,
    textAlign: 'center',
  },
  presetsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 12,
    color: '#2E2A25',
    fontWeight: '500',
  },
  voiceCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  voiceCloseBtnText: {
    color: '#C25A3F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  typingText: {
    fontSize: 13,
    color: '#A09890',
    fontStyle: 'italic',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderColor: '#E4C599',
  },
  controlsBarTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A09890',
  },
  controlToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D37A50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
  },
  controlToggleBtnActive: {
    backgroundColor: '#D37A50',
  },
  controlToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D37A50',
  },
  controlToggleTextActive: {
    color: '#FAF8F5',
  },
});
