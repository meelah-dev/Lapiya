import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../services/api';

interface HomeScreenProps {
  user: any;
  navigation: any;
}

export default function HomeScreen({ user, navigation }: HomeScreenProps) {
  const isHausa = user?.languagePreference === 'ha';

  const trimesterVal = user?.trimester || '1';
  let progressPercent = 0.15;
  let statusText = '';
  let weekText = '';

  if (trimesterVal === '1') {
    progressPercent = 0.25;
    weekText = 'Week 10';
    statusText = isHausa ? 'Matakin Farko (Kafawa)' : 'First Trimester (Formation)';
  } else if (trimesterVal === '2') {
    progressPercent = 0.55;
    weekText = 'Week 20';
    statusText = isHausa ? 'Mataki na Biyu (Girma)' : 'Second Trimester (Growth)';
  } else {
    progressPercent = 0.85;
    weekText = 'Week 34';
    statusText = isHausa ? 'Mataki na Karshe (Shiri)' : 'Third Trimester (Preparation)';
  }

  // AI Care Guide & Reminders States
  const [guideData, setGuideData] = useState<any>(null);
  const [checkedReminders, setCheckedReminders] = useState<{ [key: string]: boolean }>({});
  const [loadingGuide, setLoadingGuide] = useState(true);

  // Fetch Gemma personalized guide
  useEffect(() => {
    let active = true;
    const fetchGuide = async () => {
      setLoadingGuide(true);
      try {
        const res = await api.getRecommendations(user?.trimester || '1', user?.languagePreference || 'ha');
        if (active) {
          setGuideData(res);
        }
      } catch (err) {
        console.error('Error fetching maternal recommendations:', err);
      } finally {
        if (active) {
          setLoadingGuide(false);
        }
      }
    };
    fetchGuide();
    return () => { active = false; };
  }, [user?.trimester, user?.languagePreference]);



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarPlaceholder}>
              <Image 
                source={require('../../assets/profile.png')} 
                style={styles.profileAvatarImg} 
              />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.greeting}>
                {isHausa ? 'Sannu uwar gida,' : 'Hello Mummy,'}
              </Text>
              <Text style={styles.name}>{user?.name || 'Amina'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={20} color="#2E2A25" />
          </TouchableOpacity>
        </View>

        {/* Timeline Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>
              {isHausa ? 'Watanni' : 'Months'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.tabText}>
              {isHausa ? 'Makonni' : 'Weeks'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.tabText}>
              {isHausa ? 'Mataki' : 'Trimester'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timeline Progress Card */}
        <LinearGradient
          colors={['#E4C599', '#FAF8F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.timelineCard}
        >
          <View style={styles.timelineContent}>
            <View style={styles.timelineTextContainer}>
              <Text style={styles.timelineTitle}>
                {isHausa ? 'Tafiyar Ciki' : 'Pregnancy Journey'}
              </Text>
              <Text style={styles.timelineStatus}>{statusText}</Text>
              <Text style={styles.timelineWeeks}>{weekText}</Text>
            </View>
            <View style={styles.graphicCircle}>
              <Image 
                source={require('../../assets/baby_illustration.png')} 
                style={styles.babyImage} 
              />
            </View>
          </View>

          {/* Custom Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>0</Text>
            <Text style={styles.progressLabelText}>{isHausa ? 'Haihuwa' : 'Birth'}</Text>
          </View>
        </LinearGradient>

        {/* Lafiya Daily AI Guide Section */}
        <Text style={styles.sectionTitle}>
          {isHausa ? 'Jagoran Lafiya na Yau' : 'Lafiya Daily AI Guide'}
        </Text>

        <TouchableOpacity 
          style={styles.guideBannerCard}
          onPress={() => navigation.navigate('MaternalGuide')}
          accessibilityLabel="AI Maternal Guide Banner"
        >
          <View style={styles.guideBannerContent}>
            <View style={styles.guideBannerTextWrapper}>
              <Text style={styles.guideBannerTitle}>
                {isHausa ? 'Jagoran Ciki na Lafiya' : 'Lafiya AI Care Guide'}
              </Text>
              <Text style={styles.guideBannerSubtitle}>
                {isHausa 
                  ? 'Koyi game da abinci mai gina jiki, motsa jiki, da shawarwari na musamman.' 
                  : 'Trimester-specific local nutrition, exercises, and safety advice.'}
              </Text>
              <View style={styles.guideBannerLinkRow}>
                <Text style={styles.guideBannerLinkText}>
                  {isHausa ? 'Duba Jagora' : 'View Full Guide'}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#D37A50" />
              </View>
            </View>
            <View style={styles.guideBannerIconWrapper}>
              <Image source={require('../../assets/guide_nutrition.png')} style={styles.guideBannerThumbnail} />
            </View>
          </View>
        </TouchableOpacity>



        {/* Alarms & Reminders Checklist Section */}
        <Text style={styles.sectionTitle}>
          {isHausa ? 'Tunatarwa da Rigakafin Yau' : "Today's Reminders & Alarms"}
        </Text>
        <View style={styles.remindersCard}>
          {loadingGuide ? (
            <ActivityIndicator size="small" color="#D37A50" style={{ padding: 20 }} />
          ) : guideData && guideData.reminders ? (
            guideData.reminders.map((rem: any, idx: number) => {
              const uniqueKey = `${rem.title}-${idx}`;
              const isChecked = !!checkedReminders[uniqueKey];
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.reminderRow, isChecked && styles.reminderRowChecked]}
                  onPress={() => setCheckedReminders(prev => ({ ...prev, [uniqueKey]: !prev[uniqueKey] }))}
                  accessibilityLabel={`Reminder Checklist Item: ${rem.title}`}
                >
                  <View style={styles.reminderContent}>
                    <View style={styles.reminderTimeBadge}>
                      <Ionicons name="alarm-outline" size={11} color="#FAF8F5" />
                      <Text style={styles.reminderTimeText}>{rem.time}</Text>
                    </View>
                    <View style={styles.reminderTextWrapper}>
                      <Text style={[styles.reminderTitleText, isChecked && styles.reminderTitleTextChecked]}>
                        {rem.title}
                      </Text>
                      <Text style={[styles.reminderSubtitleText, isChecked && styles.reminderSubtitleTextChecked]}>
                        {rem.subtitle}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.checkboxCircle, isChecked && styles.checkboxCircleActive]}>
                    {isChecked && <Ionicons name="checkmark" size={14} color="#FAF8F5" />}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyGuideText}>
              {isHausa ? 'Babu tunatarwa na yau.' : 'No reminders for today.'}
            </Text>
          )}
        </View>

        {/* Scheduled Maternal checks */}
        <Text style={styles.sectionTitle}>
          {isHausa ? 'Ziyarar Asibiti (ANC)' : 'Upcoming ANC Milestones'}
        </Text>
        
        {/* Ultrasound Scan Milestone check */}
        <View style={styles.checkCard}>
          <View style={styles.checkIconContainerImage}>
            <Image 
              source={require('../../assets/ultrasound.png')} 
              style={styles.checkImage} 
            />
          </View>
          <View style={styles.checkText}>
            <Text style={styles.checkTitle}>
              {isHausa ? 'Hoton Duban Ciki (Ultrasound)' : 'Maternal Ultrasound Scan'}
            </Text>
            <Text style={styles.checkSubtitle}>
              {isHausa ? 'Makonni 18-22 (Rajista)' : 'Weeks 18-22 ANC Milestone'}
            </Text>
          </View>
        </View>

        {/* BP routine check */}
        <View style={styles.checkCard}>
          <View style={styles.checkIconContainer}>
            <MaterialCommunityIcons name="heart-flash" size={22} color="#93966B" />
          </View>
          <View style={styles.checkText}>
            <Text style={styles.checkTitle}>
              {isHausa ? 'Auna Zazzabi da Hawan Jini' : 'Routine Blood Pressure Check'}
            </Text>
            <Text style={styles.checkSubtitle}>
              {isHausa ? 'Makonni 24-28 (ANC na 3)' : 'Weeks 24-28 (3rd ANC Visit)'}
            </Text>
          </View>
        </View>

        {/* Vaccine check */}
        <View style={styles.checkCard}>
          <View style={styles.checkIconContainer}>
            <MaterialCommunityIcons name="needle" size={22} color="#93966B" />
          </View>
          <View style={styles.checkText}>
            <Text style={styles.checkTitle}>
              {isHausa ? 'Rigakafin Tetanus Toxoid' : 'Tetanus Toxoid Vaccine'}
            </Text>
            <Text style={styles.checkSubtitle}>
              {isHausa ? 'Mako na 20-24' : 'Weeks 20-24 Check'}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D37A50',
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  profileText: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#93966B',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  tabItemActive: {
    backgroundColor: '#D37A50',
  },
  tabText: {
    fontSize: 14,
    color: '#A09890',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FAF8F5',
  },
  timelineCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  timelineContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineTextContainer: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  timelineStatus: {
    fontSize: 14,
    color: '#93966B',
    marginTop: 4,
  },
  timelineWeeks: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D37A50',
    marginTop: 8,
  },
  graphicCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4C599',
    overflow: 'hidden',
  },
  babyImage: {
    width: '100%',
    height: '100%',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(228, 197, 153, 0.4)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D37A50',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelText: {
    fontSize: 11,
    color: '#A09890',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginBottom: 14,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  checkCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  checkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconContainerImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4C599',
    overflow: 'hidden',
  },
  checkImage: {
    width: '100%',
    height: '100%',
  },
  checkText: {
    marginLeft: 14,
    flex: 1,
  },
  checkTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  checkSubtitle: {
    fontSize: 12,
    color: '#A09890',
    marginTop: 2,
  },
  // Dynamic Guide Styles
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E4C599',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  guideTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  guideTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(228, 197, 153, 0.15)',
  },
  guideTabActive: {
    backgroundColor: '#D37A50',
  },
  guideTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D37A50',
  },
  guideTabTextActive: {
    color: '#FAF8F5',
  },
  guideContentArea: {
    paddingVertical: 6,
  },
  guideItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  guideItemText: {
    fontSize: 14,
    color: '#2E2A25',
    flex: 1,
    lineHeight: 20,
  },
  emptyGuideText: {
    color: '#A09890',
    fontSize: 13,
    textAlign: 'center',
    padding: 12,
  },
  // Reminders Styles
  remindersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E4C599',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
    gap: 8,
  },
  reminderRowChecked: {
    opacity: 0.6,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  reminderTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#93966B',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  reminderTimeText: {
    fontSize: 10,
    color: '#FAF8F5',
    fontWeight: 'bold',
  },
  reminderTextWrapper: {
    flex: 1,
  },
  reminderTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  reminderTitleTextChecked: {
    textDecorationLine: 'line-through',
  },
  reminderSubtitleText: {
    fontSize: 11,
    color: '#A09890',
    marginTop: 2,
  },
  reminderSubtitleTextChecked: {
    textDecorationLine: 'line-through',
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E4C599',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: '#D37A50',
    borderColor: '#D37A50',
  },
  guideBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E4C599',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  guideBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  guideBannerTextWrapper: {
    flex: 1.3,
  },
  guideBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginBottom: 6,
  },
  guideBannerSubtitle: {
    fontSize: 12,
    color: '#A09890',
    lineHeight: 18,
    marginBottom: 10,
  },
  guideBannerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideBannerLinkText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D37A50',
  },
  guideBannerIconWrapper: {
    flex: 0.7,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FAF8F5',
  },
  guideBannerThumbnail: {
    width: '100%',
    height: '100%',
  },
});
