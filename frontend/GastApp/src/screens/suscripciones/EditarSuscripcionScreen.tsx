import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, Switch, Modal, TouchableWithoutFeedback,
  Platform, ActivityIndicator, FlatList 
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { suscripciones as suscripcionesOriginales } from '../../data/suscripcionesData';

// --- Interfaces de Tipos ---
type RootStackParamList = {
  EditarSuscripcion: { suscripcion: Suscripcion };
  Home: undefined;
};

interface Plan {
  id: number;
  nombre: string;
  precio: number;
}

interface Suscripcion {
  id: number;
  descripcion: string;
  cantidad: number;
  fecha: string;
  frecuencia: number;
  notificar: boolean;
  nota: string;
  etiquetasPersonalizadasIds?: number[];
}

interface EtiquetaPersonalizada {
    id: number;
    nombre: string;
    color: string;
}

// --- Procesamiento de Datos ---
const suscripcionesData = suscripcionesOriginales.map(suscripcion => ({
  ...suscripcion,
  planes: suscripcion.planes.map((plan, index) => ({
    ...plan,
    id: (plan as any).id !== undefined ? (plan as any).id : index
  }))
}));

// --- Componente Principal ---
const EditarSuscripcionScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList> }> = ({ navigation }) => {
  const { token } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'EditarSuscripcion'>>();
  const { suscripcion: suscripcionParam } = route.params;
  
  // --- Estados del Componente ---
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [frecuencia, setFrecuencia] = useState<number>(3); // 3: mensual, 4: anual
  const [notificar, setNotificar] = useState(false);
  const [notas, setNotas] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<number[]>([]);
  
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);
  const [planesDisponibles, setPlanesDisponibles] = useState<Plan[]>([]);
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<EtiquetaPersonalizada[]>([]);

  const [showPlanesModal, setShowPlanesModal] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // --- Carga y Seteo de Datos Iniciales ---
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const etiquetasRes = await axios.get(`${API_BASE_URL}/api/EtiquetasPersonalizadas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEtiquetasDisponibles(etiquetasRes.data);

        if (suscripcionParam) {
          setDescripcion(suscripcionParam.descripcion);
          setCantidad(suscripcionParam.cantidad.toString());
          setFecha(new Date(suscripcionParam.fecha));
          setNotas(suscripcionParam.nota || '');
          setEtiquetasSeleccionadas(suscripcionParam.etiquetasPersonalizadasIds || []);
          setNotificar(suscripcionParam.notificar);
          setFrecuencia(suscripcionParam.frecuencia);

          const suscripcionPredefinida = suscripcionesData.find(
            s => s.nombre === suscripcionParam.descripcion
          );
          
          if (suscripcionPredefinida) {
            setPlanesDisponibles(suscripcionPredefinida.planes);
            const planActual = suscripcionPredefinida.planes.find(
              p => p.precio === suscripcionParam.cantidad
            );
            if (planActual) {
              setPlanSeleccionado(planActual);
            }
          }
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos de la suscripción');
        navigation.goBack();
      } finally {
        setCargandoDatos(false);
      }
    };

    if (token) cargarDatos();
  }, [token, suscripcionParam]);

  // --- Handlers de Interacción ---
  const handleFechaChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setFecha(selectedDate);
    }
  };

  const toggleEtiqueta = (id: number) => {
    setEtiquetasSeleccionadas(prev => 
      prev.includes(id) 
        ? prev.filter(etqId => etqId !== id) 
        : [...prev, id]
    );
  };

  const handleSeleccionarPlan = (plan: Plan) => {
    setPlanSeleccionado(plan);
    setCantidad(plan.precio.toString());
    setShowPlanesModal(false);
  };

  const handleActualizar = async () => {
    if (!descripcion.trim() || !planSeleccionado) {
      Alert.alert('Error', 'El servicio y el plan son obligatorios.');
      return;
    }

    setIsLoading(true);
    try {
      const cantidadNum = parseFloat(cantidad.replace(',', '.'));
      const suscripcionData = {
        Id: suscripcionParam.id,
        CategoriaId: 9,
        Cantidad: cantidadNum,
        Descripcion: descripcion.trim(),
        Fecha: fecha.toISOString(),
        Frecuencia: frecuencia,
        Activo: true,
        Notificar: notificar,
        Nota: notas.trim() || `Plan: ${planSeleccionado.nombre}`,
        MetodoPagoId: null,
        EtiquetasPersonalizadasIds: etiquetasSeleccionadas
      };

      await axios.put(`${API_BASE_URL}/api/gastos/${suscripcionParam.id}`, suscripcionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Éxito', 'Suscripción actualizada correctamente');
      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Error al actualizar la suscripción';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (cargandoDatos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Suscripción</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.section}>
        
        <Text style={styles.label}>Servicio *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Netflix, Spotify"
          placeholderTextColor="#94a3b8"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Text style={styles.label}>Plan *</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowPlanesModal(true)}
        >
          <Text style={!planSeleccionado ? styles.placeholderText : styles.inputText}>
            {planSeleccionado 
              ? `${planSeleccionado.nombre} - ${planSeleccionado.precio.toFixed(2)} €` 
              : 'Seleccionar un plan'}
          </Text>
          <Icon name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>

        <Text style={styles.label}>Fecha de inicio</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => setShowDatePicker(true)}
        > 
          <Text style={styles.inputText}>{formatDate(fecha)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display="default"
            onChange={handleFechaChange}
          />
        )}

        <Text style={styles.label}>Frecuencia *</Text>
        <View style={styles.frecuenciaContainer}>
          <TouchableOpacity
            style={[styles.frecuenciaButton, frecuencia === 3 && styles.frecuenciaButtonSelected]}
            onPress={() => setFrecuencia(3)}
          >
            <Text style={[styles.frecuenciaText, frecuencia === 3 && styles.frecuenciaTextSelected]}>
              Mensual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.frecuenciaButton, frecuencia === 4 && styles.frecuenciaButtonSelected]}
            onPress={() => setFrecuencia(4)}
          >
            <Text style={[styles.frecuenciaText, frecuencia === 4 && styles.frecuenciaTextSelected]}>
              Anual
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Notificar próximo pago</Text>
          <Switch
            value={notificar}
            onValueChange={setNotificar}
            trackColor={{ false: '#767577', true: '#2563eb' }}
            thumbColor={Platform.OS === 'android' ? '#f4f3f4' : undefined}
          />
        </View>

        <Text style={styles.label}>Etiquetas</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowEtiquetasModal(true)}
        >
          <Text style={etiquetasSeleccionadas.length === 0 ? styles.placeholderText : styles.inputText}>
            {etiquetasSeleccionadas.length > 0 
              ? `${etiquetasSeleccionadas.length} seleccionada(s)` 
              : 'Seleccionar etiquetas'}
          </Text>
          <Icon name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>

        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
          placeholder="Agrega detalles adicionales"
          placeholderTextColor="#94a3b8"
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleActualizar}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Actualizar Suscripción</Text>
        )}
      </TouchableOpacity>

      <Modal visible={showPlanesModal} transparent animationType="slide" onRequestClose={() => setShowPlanesModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPlanesModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Plan</Text>
          <FlatList
            data={planesDisponibles}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => handleSeleccionarPlan(item)}>
                <Text style={styles.modalOptionText}>{item.nombre} - {item.precio.toFixed(2)} €</Text>
                {planSeleccionado?.id === item.id && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showEtiquetasModal} transparent animationType="slide" onRequestClose={() => setShowEtiquetasModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowEtiquetasModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContent, { maxHeight: '70%' }]}>
          <Text style={styles.modalTitle}>Seleccionar Etiquetas</Text>
          <FlatList
            data={etiquetasDisponibles}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => toggleEtiqueta(item.id)}>
                <Text style={styles.modalOptionText}>{item.nombre}</Text>
                {etiquetasSeleccionadas.includes(item.id) && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowEtiquetasModal(false)}>
            <Text style={styles.modalCloseButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
        color: '#334155',
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 20,
        fontSize: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#1e293b',
    },
    inputText: {
        fontSize: 16,
        color: '#1e293b',
    },
    placeholderText: {
        fontSize: 16,
        color: '#94a3b8',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 4,
    },
    frecuenciaContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    frecuenciaButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f9fafb',
    },
    frecuenciaButtonSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    frecuenciaText: {
        color: '#334155',
        fontWeight: '500',
    },
    frecuenciaTextSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginHorizontal: 16,
        minHeight: 52,
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#1e293b',
    },
    modalOption: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#334155',
    },
    modalCloseButton: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    modalCloseButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default EditarSuscripcionScreen;