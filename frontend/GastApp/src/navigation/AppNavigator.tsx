import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import MainAppContent from '../components/MainAppContent';

import EditProfileScreen from '../screens/EditProfileScreen';
import AboutAppScreen from '../screens/AboutAppScreen'; 
import SettingsScreen from '../screens/SettingsScreen';
import GastosScreen from '../screens/GastosScreen';
import AgregarGastoScreen from '../screens/AgregarGastoScreen';
import AgregarPresupuestoScreen from '../screens/AgregarPresupuestoScreen';
import PresupuestosScreen from '../screens/PresupuestosScreen';

import DetalleGastoScreen from '../screens/DetalleGastoScreen';

// Tipos para las rutas
// Stack para los grupos de pantallas
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Principal: undefined;
  
  Settings: undefined;
  AboutApp: undefined;
  EditProfile: undefined;
  AgregarGastoScreen: undefined;
  AgregarPresupuestoScreen: undefined;
  GastosScreen: undefined;
  DetalleGastoScreen: { gastoId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Bottom Tabs para las pantallas principales que se muestran al iniciar sesión y en la barra de navegación
export type BottomTabParamList = {
  Principal: undefined;
  Inicio: undefined;
  Gastos: undefined;
  Presupuestos: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Componente de Bottom Tabs
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Principal') {
            iconName = focused ? 'home' : 'home-outline';
          }  else if (route.name === 'Gastos') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Presupuestos') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 8,
          height: 55,
          paddingBottom: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Principal" component={MainAppContent} />
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Gastos" component={GastosScreen} />
      <Tab.Screen name="Presupuestos" component={PresupuestosScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false
        }}
      >
        {token ? (
          <>
            <Stack.Screen name="Principal" component={MainTabs} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen 
              name="DetalleGastoScreen" 
              component={DetalleGastoScreen} 
              options={{ title: 'Detalle de Gasto'}} // Mostrar header para esta pantalla
            />
            <Stack.Screen name="AgregarPresupuestoScreen" component={AgregarPresupuestoScreen}/>
            <Stack.Screen name="AgregarGastoScreen" component={AgregarGastoScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;