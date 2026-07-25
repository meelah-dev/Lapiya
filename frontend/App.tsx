import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, Platform, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user session on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const saved = await AsyncStorage.getItem('@lafiya_user');
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (err) {
        console.log('Error loading session:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const handleUserUpdate = async (updatedUser: any) => {
    setUser(updatedUser);
    try {
      if (updatedUser) {
        await AsyncStorage.setItem('@lafiya_user', JSON.stringify(updatedUser));
      } else {
        await AsyncStorage.removeItem('@lafiya_user');
      }
    } catch (err) {
      console.log('Error persisting user:', err);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem('@lafiya_user');
    } catch (err) {
      console.log('Error removing session:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D37A50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <NavigationContainer>
        {user ? (
          <AppNavigator
            user={user}
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        ) : (
          <OnboardingScreen onOnboardComplete={handleUserUpdate} />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
