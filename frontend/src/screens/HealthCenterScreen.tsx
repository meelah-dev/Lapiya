import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { api, HealthCenter } from '../services/api';

interface HealthCenterScreenProps {
  user: any;
  navigation: any;
}

export default function HealthCenterScreen({ user, navigation }: HealthCenterScreenProps) {
  const isHausa = user?.languagePreference === 'ha';
  const userLga = user?.lga || 'Fagge';

  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCenters = async () => {
      setLoading(true);
      try {
        const res = await api.getHealthCenters(userLga);
        setCenters(res);
      } catch (err) {
        console.error('Failed to get clinics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCenters();
  }, [userLga]);

  const handleCall = (name: string) => {
    Alert.alert(
      isHausa ? 'Kira Asibiti' : 'Call Health Center',
      isHausa 
        ? `Kuna son kiran cibiyar ${name}? (Kiran Gaggawa)`
        : `Do you want to call ${name}? (Emergency)`,
      [
        { text: isHausa ? 'A fasa' : 'Cancel', style: 'cancel' },
        { text: isHausa ? 'Kira' : 'Call', onPress: () => Alert.alert(isHausa ? 'Ana kira...' : 'Dialing...') }
      ]
    );
  };

  const handleNavigate = (name: string) => {
    Alert.alert(
      isHausa ? 'Nemo Taswira' : 'Navigate Clinic',
      isHausa 
        ? `Nuna taswirar tafiya zuwa ${name}?`
        : `Open maps navigation to ${name}?`,
      [
        { text: isHausa ? 'A fasa' : 'Cancel', style: 'cancel' },
        { text: isHausa ? 'Bude' : 'Open', onPress: () => Alert.alert(isHausa ? 'Ana bude taswira...' : 'Opening maps...') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isHausa ? 'Cibiyoyin Lafiya Mafi Kusa' : 'Nearest Health Centers'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isHausa ? `A karamar hukumar: ${userLga}` : `For LGA: ${userLga}`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D37A50" />
        </View>
      ) : (
        <FlatList
          data={centers}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="medical" size={20} color="#D37A50" />
                </View>
                <View style={styles.clinicInfo}>
                  <Text style={styles.clinicName}>{item.name}</Text>
                  <Text style={styles.clinicAddress}>{item.address}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.distanceBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location" size={12} color="#93966B" />
                    <Text style={styles.distanceText}>{item.distance}</Text>
                  </View>
                </View>
                
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.callBtn]}
                    onPress={() => handleCall(item.name)}
                    accessibilityLabel="Call Clinic"
                  >
                    <Ionicons name="call" size={13} color="#93966B" />
                    <Text style={styles.callBtnText}>{isHausa ? 'Kira' : 'Call'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.navBtn]}
                    onPress={() => handleNavigate(item.name)}
                    accessibilityLabel="Navigate Clinic"
                  >
                    <Ionicons name="navigate" size={13} color="#FAF8F5" />
                    <Text style={styles.navBtnText}>{isHausa ? 'Taswira' : 'Route'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isHausa 
                  ? 'Ba mu sami takamaiman asibiti a nan ba. Don Allah tafi babban asibitin LGA na ku.' 
                  : 'No local clinics registered for this LGA yet. Please visit the main General Hospital.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4C599',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93966B',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4C599',
    shadowColor: '#2E2A25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(211, 122, 80, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  clinicInfo: {
    marginLeft: 14,
    flex: 1,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  clinicAddress: {
    fontSize: 13,
    color: '#A09890',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#FAF8F5',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    backgroundColor: '#FAF8F5',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E4C599',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93966B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  callBtn: {
    backgroundColor: 'rgba(147, 150, 107, 0.15)',
  },
  callBtnText: {
    color: '#93966B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  navBtn: {
    backgroundColor: '#D37A50',
  },
  navBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnIcon: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A09890',
    textAlign: 'center',
    lineHeight: 20,
  },
});
