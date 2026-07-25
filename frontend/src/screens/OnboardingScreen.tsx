import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onOnboardComplete: (user: any) => void;
}

export default function OnboardingScreen({ onOnboardComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Registration States
  const [name, setName] = useState('');
  const [lga, setLga] = useState('');
  const [trimester, setTrimester] = useState<'1' | '2' | '3'>('1');
  const [lang, setLang] = useState<'ha' | 'en'>('ha');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isHausa = lang === 'ha';

  const slides = [
    {
      image: require('../../assets/logo.png'),
      title: isHausa ? 'Barka da Zuwa Lafiya' : 'Welcome to Lafiya',
      subtitle: isHausa 
        ? 'Abokin tafiyar ku na musamman don kiyaye lafiyar juna biyu da jinjiri a kowane lokaci.'
        : 'Your dedicated companion ensuring safe maternal care and pregnancy monitoring offline.'
    },
    {
      image: require('../../assets/intro_advisor.png'),
      title: isHausa ? 'Tuntuba Cikin Sauki' : 'Wise Caring Companion',
      subtitle: isHausa
        ? 'Yi magana da Lafiya AI a murya ko rubutu cikin Hausa ko Turanci don samun shawarwari ingantattu.'
        : 'Talk to Lafiya AI via voice or text in simple Hausa or English for grounded medical guidance.'
    },
    {
      image: require('../../assets/intro_clinic.png'),
      title: isHausa ? 'Katin Alamomi da Asibitoci' : 'Symptom Triage & Clinics',
      subtitle: isHausa
        ? 'Bincika alamun rashin lafiya, samar da katin nuna wa ma\'aikacin lafiya, da nemo asibiti mafi kusa.'
        : 'Classify warning signs, auto-generate report cards to show a nurse, and find local primary clinics.'
    }
  ];

  const handleRegister = async () => {
    if (!name.trim()) {
      setError(isHausa ? 'Don Allah shigar da sunanki' : 'Please enter your name');
      return;
    }
    if (!lga.trim()) {
      setError(isHausa ? 'Don Allah shigar da sunan LGA na ku' : 'Please enter your LGA');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let user;
      try {
        user = await api.register(name.trim(), lga.trim(), trimester, lang);
      } catch (regErr) {
        user = await api.login(name.trim());
      }
      onOnboardComplete(user);
    } catch (err: any) {
      setError(isHausa 
        ? 'An samu matsala wajen haɗawa. Don Allah a sake gwadawa.' 
        : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setCurrentSlide(3); // Go to registration form
    }
  };

  // Render Walkthrough Slides
  if (currentSlide < 3) {
    const slide = slides[currentSlide];
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.slideHeader}>
          {/* Language toggle shown on intro pages too */}
          <View style={styles.langSelector}>
            <TouchableOpacity onPress={() => setLang('ha')} style={[styles.langBtn, lang === 'ha' && styles.langBtnActive]}>
              <Text style={[styles.langText, lang === 'ha' && styles.langTextActive]}>HA</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}>
              <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setCurrentSlide(3)} style={styles.skipBtn}>
            <Text style={styles.skipText}>{isHausa ? 'Guji ➔' : 'Skip ➔'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
          <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        </ScrollView>

        <View style={styles.slideFooter}>
          {/* Indicator Dots */}
          <View style={styles.dotsRow}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, currentSlide === i && styles.dotActive]} />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} accessibilityLabel="Next Slide Button">
            <Text style={styles.nextBtnText}>{isHausa ? 'Gaba' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render Registration Form (Slide 3)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.safeContainer}
    >
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setCurrentSlide(2)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2E2A25" />
        </TouchableOpacity>
        <Text style={styles.formHeaderTitle}>{isHausa ? 'Koma Baya' : 'Back'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Lafiya</Text>
          <Text style={styles.subtitle}>
            {isHausa ? 'Kafa bayanan uwar gida' : 'Setup your maternal profile'}
          </Text>
        </View>

        <View style={styles.card}>
          {/* Name Input */}
          <Text style={styles.label}>
            {isHausa ? 'Sunanki' : 'Your Name'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={isHausa ? 'Misali: Amina' : 'e.g. Amina'}
            placeholderTextColor="#A09890"
            value={name}
            onChangeText={setName}
            accessibilityLabel="Name Input"
          />

          {/* LGA Input */}
          <Text style={styles.label}>
            {isHausa ? 'Karamar Hukuma (LGA)' : 'Local Government Area (LGA)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={isHausa ? 'Misali: Fagge' : 'e.g. Fagge'}
            placeholderTextColor="#A09890"
            value={lga}
            onChangeText={setLga}
            accessibilityLabel="LGA Input"
          />

          {/* Trimester Select */}
          <Text style={styles.label}>
            {isHausa ? 'Matakin Ciki (Trimester)' : 'Pregnancy Stage (Trimester)'}
          </Text>
          <View style={styles.trimesterContainer}>
            {(['1', '2', '3'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.trimesterBox,
                  trimester === t && styles.trimesterBoxActive
                ]}
                onPress={() => setTrimester(t)}
              >
                <Text style={[
                  styles.trimesterNum,
                  trimester === t && styles.trimesterNumActive
                ]}>
                  {t}
                </Text>
                <Text style={[
                  styles.trimesterLabel,
                  trimester === t && styles.trimesterLabelActive
                ]}>
                  {isHausa ? 'Watanni' : 'Months'}{' '}
                  {t === '1' ? '1-3' : t === '2' ? '4-6' : '7-9'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleRegister}
            disabled={loading}
            accessibilityLabel="Start Button"
          >
            {loading ? (
              <ActivityIndicator color="#FAF8F5" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isHausa ? 'Fara Amfani' : 'Get Started'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  slideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    height: 60,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4C599',
    borderRadius: 12,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: '#D37A50',
  },
  langText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A09890',
  },
  langTextActive: {
    color: '#FAF8F5',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#93966B',
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    flexGrow: 1,
  },
  slideImage: {
    width: width * 0.8,
    height: width * 0.8,
    maxHeight: 280,
    borderRadius: 24,
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E2A25',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#93966B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  slideFooter: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E4C599',
  },
  dotActive: {
    backgroundColor: '#D37A50',
    width: 20,
  },
  nextBtn: {
    backgroundColor: '#D37A50',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    height: 60,
  },
  backBtn: {
    padding: 4,
  },
  formHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginLeft: 8,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#93966B',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E2A25',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2E2A25',
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  trimesterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  trimesterBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  trimesterBoxActive: {
    borderColor: '#D37A50',
    backgroundColor: 'rgba(211, 122, 80, 0.08)',
  },
  trimesterNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  trimesterNumActive: {
    color: '#D37A50',
  },
  trimesterLabel: {
    fontSize: 10,
    color: '#A09890',
    marginTop: 4,
  },
  trimesterLabelActive: {
    color: '#D37A50',
    fontWeight: '600',
  },
  errorText: {
    color: '#C25A3F',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#D37A50',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FAF8F5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
