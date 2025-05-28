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
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import DateTimePicker from '@react-native-community/datetimepicker';
import notifee, { AndroidImportance } from '@notifee/react-native';

import type { StackNavigationProp } from '@react-navigation/stack';

import { suscripciones } from '../../data/suscripcionesData';
import { mostrarNotificacionNuevaSuscripcion } from '../../notifications/notifeeService';

type RootStackParamList = {
  AgregarGasto: undefined;
  Home: undefined;
};

interface Frecuencia {
  id: string;
  nombre: string;
}

type AgregarSuscripcionesScreenNavigationProp = StackNavigationProp<RootStackParamList, any>;

interface AgregarSuscripcionesScreenProps {
  navigation: AgregarSuscripcionesScreenNavigationProp;
}

const AgregarSuscripcionesScreen: React.FC<AgregarSuscripcionesScreenProps> = ({ navigation }) => {
  const { token } = useAuth();

  // Estado para suscripciones y planes
  const [suscripcionSeleccionada, setSuscripcionSeleccionada] = useState(suscripciones[0]?.nombre || '');
  const [planSeleccionado, setPlanSeleccionado] = useState<string | null>(null);
  const [esFrecuente, setEsFrecuente] = useState(false);

  // Campos del formulario
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frecuencia, setFrecuencia] = useState<number>(3); // 3 = mensual
  const [notificar, setNotificar] = useState(false);
  const [notas, setNotas] = useState('');

  
  const frecuencias: Frecuencia[] = [
    { id: 'mensual', nombre: 'Mensual' },
    { id: 'anual', nombre: 'Anual' },
  ]

  // Cuando cambie la suscripción seleccionada, seleccionamos automáticamente el primer plan y actualizamos campos
  useEffect(() => {
    const suscripcionObj = suscripciones.find(s => s.nombre === suscripcionSeleccionada);
    if (suscripcionObj && suscripcionObj.planes.length > 0) {
      const primerPlan = suscripcionObj.planes[0];
      setPlanSeleccionado(`${primerPlan.nombre} - ${primerPlan.precio.toFixed(2)}`);
      setDescripcion(suscripcionObj.nombre);
      setCantidad(primerPlan.precio.toFixed(2));
    }
  }, [suscripcionSeleccionada]);

  // Cuando cambia el plan seleccionado, actualizamos descripción y cantidad
  useEffect(() => {
    if (!planSeleccionado) return;
    const suscripcionObj = suscripciones.find(suscripcion => suscripcion.nombre === suscripcionSeleccionada);
    if (!suscripcionObj) return;

    const planNombrePrecio = planSeleccionado.split(' - ');
    const planNombre = planNombrePrecio[0];
    const planObj = suscripcionObj.planes.find(plan => plan.nombre === planNombre);
    if (planObj) {
      setDescripcion(suscripcionObj.nombre);
      setCantidad(planObj.precio.toFixed(2));
    }
  }, [planSeleccionado]);

  useEffect(() => {
      (async () => {
        const settings = await notifee.requestPermission();
        if (settings.authorizationStatus < 1) {
          console.warn('Permiso para notificaciones denegado');
        }
      })();
    }, []);

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fecha;
    setShowDatePicker(Platform.OS === 'ios');
    setFecha(currentDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleGuardar = async () => {
    if (!descripcion.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }
    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'Ingrese una cantidad válida mayor a cero');
      return;
    }

    if (notas && notas.length > 500) {
      Alert.alert('Error', 'Las notas no pueden exceder los 500 caracteres');
      return;
    }

    try {
      const gastoData = {
        CategoriaId: 9, // Id fijo para suscripciones
        Cantidad: cantidadNum,
        Descripcion: descripcion.trim(),
        Fecha: fecha.toISOString(),
        Activo: true,
        EsFrecuente: true,
        ...(esFrecuente && {
        Frecuencia: frecuencia,
        Notificar: notificar
      }),
        Nota: notas?.trim() || '',
        MetodoPagoId: null,
        EtiquetaIds: []
      };

      const response = await axios.post(`${API_BASE_URL}/api/gastos`, gastoData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await mostrarNotificacionNuevaSuscripcion(descripcion, cantidadNum);
      Alert.alert('Éxito', 'Suscripción guardada correctamente');
      setTimeout(() => navigation.goBack(), 500);
    } catch (error) {
      let errorMessage = 'Error al guardar la suscripción';
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.errors) {
          const validationErrors = Object.values(error.response.data.errors)
            .flat()
            .join('\n');
          errorMessage = `Errores de validación:\n${validationErrors}`;
        } else {
          errorMessage = error.response?.data?.title || error.response?.data?.message || error.message;
        }
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agregar Suscripción</Text>

        <Text style={styles.label}>Suscripción *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={suscripcionSeleccionada}
            onValueChange={(itemValue) => setSuscripcionSeleccionada(itemValue)}
            mode="dropdown"
          >
            {suscripciones.map((sus) => (
              <Picker.Item key={sus.nombre} label={sus.nombre} value={sus.nombre} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Plan *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={planSeleccionado}
            onValueChange={(itemValue) => setPlanSeleccionado(itemValue)}
            mode="dropdown"
          >
            {suscripciones.find(s => s.nombre === suscripcionSeleccionada)?.planes.map(plan => (
              <Picker.Item
                key={plan.nombre}
                label={`${plan.nombre} - ${plan.precio.toFixed(2)} €`}
                value={`${plan.nombre} - ${plan.precio.toFixed(2)}`}
              />
            ))}
          </Picker>
        </View>

            
        <View style={styles.hidden}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={styles.input}
            placeholder="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
          />
        </View>

        <View style={styles.hidden}>
          <Text style={styles.label}>Cantidad (€) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Cantidad"
            keyboardType="decimal-pad"
            value={cantidad}
            onChangeText={(text) => setCantidad(text.replace(',', '.'))}
          />
        </View>

        <Text style={styles.label}>Fecha de inicio</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{fecha.toLocaleDateString('es-ES')}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display="default"
            onChange={handleFechaChange}
          />
        )}

        
        <View style={styles.hidden}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>¿Es un gasto frecuente?</Text>
            <Switch
              value={true}
              disabled={true}
              trackColor={{ true: '#2563eb' }}
            />
          </View>
        </View>

        <Text style={styles.label}>Frecuencia</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={frecuencia}
            onValueChange={(value) => setFrecuencia(value)}
            mode="dropdown"
          >
            {frecuencias.map((freq) => (
              <Picker.Item key={freq.id} label={freq.nombre} value={freq.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>¿Notificar próximo pago?</Text>
          <Switch
            value={notificar}
            onValueChange={setNotificar}
            trackColor={{ false: '#767577', true: '#2563eb' }}
          />
        </View>

        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Agrega cualquier detalle adicional sobre esta suscripción"
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!descripcion || !cantidad || isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0) && styles.buttonDisabled]}
        onPress={handleGuardar}
        disabled={!descripcion || !cantidad || isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0}
      >
        <Text style={styles.buttonText}>Guardar Suscripción</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
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
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
  hidden: {
    display: 'none',
  },
});

export default AgregarSuscripcionesScreen;
