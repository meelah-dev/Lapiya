import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { api } from '../services/api';

interface MaternalGuideScreenProps {
  route: any;
  navigation: any;
  user: any;
}

export default function MaternalGuideScreen({ route, navigation, user }: MaternalGuideScreenProps) {
  const isHausa = user?.languagePreference === 'ha';

  const [guideData, setGuideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'food' | 'exercise' | 'avoid' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load trimester recommendations
  useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      try {
        const res = await api.getRecommendations(user?.trimester || '1', user?.languagePreference || 'ha');
        setGuideData(res);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [user?.trimester, user?.languagePreference]);

  // Audio synthesis read-aloud logic
  const handleSpeak = (textList: string[]) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToSpeak = textList.join('. ');
      Speech.speak(textToSpeak, {
        language: isHausa ? 'ha-NG' : 'en-US',
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  // Stop reading if modal closes
  const closeDetails = () => {
    Speech.stop();
    setIsSpeaking(false);
    setSelectedCategory(null);
  };

  const getCategoryDetails = () => {
    if (!guideData || !selectedCategory) return null;
    if (selectedCategory === 'food') {
      return {
        title: isHausa ? 'Abinci da Sinadirai' : 'Maternal Nutrition',
        image: require('../../assets/guide_nutrition.png'),
        items: guideData.foods,
        icon: 'nutrition',
        color: '#93966B'
      };
    } else if (selectedCategory === 'exercise') {
      return {
        title: isHausa ? 'Motsa Jiki Lafiyayye' : 'Safe Exercise Routines',
        image: require('../../assets/guide_exercise.png'),
        items: guideData.exercises,
        icon: 'body',
        color: '#D37A50'
      };
    } else {
      return {
        title: isHausa ? 'Abubuwan Gujewa' : 'Precautions & Avoidance',
        image: require('../../assets/guide_safety.png'),
        items: guideData.avoid,
        icon: 'warning',
        color: '#C25A3F'
      };
    }
  };

  const details = getCategoryDetails();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go Back">
          <Ionicons name="arrow-back" size={24} color="#2E2A25" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isHausa ? 'Jagoran Ciki na AI' : 'AI Pregnancy Guide'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D37A50" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.introText}>
            {isHausa 
              ? `An keɓance muku wadannan jagororin lafiya da abinci don Trimester ${user?.trimester || '1'} na ku.` 
              : `These safety and nutrition guidelines are personalized for your Trimester ${user?.trimester || '1'} stage.`}
          </Text>

          {/* Card 1: Nutrition */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => setSelectedCategory('food')}
            accessibilityLabel="Nutrition Guide Card"
          >
            <Image source={require('../../assets/guide_nutrition.png')} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <View style={styles.badge}>
                <Ionicons name="nutrition" size={14} color="#FAF8F5" />
                <Text style={styles.badgeText}>{isHausa ? 'Abinci' : 'Nutrition'}</Text>
              </View>
              <Text style={styles.cardTitle}>{isHausa ? 'Abinci da Sinadirai' : 'Maternal Nutrition'}</Text>
              <Text style={styles.cardSubtitle}>
                {isHausa ? 'Gano abinci masu gina jiki na gida don Trimester dinki.' : 'Local ingredients and meal advice for you and baby.'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Exercise */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => setSelectedCategory('exercise')}
            accessibilityLabel="Exercise Guide Card"
          >
            <Image source={require('../../assets/guide_exercise.png')} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <View style={[styles.badge, { backgroundColor: '#D37A50' }]}>
                <Ionicons name="body" size={14} color="#FAF8F5" />
                <Text style={styles.badgeText}>{isHausa ? 'Motsa Jiki' : 'Exercise'}</Text>
              </View>
              <Text style={styles.cardTitle}>{isHausa ? 'Motsa Jiki Lafiyayye' : 'Safe Exercise Routines'}</Text>
              <Text style={styles.cardSubtitle}>
                {isHausa ? 'Ayyukan motsa jiki mafi tsaro don kiyaye kuzari.' : 'Trimester-safe physical routines to prepare for labor.'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Avoid */}
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => setSelectedCategory('avoid')}
            accessibilityLabel="Avoid Guide Card"
          >
            <Image source={require('../../assets/guide_safety.png')} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <View style={[styles.badge, { backgroundColor: '#C25A3F' }]}>
                <Ionicons name="warning" size={14} color="#FAF8F5" />
                <Text style={styles.badgeText}>{isHausa ? 'Guje Wa' : 'Avoid'}</Text>
              </View>
              <Text style={styles.cardTitle}>{isHausa ? 'Abubuwan Gujewa' : 'Precautions & Safety'}</Text>
              <Text style={styles.cardSubtitle}>
                {isHausa ? 'Kiyaye hadari da ayyuka masu wuya lokacin juna biyu.' : 'Critical warning signs and things to avoid to stay safe.'}
              </Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      )}

      {/* Details Slide-up Modal */}
      <Modal
        visible={selectedCategory !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetails}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContainer}>
            {details && (
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{details.title}</Text>
                  <TouchableOpacity onPress={closeDetails} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#2E2A25" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  <Image source={details.image} style={styles.modalImage} />

                  {/* Read-Aloud Voice Assistant Button */}
                  <TouchableOpacity 
                    style={[styles.audioBtn, isSpeaking && styles.audioBtnActive]}
                    onPress={() => handleSpeak(details.items)}
                    accessibilityLabel="Speak Guide Audio"
                  >
                    <Ionicons name={isSpeaking ? "stop-circle" : "volume-high"} size={20} color="#FAF8F5" />
                    <Text style={styles.audioBtnText}>
                      {isSpeaking 
                        ? (isHausa ? 'Tsakar da Karantawa' : 'Stop Speaking') 
                        : (isHausa ? 'Saurari Karantawa' : 'Listen Aloud')}
                    </Text>
                  </TouchableOpacity>

                  {/* Recommendations list */}
                  <View style={styles.itemsWrapper}>
                    {details.items.map((item: string, idx: number) => (
                      <View key={idx} style={styles.itemRow}>
                        <Ionicons 
                          name={selectedCategory === 'avoid' ? "close-circle" : "checkmark-circle"} 
                          size={22} 
                          color={details.color} 
                          style={{ marginTop: 2 }}
                        />
                        <Text style={styles.itemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E4C599',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginLeft: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 14,
    color: '#93966B',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E4C599',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardOverlay: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#93966B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FAF8F5',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#A09890',
    lineHeight: 18,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(46, 42, 37, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E4C599',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
  },
  audioBtn: {
    flexDirection: 'row',
    backgroundColor: '#D37A50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  audioBtnActive: {
    backgroundColor: '#C25A3F',
  },
  audioBtnText: {
    color: '#FAF8F5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  itemText: {
    fontSize: 14,
    color: '#2E2A25',
    flex: 1,
    lineHeight: 20,
  },
});
