import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const [notificaciones, setNotificaciones] = useState(true);
  const [moneda, setMoneda] = useState('€');

  const toggleNotificaciones = () => {
    setNotificaciones(!notificaciones);
  };

  const resetPresupuesto = () => {
    Alert.alert(
      '¿Reiniciar presupuesto?',
      'Esta acción eliminará todos los gastos y restablecerá el presupuesto.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', onPress: () => console.log('Presupuesto reiniciado') }
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

        <TouchableOpacity onPress={resetPresupuesto} style={styles.resetButton}>
          <Text style={styles.resetText}>Restablecer presupuesto</Text>
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
});
