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
import { useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  EditarSuscripcion: { suscripcion: any };
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
  categoriaId: number;
  etiquetas: number[];
}

const EditarSuscripcionScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList> }> = ({ navigation }) => {
  const { token } = useAuth();
  const route = useRoute();
  const { suscripcion: suscripcionParam } = route.params as { suscripcion: Suscripcion };
  
  // Estados para los datos del formulario
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [frecuencia, setFrecuencia] = useState('mensual');
  const [notificar, setNotificar] = useState(false);
  const [notas, setNotas] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<number[]>([]);
  
  // Estados para los datos de selección
  const [suscripcionesPredefinidas, setSuscripcionesPredefinidas] = useState<any[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [etiquetas, setEtiquetas] = useState<any[]>([]);
  const [showPlanesModal, setShowPlanesModal] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Cargar suscripciones predefinidas (desde tu archivo de datos)
        const suscripcionesData = await import('../../data/suscripcionesData');
        setSuscripcionesPredefinidas(suscripcionesData.suscripciones);
        
        // 2. Cargar etiquetas
        const etiquetasRes = await axios.get(`${API_BASE_URL}/api/etiquetaGasto`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEtiquetas(etiquetasRes.data);

        // 3. Procesar la suscripción recibida
        if (suscripcionParam) {
          const suscripcionData = {
            ...suscripcionParam,
            // Mantener fecha como string para el estado principal
            fecha: suscripcionParam.fecha
          };
          
          setSuscripcion(suscripcionData);
          setDescripcion(suscripcionData.descripcion);
          setCantidad(suscripcionData.cantidad.toString());
          setFecha(new Date(suscripcionData.fecha));
          setNotas(suscripcionData.nota || '');
          setEtiquetasSeleccionadas(suscripcionData.etiquetas || []);
          setNotificar(suscripcionData.notificar);
          
          // Configurar frecuencia
          if (suscripcionData.frecuencia > 0) {
            setFrecuencia(
              suscripcionData.frecuencia === 3 ? 'mensual' : 
              suscripcionData.frecuencia === 4 ? 'anual' : 'mensual'
            );
          }

          // Buscar el plan correspondiente
          const suscripcionPredefinida = suscripcionesData.suscripciones.find(
            s => s.nombre === suscripcionData.descripcion
          );
          
          if (suscripcionPredefinida) {
            setPlanes(
              suscripcionPredefinida.planes.map((p: any, idx: number) => ({
                id: p.id ?? idx,
                nombre: p.nombre,
                precio: p.precio
              }))
            );
            const planIndex = suscripcionPredefinida.planes.findIndex(
              (p: any) => p.precio === suscripcionData.cantidad
            );
            if (planIndex !== -1) {
              const plan = suscripcionPredefinida.planes[planIndex];
              setPlanSeleccionado({
                id: planIndex,
                nombre: plan.nombre,
                precio: plan.precio
              });
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
  }, [token]);

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
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
    // Validaciones
    if (!descripcion.trim()) {
      Alert.alert('Error', 'El nombre del servicio es obligatorio');
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'Ingrese una cantidad válida mayor a cero');
      return;
    }

    if (!planSeleccionado) {
      Alert.alert('Error', 'Seleccione un plan');
      return;
    }

    setIsLoading(true);

    try {
      const suscripcionData = {
        Id: suscripcion?.id,
        CategoriaId: 9, // ID fijo para suscripciones
        Cantidad: cantidadNum,
        Descripcion: descripcion.trim(),
        Fecha: fecha.toISOString(),
        Frecuencia: frecuencia === 'mensual' ? 3 : 4, // 3 = mensual, 4 = anual
        Activo: true,
        Notificar: notificar,
        Nota: notas.trim(),
        MetodoPagoId: null, // O puedes agregar un selector de método de pago si lo necesitas
        EtiquetaIds: etiquetasSeleccionadas
      };

      const response = await axios.put(`${API_BASE_URL}/api/gastos/${suscripcion?.id}`, suscripcionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Éxito', 'Suscripción actualizada correctamente');
      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Error al actualizar la suscripción';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join('\n');
      } else if (error.response?.data?.message) {
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

  if (cargandoDatos || !suscripcion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando datos de la suscripción...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editar Suscripción</Text>
        
        <Text style={styles.label}>Servicio *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Netflix, Spotify"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Text style={styles.label}>Plan *</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowPlanesModal(true)}
        >
          <Text>
            {planSeleccionado 
              ? `${planSeleccionado.nombre} (€${planSeleccionado.precio.toFixed(2)})` 
              : 'Seleccionar plan'}
          </Text>
          <Icon name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>Precio</Text>
        <TextInput
          style={[styles.input, { color: '#666' }]}
          value={`€${cantidad}`}
          editable={false}
        />

        <Text style={styles.label}>Fecha de inicio</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => Platform.OS === 'android' && setShowDatePicker(true)}
        > 
          <Text>{formatDate(fecha)}</Text>
          {Platform.OS === 'ios' && <Icon name="calendar" size={20} color="#666" />}
        </TouchableOpacity>

        {(showDatePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === 'ios' ? 'default' : 'calendar'}
            onChange={handleFechaChange}
          />
        )}

        <Text style={styles.label}>Frecuencia *</Text>
        <View style={styles.frecuenciaContainer}>
          <TouchableOpacity
            style={[
              styles.frecuenciaButton,
              frecuencia === 'mensual' && styles.frecuenciaButtonSelected
            ]}
            onPress={() => setFrecuencia('mensual')}
          >
            <Text style={[
              styles.frecuenciaText,
              frecuencia === 'mensual' && styles.frecuenciaTextSelected
            ]}>
              Mensual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.frecuenciaButton,
              frecuencia === 'anual' && styles.frecuenciaButtonSelected
            ]}
            onPress={() => setFrecuencia('anual')}
          >
            <Text style={[
              styles.frecuenciaText,
              frecuencia === 'anual' && styles.frecuenciaTextSelected
            ]}>
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
          />
        </View>

        <Text style={styles.label}>Etiquetas</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowEtiquetasModal(true)}
        >
          <Text>
            {etiquetasSeleccionadas.length > 0 
              ? `${etiquetasSeleccionadas.length} seleccionadas` 
              : 'Seleccionar etiquetas'}
          </Text>
          <Icon name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Sección de notas */}
      <View style={styles.section}>
        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Agrega detalles adicionales"
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      {/* Botón de actualizar */}
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

      {/* Modal de planes */}
      <Modal
        visible={showPlanesModal}
        transparent
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={() => setShowPlanesModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Plan</Text>
          <FlatList
            data={planes}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleSeleccionarPlan(item)}
              >
                <Text>{item.nombre} - €{item.precio.toFixed(2)}</Text>
                {planSeleccionado?.id === item.id && <Icon name="checkmark" size={20} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Modal de etiquetas */}
      <Modal
        visible={showEtiquetasModal}
        transparent
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={() => setShowEtiquetasModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.modalContent, { maxHeight: '70%' }]}>
          <Text style={styles.modalTitle}>Seleccionar Etiquetas</Text>
          <FlatList
            data={etiquetas}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => toggleEtiqueta(item.id)}
              >
                <Text>{item.nombre}</Text>
                {etiquetasSeleccionadas.includes(item.id) && (
                  <Icon name="checkmark" size={20} color="#2563eb" />
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowEtiquetasModal(false)}
          >
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
    padding: 5,
    paddingBottom: 25
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2563eb',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  frecuenciaContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  frecuenciaButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  frecuenciaButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  frecuenciaText: {
    color: '#333',
  },
  frecuenciaTextSelected: {
    color: 'white',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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