import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Switch,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  FlatList
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import DateTimePicker from '@react-native-community/datetimepicker';
import notifee from '@notifee/react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { suscripciones as suscripcionesOriginales } from '../../data/suscripcionesData';
import { mostrarNotificacionNuevaSuscripcion } from '../../notifications/notifeeService';
import Icon from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  AgregarGasto: undefined;
  Home: undefined;
};

interface Plan {
  id: number;
  nombre: string;
  precio: number;
}

interface SuscripcionPredefinida {
  nombre: string;
  planes: Plan[];
}

interface Frecuencia {
  id: number;
  nombre: string;
}

type AgregarSuscripcionesScreenNavigationProp = StackNavigationProp<RootStackParamList, any>;

interface AgregarSuscripcionesScreenProps {
  navigation: AgregarSuscripcionesScreenNavigationProp;
}

// Se procesan los datos originales para añadir un ID a cada plan
const suscripcionesData = suscripcionesOriginales.map(suscripcion => ({
  ...suscripcion,
  planes: suscripcion.planes.map((plan, index) => ({
    ...plan,
    id: index 
  }))
}));

const frecuenciasDisponibles: Frecuencia[] = [
    { id: 3, nombre: 'Mensual' },
    { id: 4, nombre: 'Anual' },
];

const AgregarSuscripcionesScreen: React.FC<AgregarSuscripcionesScreenProps> = ({ navigation }) => {
  const { token } = useAuth();

  const [suscripcionSeleccionada, setSuscripcionSeleccionada] = useState<SuscripcionPredefinida | null>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);
  const [frecuencia, setFrecuencia] = useState<number>(3);
  
  const [showSuscripcionesModal, setShowSuscripcionesModal] = useState(false);
  const [showPlanesModal, setShowPlanesModal] = useState(false);
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);

  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notificar, setNotificar] = useState(true);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    (async () => {
      await notifee.requestPermission();
    })();
  }, []);

  const handleSeleccionarSuscripcion = (suscripcion: SuscripcionPredefinida) => {
    setSuscripcionSeleccionada(suscripcion);
    setPlanSeleccionado(null);
    setCantidad('');
    setShowSuscripcionesModal(false);
  };

  const handleSeleccionarPlan = (plan: Plan) => {
    setPlanSeleccionado(plan);
    setCantidad(plan.precio.toString());
    setShowPlanesModal(false);
  };
  
  const handleSeleccionarFrecuencia = (frec: Frecuencia) => {
    setFrecuencia(frec.id);
    setShowFrecuenciaModal(false);
  };

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setFecha(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleGuardar = async () => {
    if (!suscripcionSeleccionada || !planSeleccionado) {
      Alert.alert('Error', 'Debe seleccionar un servicio y un plan.');
      return;
    }

    const cantidadNum = parseFloat(cantidad.replace(',', '.'));
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      Alert.alert('Error', 'La cantidad del plan no es válida.');
      return;
    }

    try {
      const gastoData = {
        CategoriaId: 9,
        Cantidad: cantidadNum,
        Descripcion: suscripcionSeleccionada.nombre,
        Fecha: fecha.toISOString(),
        Activo: true,
        Frecuencia: frecuencia,
        Notificar: notificar,
        Nota: notas.trim() || `Plan: ${planSeleccionado.nombre}`,
        MetodoPagoId: null,
        EtiquetasPersonalizadasIds: []
      };

      await axios.post(`${API_BASE_URL}/api/gastos`, gastoData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await mostrarNotificacionNuevaSuscripcion(suscripcionSeleccionada.nombre, cantidadNum);
      Alert.alert('Éxito', 'Suscripción guardada correctamente');
      setTimeout(() => navigation.goBack(), 500);

    } catch (error) {
      let errorMessage = 'Error al guardar la suscripción';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.data?.title || error.message;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Agregar Suscripción</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Servicio *</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowSuscripcionesModal(true)}
        >
          <Text style={!suscripcionSeleccionada ? styles.placeholderText : styles.inputText}>
            {suscripcionSeleccionada?.nombre || 'Seleccionar un servicio'}
          </Text>
          <Icon name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>

        <Text style={styles.label}>Plan *</Text>
        <TouchableOpacity 
          style={[styles.input, !suscripcionSeleccionada && styles.inputDisabled]}
          onPress={() => setShowPlanesModal(true)}
          disabled={!suscripcionSeleccionada}
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
        
        <Text style={styles.label}>Frecuencia</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowFrecuenciaModal(true)}
        >
          <Text style={styles.inputText}>
            {frecuenciasDisponibles.find(f => f.id === frecuencia)?.nombre || 'Seleccionar frecuencia'}
          </Text>
          <Icon name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>¿Notificar próximo pago?</Text>
          <Switch
            value={notificar}
            onValueChange={setNotificar}
            trackColor={{ false: '#767577', true: '#2563eb' }}
            thumbColor={Platform.OS === 'android' ? '#f4f3f4' : undefined}
          />
        </View>

        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
          placeholder="Ej: Plan familiar, compartido, etc."
          placeholderTextColor="#94a3b8"
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.button, !planSeleccionado && styles.buttonDisabled]}
        onPress={handleGuardar}
        disabled={!planSeleccionado}
      >
        <Text style={styles.buttonText}>Guardar Suscripción</Text>
      </TouchableOpacity>
      
      <Modal
        visible={showSuscripcionesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuscripcionesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuscripcionesModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Servicio</Text>
          <FlatList
            data={suscripcionesData}
            keyExtractor={item => item.nombre}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleSeleccionarSuscripcion(item)}
              >
                <Text style={styles.modalOptionText}>{item.nombre}</Text>
                {suscripcionSeleccionada?.nombre === item.nombre && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={showPlanesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPlanesModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Plan para {suscripcionSeleccionada?.nombre}</Text>
          <FlatList
            data={suscripcionSeleccionada?.planes || []}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleSeleccionarPlan(item)}
              >
                <Text style={styles.modalOptionText}>{item.nombre} - {item.precio.toFixed(2)} €</Text>
                {planSeleccionado?.id === item.id && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
                <Text style={styles.emptyListText}>Selecciona un servicio para ver sus planes.</Text>
            }
          />
        </View>
      </Modal>

      <Modal
        visible={showFrecuenciaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFrecuenciaModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFrecuenciaModal(false)}>
            <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Frecuencia</Text>
            <FlatList
                data={frecuenciasDisponibles}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => handleSeleccionarFrecuencia(item)}
                    >
                        <Text style={styles.modalOptionText}>{item.nombre}</Text>
                        {frecuencia === item.id && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
                    </TouchableOpacity>
                )}
            />
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
  inputDisabled: {
      backgroundColor: '#f1f5f9',
      opacity: 0.7,
  },
  inputText: {
    fontSize: 16,
    color: '#1e293b',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  emptyListText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 20,
    fontSize: 16,
  },
});

export default AgregarSuscripcionesScreen;