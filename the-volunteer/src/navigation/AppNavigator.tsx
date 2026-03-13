import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList, MainTabParamList } from './types';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { MapScreen } from '../screens/MapScreen';
import { CreateTaskScreen } from '../screens/CreateTaskScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { useAuth } from '../hooks/useAuth';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { registerForPushNotifications } from '../services/notificationService';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFBFC',
    card: '#FFFFFF',
    text: '#132238',
    primary: '#0A84FF',
    border: '#E2E8F0',
    notification: '#0A84FF',
  },
};

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 45 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EAF0F7',
        },
        tabBarIconStyle: {
          marginTop: -4,
        },
        tabBarLabelStyle: {
          marginBottom: 2,
        },
        tabBarActiveTintColor: '#0A84FF',
        tabBarInactiveTintColor: '#7A8A9E',
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, string> = {
            Map: 'map-marker-radius',
            CreateTask: 'plus-circle-outline',
            Tasks: 'clipboard-list-outline',
            Profile: 'account-circle-outline',
            AdminDashboard: 'shield-crown-outline',
          };

          return <Icon source={iconMap[route.name] ?? 'circle'} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Map" component={MapScreen} />
      <Tabs.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'Create Task' }} />
      <Tabs.Screen name="Tasks" component={TasksScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
      {profile?.role === 'admin' ? (
        <Tabs.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{ title: 'Admin' }}
        />
      ) : null}
    </Tabs.Navigator>
  );
};

export const AppNavigator = () => {
  const { firebaseUser, initializing } = useAuth();

  useEffect(() => {
    if (firebaseUser) {
      void registerForPushNotifications(firebaseUser.uid);
    }
  }, [firebaseUser]);

  if (initializing) {
    return <LoadingOverlay />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {firebaseUser ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
