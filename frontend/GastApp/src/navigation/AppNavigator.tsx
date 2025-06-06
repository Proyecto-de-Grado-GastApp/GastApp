import React ,{ useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
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
import GastosScreen from '../screens/gastos/GastosScreen';
import AgregarGastoScreen from '../screens/gastos/AgregarGastoScreen';
import AgregarPresupuestoScreen from '../screens/AgregarPresupuestoScreen';
import PresupuestosScreen from '../screens/PresupuestosScreen';
import AgregarSuscripcionesScreen from '../screens/suscripciones/AgregarSuscripcionesScreen';

import DetalleGastoScreen from '../screens/gastos/DetalleGastoScreen';
import SubscriptionsScreen from '../screens/suscripciones/SubscriptionsScreen';
import EditarGastoScreen from '../screens/gastos/EditarGastoScreen';
import EditarSuscripcionScreen from '../screens/suscripciones/EditarSuscripcionScreen';
import { GastosProvider } from '../contexts/GastosContext';
import DetalleSuscripcionScreen from '../screens/suscripciones/DetalleSuscripcionesScreen';
import DetallePresupuestoScreen from '../screens/DetallePresupuestoScreen';
import CrearEtiquetaScreen from '../screens/CrearEtiquetaScreen';
import EtiquetasScreen from '../screens/EtiquetasScreen';
import EditarPresupuestoScreen from '../screens/EditarPresupuestoScreen';
import { useIsFocused } from '@react-navigation/native';

import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';

// Tipos para las rutas
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Perfil: undefined;
  EditProfile: undefined;
  AboutApp: undefined;
  Settings: undefined;
  AgregarGastoScreen: undefined;
  AgregarSuscripcionesScreen: undefined;
  GastosScreen: undefined;
  DetalleGastoScreen: { 
    gastoId: number; 
    title?: string; 
  };
  DetalleSuscripcionScreen: { 
    suscripcionId: number; 
    title?: string;
  };
  EditarGastoScreen: { 
    gasto: any;
    metodosPago: any[];
    etiquetas: any[];
    categorias: any[];
  };
  EditarSuscripcionScreen: {
    suscripcion: any;
  };
  DetallePresupuestoScreen: { presupuestoId: number };
  AgregarPresupuestoScreen: undefined;
  CrearEtiquetaScreen: undefined;
  EtiquetasScreen: undefined;
  EditarPresupuestoScreen: { 
    presupuestoId: number;
    presupuestoData: {
      categoriaId: number;
      cantidad: number;
      fechaInicio: string;
      fechaFin: string;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Bottom Tabs
export type BottomTabParamList = {
  HomeTab: undefined;
  Gastos: undefined;
  Presupuestos: undefined;
  Suscripciones: undefined;
};

type Usuario = {
  imagenPerfil: string;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const MainTabs = () => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const { token, imagenPerfil  } = useAuth();

  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/usuarios/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Agregar ?t para evitar caché
        const imagenUrl = `${res.data.imagenPerfil}?t=${Date.now()}`;
        setUserData({ imagenPerfil: imagenUrl });
        setSelectedImage(imagenUrl);
      } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
      }
    };

    if (token && isFocused) fetchUserData();
  }, [token, isFocused]);


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
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Nuevo botón para las etiquetas */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('EtiquetasScreen')}
              style={{ marginRight: 15 }}
            >
              <Icon name="pricetags-outline" size={24} color="white" />
            </TouchableOpacity>
            
            {/* Botón del perfil existente */}
            <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
              {userData?.imagenPerfil ? (
                <Image 
                  source={{ 
                    uri: userData.imagenPerfil.startsWith('http') 
                      ? userData.imagenPerfil
                      : `${API_BASE_URL}${userData.imagenPerfil.startsWith('/') ? '' : '/'}${userData.imagenPerfil}`
                  }}
                  style={styles.avatar}
                  onError={(e) => console.log('Error cargando imagen:', e.nativeEvent.error)}
                />
              ) : (
                <Icon name="person-outline" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
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
            <Stack.Screen name="DetalleGastoScreen" component={DetalleGastoScreen} />
            <Stack.Screen 
              name="EditarGastoScreen" 
              component={EditarGastoScreen} 
              options={{ title: 'Editar Gasto' }}
            />
            <Stack.Screen name="EditarSuscripcionScreen" component={EditarSuscripcionScreen} />
            <Stack.Screen name="AgregarPresupuestoScreen" component={AgregarPresupuestoScreen}/>
            <Stack.Screen name="AgregarGastoScreen" component={AgregarGastoScreen} />
            <Stack.Screen name="AgregarSuscripcionesScreen" component={AgregarSuscripcionesScreen} />
            <Stack.Screen name="DetalleSuscripcionScreen" component={DetalleSuscripcionScreen} />
            <Stack.Screen 
              name="DetallePresupuestoScreen" 
              component={DetallePresupuestoScreen}
              options={{ title: 'Detalle de Presupuesto' }}
            />
            <Stack.Screen name="CrearEtiquetaScreen" component={CrearEtiquetaScreen} options={{ title: 'Crear Etiqueta' }} />
             <Stack.Screen 
              name="EtiquetasScreen" 
              component={EtiquetasScreen} 
              options={{ title: 'Mis Etiquetas' }}
            />
            <Stack.Screen 
              name="EditarPresupuestoScreen" 
              component={EditarPresupuestoScreen} 
              options={{ title: 'Editar Presupuesto' }}
            />

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

const styles = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 15,
    borderColor: 'white',
  },
});

export default AppNavigator;
