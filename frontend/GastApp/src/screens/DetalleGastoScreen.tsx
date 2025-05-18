import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DetalleGastoScreen = ({ route, navigation }: any) => {
  const { token } = useAuth();
  const { gastoId } = route.params;
  const [gasto, setGasto] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados para edición
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [notas, setNotas] = useState('');
  const [esFrecuente, setEsFrecuente] = useState(false);
  const [frecuencia, setFrecuencia] = useState('');
  const [notificar, setNotificar] = useState(false);

  const categorias = [
    { id: 1, nombre: 'Comida' },
    { id: 2, nombre: 'Transporte' },
    { id: 3, nombre: 'Hogar' },
    { id: 4, nombre: 'Ocio' },
    { id: 5, nombre: 'Salud' },
    { id: 6, nombre: 'Educación' },
    { id: 7, nombre: 'Otros' }
  ];

  const frecuencias = [
  { id: 'diaria', nombre: 'Diaria', valorBackend: 1 },
  { id: 'semanal', nombre: 'Semanal', valorBackend: 2 },
  { id: 'mensual', nombre: 'Mensual', valorBackend: 3 },
  { id: 'anual', nombre: 'Anual', valorBackend: 4 }
];

  useEffect(() => {
    const fetchGasto = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/gastos/${gastoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setGasto(res.data);
        // Inicializar estados de edición
        setDescripcion(res.data.descripcion);
        setCantidad(res.data.cantidad.toString());
        setFecha(new Date(res.data.fecha));
        setCategoriaId(res.data.categoriaId);
        setNotas(res.data.nota || '');
        setEsFrecuente(res.data.frecuencia !== null);
        setFrecuencia(res.data.frecuencia || '');
        setNotificar(res.data.notificar);
      } catch (error) {
        console.error('Error obteniendo gasto:', error);
        Alert.alert('Error', 'No se pudo cargar el gasto');
      } finally {
        setLoading(false);
      }
    };

    fetchGasto();
  }, [gastoId, token]);

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fecha;
    setShowDatePicker(false);
    setFecha(currentDate);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const formatFecha = (date: Date) => {
    return format(date, "dd MMMM yyyy", { locale: es });
  };

  if (loading || !gasto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleGuardarCambios = async () => {
  // Validaciones básicas
  if (!descripcion.trim()) {
    Alert.alert('Error', 'La descripción es obligatoria');
    return;
  }

  const cantidadNum = parseFloat(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    Alert.alert('Error', 'Ingrese una cantidad válida mayor a cero');
    return;
  }

  try {
    const datosActualizados = {
      Id: gastoId,
      CategoriaId: categoriaId || null, // Puede ser null según el DTO
      MetodoPagoId: null, // O el valor correspondiente si lo manejas
      Cantidad: cantidadNum,
      Descripcion: descripcion.trim(),
      Fecha: fecha.toISOString(),
      Frecuencia: esFrecuente
        ? (frecuencias.findIndex(f => f.id === frecuencia) + 1 || 0) // Mapear a número
        : 0,
      Activo: true,
      Notificar: esFrecuente ? notificar : false,
      Nota: notas.trim() || null, // Enviar null si está vacío
      EtiquetaIds: [] // Array vacío si no manejas etiquetas
    };

    console.log('Datos a enviar:', JSON.stringify(datosActualizados, null, 2));

    const response = await axios.put(`${API_BASE_URL}/api/gastos/${gastoId}`, datosActualizados, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Actualizar el estado local
    setGasto({
      ...gasto,
      descripcion: datosActualizados.Descripcion,
      cantidad: datosActualizados.Cantidad,
      fecha: datosActualizados.Fecha,
      categoriaId: datosActualizados.CategoriaId,
      nota: datosActualizados.Nota,
      frecuencia: frecuencias[datosActualizados.Frecuencia - 1]?.id || null, // Mapear de vuelta
      notificar: datosActualizados.Notificar
    });

    Alert.alert('Éxito', 'Los cambios se guardaron correctamente');
    setEditMode(false);
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    
    let errorMessage = 'No se pudieron guardar los cambios';
    if (axios.isAxiosError(error)) {
      // Mostrar mensajes de validación del backend
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors)
          .flat()
          .join('\n');
        errorMessage = `Errores de validación:\n${validationErrors}`;
      } else {
        errorMessage = error.response?.data?.title || 
                      error.response?.data?.message || 
                      errorMessage;
      }
    }
    
    Alert.alert('Error', errorMessage);
  }
};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Gasto</Text>
        <TouchableOpacity onPress={toggleEditMode}>
          <Icon 
            name={editMode ? "close" : "create-outline"} 
            size={24} 
            color="#2563eb" 
          />
        </TouchableOpacity>
      </View>

      {editMode ? (
        <View style={styles.editContainer}>
          {/* Sección de información básica */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Gasto</Text>
            
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <Text style={styles.label}>Cantidad (€)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={cantidad}
              onChangeText={setCantidad}
            />

            <Text style={styles.label}>Fecha</Text>
           <TouchableOpacity 
              style={[styles.input, {flexDirection: 'row', alignItems: 'center'}]} 
              onPress={() => setShowDatePicker(true)}
            >
              <View style={{flex: 1}}>
                <Text>{formatFecha(fecha)}</Text>
              </View>
              <Icon name="calendar" size={20} color="#666" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                onChange={handleFechaChange}
              />
            )}

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoriesContainer}>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    categoriaId === cat.id && styles.categoryButtonSelected
                  ]}
                  onPress={() => setCategoriaId(cat.id)}
                >
                  <Text style={[
                    styles.categoryText,
                    categoriaId === cat.id && styles.categoryTextSelected
                  ]}>
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sección de gasto frecuente */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>¿Es un gasto frecuente?</Text>
              <Switch
                value={esFrecuente}
                onValueChange={setEsFrecuente}
                trackColor={{ false: '#767577', true: '#2563eb' }}
              />
            </View>

            {esFrecuente && (
              <>
                <Text style={styles.label}>Frecuencia</Text>
                <View style={styles.categoriesContainer}>
                  {frecuencias.map((freq) => (
                    <TouchableOpacity
                      key={freq.id}
                      style={[
                        styles.categoryButton,
                        frecuencia === freq.id && styles.categoryButtonSelected
                      ]}
                      onPress={() => setFrecuencia(freq.id)}
                    >
                      <Text style={[
                        styles.categoryText,
                        frecuencia === freq.id && styles.categoryTextSelected
                      ]}>
                        {freq.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.label}>¿Notificar próximo pago?</Text>
                  <Switch
                    value={notificar}
                    onValueChange={setNotificar}
                    trackColor={{ false: '#767577', true: '#2563eb' }}
                  />
                </View>
              </>
            )}
          </View>

          {/* Sección de notas */}
          <View style={styles.section}>
            <Text style={styles.label}>Notas adicionales</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notas}
              onChangeText={setNotas}
              multiline
              placeholder="Agrega cualquier detalle adicional"
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleGuardarCambios}
          >
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.detailContainer}>
          {/* Vista de detalle (solo lectura) */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Descripción:</Text>
              <Text style={styles.detailValue}>{gasto.descripcion || 'Sin descripción'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cantidad:</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                €{gasto.cantidad.toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailValue}>{formatFecha(new Date(gasto.fecha))}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Categoría:</Text>
              <Text style={styles.detailValue}>
                {categorias.find(c => c.id === gasto.categoriaId)?.nombre || 'Otros'}
              </Text>
            </View>
            {gasto.frecuencia ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Frecuencia:</Text>
                  <Text style={styles.detailValue}>
                    {frecuencias.find(f => f.id === gasto.frecuencia)?.nombre || '-'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notificar:</Text>
                  <Text style={styles.detailValue}>
                    {gasto.notificar ? 'Sí' : 'No'}
                  </Text>
                </View>
              </>
            ) : null}
            {gasto.nota && (
              <View style={styles.notesContainer}>
                <Text style={styles.detailLabel}>Notas:</Text>
                <Text style={styles.notesText}>
                  {gasto?.nota || 'Sin nota'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailContainer: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  amountText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  notesContainer: {
    marginTop: 8,
    flex: 1,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
    flexShrink: 1,
    flexWrap: 'wrap'
  },
  editContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  categoryButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryText: {
    color: '#334155',
  },
  categoryTextSelected: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetalleGastoScreen;