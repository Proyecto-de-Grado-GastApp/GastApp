import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import Icon from 'react-native-vector-icons/Ionicons';

import EditProfileScreen from '../screens/EditProfileScreen';
import AboutAppScreen from '../screens/AboutAppScreen'; 
import SettingsScreen from '../screens/SettingsScreen';
import GastosScreen from '../screens/GastosScreen';
import AgregarGastoScreen from '../screens/AgregarGastoScreen';
import AgregarPresupuestoScreen from '../screens/AgregarPresupuestoScreen';
import PresupuestosScreen from '../screens/PresupuestosScreen';
import AgregarSuscripcionesScreen from '../screens/AgregarSuscripcionesScreen';

import DetalleGastoScreen from '../screens/DetalleGastoScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';

import { GastosProvider } from '../contexts/GastosContext';

// Tipos para las rutas
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Perfil: undefined;
  EditProfile: undefined;
  AboutApp: undefined;
  Settings: undefined;
  DetalleGastoScreen: { gastoId: number };
  AgregarGastoScreen: undefined;
  AgregarPresupuestoScreen: undefined;
  AgregarSuscripcionesScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Bottom Tabs
export type BottomTabParamList = {
  HomeTab: undefined;
  Gastos: undefined;
  Presupuestos: undefined;
  Suscripciones: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const MainTabs = () => {
  const navigation = useNavigation<any>();

  return (
    <GastosProvider>
      <View style={{ flex: 1 }}>
        {/* Header personalizado */}
        <View style={{
          height: 66,
          backgroundColor: '#2563eb',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 15,
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 3,
        }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
            GastApp
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
            <Icon name="person-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigator */}
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'HomeTab') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Gastos') {
                iconName = focused ? 'cash' : 'cash-outline';
              } else if (route.name === 'Presupuestos') {
                iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              } else if (route.name === 'Suscripciones') {
                iconName = focused ? 'repeat' : 'repeat-outline';
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
          <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Inicio' }} />
          <Tab.Screen name="Gastos" component={GastosScreen} />
          <Tab.Screen name="Presupuestos" component={PresupuestosScreen} />
          <Tab.Screen name="Suscripciones" component={SubscriptionsScreen} />
        </Tab.Navigator>
      </View>
    </GastosProvider>
  );
};


const AppNavigator = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {token ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={({ navigation }) => ({
                title: 'GastApp',
                headerRight: () => (
                  <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
                    <Icon name="person-outline" size={24} color="#2563eb" style={{ marginRight: 15 }} />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="Perfil"
              component={ProfileScreen}
              options={{ title: 'Perfil' }}
            />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen
              name="DetalleGastoScreen"
              component={DetalleGastoScreen}
              options={{ title: 'Detalle de Gasto' }}
            />
            <Stack.Screen name="AgregarPresupuestoScreen" component={AgregarPresupuestoScreen} />
            <Stack.Screen name="AgregarGastoScreen" component={AgregarGastoScreen} />
            <Stack.Screen name="AgregarSuscripcionesScreen" component={AgregarSuscripcionesScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
