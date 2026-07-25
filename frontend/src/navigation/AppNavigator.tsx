import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import HealthCenterScreen from '../screens/HealthCenterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SymptomCardScreen from '../screens/SymptomCardScreen';
import MaternalGuideScreen from '../screens/MaternalGuideScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface AppNavigatorProps {
  user: any;
  onUserUpdate: (user: any) => void;
  onLogout: () => void;
}

export default function AppNavigator({ user, onUserUpdate, onLogout }: AppNavigatorProps) {
  const isHausa = user?.languagePreference === 'ha';

  function TabNavigator() {
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#D37A50',
          tabBarInactiveTintColor: '#A09890',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E4C599',
            paddingBottom: 5,
            height: 60,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: isHausa ? 'Gida' : 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        >
          {(props) => <HomeScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen
          name="Chat"
          options={{
            tabBarLabel: isHausa ? 'Hira' : 'Chat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={22} color={color} />
            ),
          }}
        >
          {(props) => <ChatScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen
          name="Clinics"
          options={{
            tabBarLabel: isHausa ? 'Asibiti' : 'Clinics',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'medical' : 'medical-outline'} size={22} color={color} />
            ),
          }}
        >
          {(props) => <HealthCenterScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen
          name="Settings"
          options={{
            tabBarLabel: isHausa ? 'Saituna' : 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
            ),
          }}
        >
          {(props) => (
            <SettingsScreen
              {...props}
              user={user}
              onUserUpdate={onUserUpdate}
              onLogout={onLogout}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="SymptomCard" component={SymptomCardScreen} />
      <Stack.Screen name="MaternalGuide">
        {(props) => <MaternalGuideScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
