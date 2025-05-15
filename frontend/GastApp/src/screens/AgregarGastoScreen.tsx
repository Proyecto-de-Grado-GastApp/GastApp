import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';

const AgregarGastoScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const handleGuardar = async () => {
    if (!descripcion || !cantidad) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/gastos`, {
        descripcion,
        cantidad: parseFloat(cantidad),
        fecha
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      Alert.alert('Éxito', 'Gasto guardado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando gasto:', error);
      Alert.alert('Error', 'Hubo un problema al guardar el gasto');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={styles.input}
        placeholder="Descripción del gasto"
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Text style={styles.label}>Cantidad</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00€"
        keyboardType="decimal-pad"
        value={cantidad}
        onChangeText={setCantidad}
      />

      <TouchableOpacity style={styles.button} onPress={handleGuardar}>
        <Text style={styles.buttonText}>Guardar Gasto</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default AgregarGastoScreen;
