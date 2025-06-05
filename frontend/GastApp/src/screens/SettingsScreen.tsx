import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../api/urlConnection';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const SettingsScreen = () => {
  const [notificaciones, setNotificaciones] = useState(true);
  const [moneda, setMoneda] = useState('€');
  const [isLoading, setLoading] = useState(false);
  const { token } = useAuth();

  const toggleNotificaciones = () => {
    setNotificaciones(!notificaciones);
  };

  
  const handleDeleteAllPresupuestos = async () => {
    Alert.alert(
      'Eliminar todos los presupuestos',
      '¿Estás seguro de que quieres eliminar TODOS tus presupuestos? Esta acción no se puede deshacer.',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel' 
        },
        {
          text: 'Eliminar todos',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await axios.delete(`${API_BASE_URL}/api/presupuestos/delete-all`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              Alert.alert(
                'Éxito', 
                response.data.message || `Se eliminaron ${response.data.count} presupuestos`
              );
            } catch (error) {
              console.error('Error eliminando presupuestos:', error);
              let errorMessage = 'Ocurrió un problema al eliminar los presupuestos';
              if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string } } };
                errorMessage = err.response?.data?.message || errorMessage;
              }
              Alert.alert(
                'Error', 
                errorMessage
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Icon name="arrow-back" size={30} color="#2563eb" onPress={() => navigation.goBack()} />
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Configuración de la App</Text>

        <View style={styles.item}>
          <Text style={styles.label}>Notificaciones de recordatorio</Text>
          <Switch
            value={notificaciones}
            onValueChange={toggleNotificaciones}
            thumbColor={notificaciones ? '#2563eb' : '#ccc'}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          />
        </View>

        <View style={styles.item}>
          <Text style={styles.label}>Moneda predeterminada</Text>
          <Text style={styles.value}>{moneda}</Text>
        </View>

        <TouchableOpacity 
          onPress={handleDeleteAllPresupuestos}
          style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="trash-outline" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Eliminar todos los presupuestos</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.version}>Versión de la app: 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#374151',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  version: {
    marginTop: 30,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
   deleteButton: {
    backgroundColor: '#ef4444', // Rojo para indicar acción destructiva
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  icon: {
    marginRight: 8
  }
});
