import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Dimensions } from 'react-native';

const Tab = createBottomTabNavigator();
const { height } = Dimensions.get('window');

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: height * 0.08, // 8% del alto de la pantalla
          paddingBottom: height > 800 ? 10 : 5, // Ajusta según necesidad
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: '#fff',
        },
          headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabs;