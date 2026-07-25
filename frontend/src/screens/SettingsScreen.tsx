import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

interface SettingsScreenProps {
  user: any;
  onUserUpdate: (user: any) => void;
  onLogout: () => void;
}

export default function SettingsScreen({ user, onUserUpdate, onLogout }: SettingsScreenProps) {
  const [lga, setLga] = useState(user?.lga || '');
  const [trimester, setTrimester] = useState<'1' | '2' | '3'>(user?.trimester || '1');
  const [lang, setLang] = useState<'ha' | 'en'>(user?.languagePreference || 'ha');
  const [loading, setLoading] = useState(false);

  const [modelDownloaded, setModelDownloaded] = useState(false);
  const [useOnDevice, setUseOnDevice] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Load LiteRT configurations on mount
  useEffect(() => {
    const loadLiteRTConfig = async () => {
      try {
        const dl = await AsyncStorage.getItem('@lafiya_litert_downloaded');
        const od = await AsyncStorage.getItem('@lafiya_use_ondevice');
        setModelDownloaded(dl === 'true');
        setUseOnDevice(od === 'true');
      } catch (err) {
        console.log('Error loading LiteRT config:', err);
      }
    };
    loadLiteRTConfig();
  }, []);

  // Handle LiteRT Gemma-2B quantized model download simulation
  const handleDownloadModel = () => {
    if (downloading || modelDownloaded) return;
    setDownloading(true);
    setDownloadProgress(0);

    let progress = 0;
    const interval = setInterval(async () => {
      progress += 10;
      setDownloadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setDownloading(false);
        setModelDownloaded(true);
        try {
          await AsyncStorage.setItem('@lafiya_litert_downloaded', 'true');
          Alert.alert(
            isHausa ? 'Zazzagewa Ta Kammala' : 'Download Complete',
            isHausa 
              ? 'An zazzage samfurin Gemma-2B AI (1.35 GB) cikin nasara! Kuna iya kunna offline mode yanzu.' 
              : 'Gemma-2B AI model (1.35 GB) has been downloaded successfully! You can now enable offline mode.'
          );
        } catch (err) {
          console.error(err);
        }
      }
    }, 400);
  };

  // Toggle local model usage
  const handleToggleOnDevice = async () => {
    if (!modelDownloaded) {
      Alert.alert(
        isHausa ? 'Gargaɗi' : 'Model Required',
        isHausa 
          ? 'Da farko don Allah zazzage samfurin AI na Gemma-2B kafin kunna offline mode.' 
          : 'Please download the Gemma-2B model first before enabling on-device mode.'
      );
      return;
    }
    const newVal = !useOnDevice;
    setUseOnDevice(newVal);
    try {
      await AsyncStorage.setItem('@lafiya_use_ondevice', newVal ? 'true' : 'false');
    } catch (err) {
      console.error(err);
    }
  };
  
  const isHausa = lang === 'ha';

  const handleSave = async () => {
    if (!lga.trim()) {
      Alert.alert(
        isHausa ? 'Kuskure' : 'Validation Error',
        isHausa ? 'LGA ba zai iya zama fanko ba' : 'LGA cannot be empty'
      );
      return;
    }

    setLoading(true);
    try {
      // Re-register or register again updates the profile. 
      // For simplicity, we register under the same name but with new attributes.
      const updatedUser = await api.register(user.name, lga.trim(), trimester, lang);
      onUserUpdate(updatedUser);
      Alert.alert(
        isHausa ? 'An Ajiye' : 'Success',
        isHausa ? 'An sabunta bayananku cikin nasara.' : 'Profile updated successfully.'
      );
    } catch (err) {
      console.error('Failed to update settings', err);
      Alert.alert(
        isHausa ? 'Kuskure' : 'Error',
        isHausa ? 'An samu matsala wajen sabuntawa.' : 'Failed to update settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isHausa ? 'Saituna' : 'Settings'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={[styles.avatar, { overflow: 'hidden' }]}>
            <Image source={require('../../assets/profile.png')} style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Amina'}</Text>
            <Text style={styles.userMeta}>
              {isHausa ? 'Uwar Gida' : 'Maternal Profile'}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          {/* Language selection */}
          <Text style={styles.label}>{isHausa ? 'Zaɓi Harshe' : 'Choose Language'}</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, lang === 'ha' && styles.toggleBtnActive]}
              onPress={() => setLang('ha')}
            >
              <Text style={[styles.toggleText, lang === 'ha' && styles.toggleTextActive]}>
                Hausa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, lang === 'en' && styles.toggleBtnActive]}
              onPress={() => setLang('en')}
            >
              <Text style={[styles.toggleText, lang === 'en' && styles.toggleTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </View>

          {/* LGA */}
          <Text style={styles.label}>
            {isHausa ? 'Karamar Hukuma (LGA)' : 'Local Government Area (LGA)'}
          </Text>
          <TextInput
            style={styles.input}
            value={lga}
            onChangeText={setLga}
            placeholder="e.g. Fagge"
            placeholderTextColor="#A09890"
            accessibilityLabel="Settings LGA Input"
          />

          {/* Trimester */}
          <Text style={styles.label}>
            {isHausa ? 'Matakin Ciki (Trimester)' : 'Pregnancy Stage (Trimester)'}
          </Text>
          <View style={styles.trimesters}>
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
                  styles.trimesterText,
                  trimester === t && styles.trimesterTextActive
                ]}>
                  {isHausa ? 'Trimester' : 'Trimester'}{' '}{t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={loading}
            accessibilityLabel="Save Settings Button"
          >
            {loading ? (
              <ActivityIndicator color="#FAF8F5" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isHausa ? 'Ajiye Saituna' : 'Save Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* On-Device AI Settings Card */}
        <View style={styles.formCard}>
          <Text style={[styles.label, { color: '#D37A50', fontWeight: 'bold' }]}>
            {isHausa ? 'AI na Cikin Waya (LiteRT-LM)' : 'On-Device AI Settings (LiteRT-LM)'}
          </Text>
          <Text style={styles.helperText}>
            {isHausa
              ? 'Zazzage samfurin AI na Gemma-2B domin yin hira da Lafiya ba tare da amfani da kowane irin intanet ko sabar yanar gizo ba.'
              : 'Download the quantized Gemma-2B model to run conversational AI completely offline on your device.'}
          </Text>

          {/* Model status indicator */}
          <View style={styles.downloadStatusWrapper}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons 
                name={modelDownloaded ? "cloud-done" : "cloud-download-outline"} 
                size={20} 
                color={modelDownloaded ? "#93966B" : "#A09890"} 
              />
              <Text style={[styles.statusText, modelDownloaded && { color: '#93966B', fontWeight: 'bold' }]}>
                {modelDownloaded 
                  ? (isHausa ? 'An Zazzage (1.35 GB)' : 'Downloaded (1.35 GB)') 
                  : (isHausa ? 'Ba a zazzage ba' : 'Not Downloaded')}
              </Text>
            </View>

            {!modelDownloaded && (
              <TouchableOpacity 
                style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]} 
                onPress={handleDownloadModel}
                disabled={downloading}
              >
                <Text style={styles.downloadBtnText}>
                  {downloading ? `${downloadProgress}%` : (isHausa ? 'Zazzage' : 'Download')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Download progress bar */}
          {downloading && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressIndicator, { width: `${downloadProgress}%` }]} />
            </View>
          )}

          {/* Offline Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>
                {isHausa ? 'Koma Offline Mode' : 'Go Fully Offline'}
              </Text>
              <Text style={styles.toggleSublabel}>
                {isHausa ? 'Yi hira ta amfani da Gemma-2B na waya' : 'Run chat using on-device Gemma-2B'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkboxCircle, useOnDevice && styles.checkboxCircleActive]}
              onPress={handleToggleOnDevice}
            >
              {useOnDevice && <Ionicons name="checkmark" size={14} color="#FAF8F5" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} accessibilityLabel="Logout Button">
          <Text style={styles.logoutBtnText}>
            {isHausa ? 'Sauya Sunan Profile' : 'Change Profile Name'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
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
  scroll: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4C599',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D37A50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 20,
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  userMeta: {
    fontSize: 13,
    color: '#93966B',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4C599',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E2A25',
    marginBottom: 8,
    marginTop: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 6,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#D37A50',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A09890',
  },
  toggleTextActive: {
    color: '#FAF8F5',
  },
  input: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#2E2A25',
  },
  trimesters: {
    flexDirection: 'row',
    gap: 8,
  },
  trimesterBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E4C599',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  trimesterBoxActive: {
    borderColor: '#D37A50',
    backgroundColor: 'rgba(211, 122, 80, 0.08)',
  },
  trimesterNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  trimesterNumActive: {
    color: '#D37A50',
  },
  trimesterText: {
    fontSize: 9,
    color: '#A09890',
    marginTop: 2,
  },
  trimesterTextActive: {
    color: '#D37A50',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#D37A50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 15,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#C25A3F',
    backgroundColor: 'rgba(194, 90, 63, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutBtnText: {
    color: '#C25A3F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    color: '#A09890',
    lineHeight: 18,
    marginBottom: 16,
  },
  downloadStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4C599',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    color: '#2E2A25',
  },
  downloadBtn: {
    backgroundColor: '#D37A50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  downloadBtnDisabled: {
    backgroundColor: '#E4C599',
  },
  downloadBtnText: {
    color: '#FAF8F5',
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#FAF8F5',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E4C599',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#93966B',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E2A25',
  },
  toggleSublabel: {
    fontSize: 11,
    color: '#A09890',
    marginTop: 2,
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
});
