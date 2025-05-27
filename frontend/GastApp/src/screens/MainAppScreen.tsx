import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import LoadingScreen from '../components/LoadingScreen';

// ! Investigar esto
type MainAppScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

const MainAppScreen = () => {
  const { token, isLoading, checkToken } = useAuth();
  const navigation = useNavigation<MainAppScreenNavigationProp>();
  
  useEffect(() => {
    const verifySession = async () => {
      // Solo verifica si no está cargando y no hay token
      if (!isLoading && !token) {
        const isValid = await checkToken();
        if (!isValid) {
          navigation.replace('Login');
        }
      }
    };

    verifySession();
  }, [token, isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default MainAppScreen;