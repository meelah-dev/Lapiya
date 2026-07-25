import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert
} from 'react-native';

interface SymptomCardScreenProps {
  route: any;
  navigation: any;
}

export default function SymptomCardScreen({ route, navigation }: SymptomCardScreenProps) {
  const card = route?.params?.card;
  
  if (!card) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No Symptom Card Data Found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const urgency = card.urgency || 'low';
  
  // Decide theme based on urgency
  let themeColor = '#93966B'; // Sage green (low)
  let badgeText = 'LOW / KADAN';
  
  if (urgency === 'critical') {
    themeColor = '#C25A3F'; // Terracotta alert (critical)
    badgeText = 'CRITICAL / MATSANANCI';
  } else if (urgency === 'medium') {
    themeColor = '#D37A50'; // Sand/Orange (medium)
    badgeText = 'MEDIUM / MATSATSINI';
  }

  // Combine symptoms and action steps text
  const symptomsStr = Array.isArray(card.symptoms) 
    ? card.symptoms.map((s: string) => `- ${s}`).join('\n')
    : `- ${card.symptoms}`;

  const fullReportText = `LAFIYA MATERNAL SYMPTOM CARD\n` +
    `---------------------------\n` +
    `Urgency: ${badgeText}\n` +
    `Symptoms:\n${symptomsStr}\n\n` +
    `Immediate Action Steps:\n${card.actionStep || 'Visit closest clinic.'}\n\n` +
    `Please show this report card to the clinic nurse or midwife immediately upon arrival.`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: fullReportText,
      });
    } catch (error: any) {
      Alert.alert('Error sharing report', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()} accessibilityLabel="Go Back">
          <Ionicons name="arrow-back" size={24} color="#2E2A25" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Card</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={[styles.card, { borderColor: themeColor }]}>
          {/* Top warning ribbon */}
          <View style={[styles.cardRibbon, { backgroundColor: themeColor }]}>
            <Text style={styles.ribbonText}>LAFIYA MATERNAL EMERGENCY SYSTEM</Text>
          </View>

          <View style={styles.cardContent}>
            {/* Urgency Badge */}
            <View style={[styles.badge, { backgroundColor: themeColor + '1F', borderColor: themeColor }]}>
              <Text style={[styles.badgeText, { color: themeColor }]}>{badgeText}</Text>
            </View>

            {/* Symptoms section */}
            <Text style={styles.label}>ALAMOMI (Symptoms):</Text>
            <View style={styles.sectionContainer}>
              <Text style={styles.symptomsText}>{symptomsStr}</Text>
            </View>

            {/* Immediate Actions */}
            <Text style={styles.label}>ABIN YI GANGADI (Immediate Actions):</Text>
            <View style={[styles.sectionContainer, styles.actionContainer]}>
              <Text style={styles.actionText}>{card.actionStep || 'Tafi asibiti mafi kusa maza-maza.'}</Text>
            </View>

            {/* Instruction Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerInstruction}>
                <Ionicons name="megaphone" size={14} color="#2E2A25" /> Nuna wa ma'aikaciyar lafiya (Ungozoma/Nurse) wannan katin da zaran kun isa asibiti.
              </Text>
              <Text style={styles.footerInstructionSub}>
                Show this report card to the midwife or nurse immediately upon arrival.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sharing options */}
      <View style={styles.btnArea}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: themeColor, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]} 
          onPress={handleShare} 
          accessibilityLabel="Share Report"
        >
          <Ionicons name="share-social" size={18} color="#FAF8F5" />
          <Text style={styles.actionBtnText}>Share Report / Turawa</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.secondaryBtn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]} 
          onPress={() => navigation.navigate('Clinics')} 
          accessibilityLabel="Find Nearest Clinic"
        >
          <Ionicons name="location-outline" size={18} color="#2E2A25" />
          <Text style={styles.secondaryBtnText}>Find Nearest Clinic / Nemo Asibiti</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  errorText: {
    color: '#2E2A25',
    fontSize: 16,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#D37A50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4C599',
    backgroundColor: '#FFFFFF',
  },
  backArrow: {
    padding: 8,
  },
  backArrowText: {
    fontSize: 20,
    color: '#2E2A25',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
    marginLeft: 12,
  },
  cardContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardRibbon: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  ribbonText: {
    color: '#FAF8F5',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardContent: {
    padding: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#93966B',
    marginBottom: 6,
  },
  sectionContainer: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  symptomsText: {
    fontSize: 16,
    color: '#2E2A25',
    lineHeight: 22,
  },
  actionContainer: {
    borderColor: 'rgba(211, 122, 80, 0.3)',
  },
  actionText: {
    fontSize: 15,
    color: '#2E2A25',
    lineHeight: 22,
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
    paddingTop: 14,
    marginTop: 10,
  },
  footerInstruction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E2A25',
    textAlign: 'center',
    lineHeight: 16,
  },
  footerInstructionSub: {
    fontSize: 11,
    color: '#A09890',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  btnArea: {
    padding: 20,
    gap: 12,
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4C599',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#2E2A25',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
