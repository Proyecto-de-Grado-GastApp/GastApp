import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import Icon from 'react-native-vector-icons/Ionicons';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  CrearEtiquetaScreen: undefined;
  AgregarGasto: undefined;
};

interface CrearEtiquetaScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
}

const CrearEtiquetaScreen: React.FC<CrearEtiquetaScreenProps> = ({ navigation }) => {
  const { token } = useAuth();
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#3b82f6'); // Color por defecto
  const [isLoading, setIsLoading] = useState(false);

  // Paleta de colores organizada por categorías
  const colorPalette = {
    Azules: ['#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd'],
    Rojos: ['#ef4444', '#dc2626', '#b91c1c', '#f87171', '#fca5a5'],
    Verdes: ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7'],
    Amarillos: ['#f59e0b', '#d97706', '#b45309', '#fbbf24', '#fcd34d'],
    Púrpuras: ['#8b5cf6', '#7c3aed', '#6d28d9', '#a78bfa', '#c4b5fd'],
    Rosas: ['#ec4899', '#db2777', '#be185d', '#f472b6', '#f9a8d4'],
    Naranjas: ['#f97316', '#ea580c', '#c2410c', '#fb923c', '#fdba74'],
    Cian: ['#06b6d4', '#0891b2', '#0e7490', '#22d3ee', '#67e8f9'],
    Grises: ['#6b7280', '#4b5563', '#374151', '#9ca3af', '#d1d5db']
  };

  const handleCrearEtiqueta = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la etiqueta es obligatorio');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/EtiquetasPersonalizadas`,
        {
          nombre: nombre.trim(),
          color: color
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      Alert.alert('Éxito', 'Etiqueta creada correctamente');
      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Error al crear la etiqueta';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join('\n');
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Nueva Etiqueta</Text>
        <TouchableOpacity onPress={handleCrearEtiqueta}>
          <Text style={styles.saveButton}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nombre de la etiqueta</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Supermercado"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Selecciona un color</Text>
        
        {/* Muestra la selección actual */}
        <View style={[styles.currentColor, { backgroundColor: color }]}>
          <Text style={styles.currentColorText}>Color seleccionado</Text>
        </View>

        {/* Paleta de colores organizada */}
        {Object.entries(colorPalette).map(([category, colors]) => (
          <View key={category} style={styles.colorCategory}>
            <Text style={styles.colorCategoryTitle}>{category}</Text>
            <View style={styles.colorOptions}>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Icon name="checkmark" size={20} color="white" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  currentColor: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  currentColorText: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  colorCategory: {
    marginBottom: 20,
  },
  colorCategoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default CrearEtiquetaScreen;