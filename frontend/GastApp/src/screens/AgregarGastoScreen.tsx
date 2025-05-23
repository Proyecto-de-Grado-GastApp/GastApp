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
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { mostrarNotificacionGasto } from '../notifications/notifeeService';

import type { StackNavigationProp } from '@react-navigation/stack';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import MLKitOcr from 'react-native-mlkit-ocr';
import RNFS from 'react-native-fs';

import notifee, { AndroidImportance } from '@notifee/react-native';

type RootStackParamList = {
  AgregarGasto: undefined;
  Home: undefined;
};

type AgregarGastoScreenNavigationProp = StackNavigationProp<RootStackParamList, any>;

interface AgregarGastoScreenProps {
  navigation: AgregarGastoScreenNavigationProp;
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Frecuencia {
  id: string;
  nombre: string;
}

const AgregarGastoScreen: React.FC<AgregarGastoScreenProps> = ({ navigation }) => {
  const { token } = useAuth();
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [esFrecuente, setEsFrecuente] = useState(false);
  const [frecuencia, setFrecuencia] = useState('mensual');
  const [notificar, setNotificar] = useState(false);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [notas, setNotas] = useState('');
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const frecuencias: Frecuencia[] = [
    { id: 'diaria', nombre: 'Diaria' },
    { id: 'semanal', nombre: 'Semanal' },
    { id: 'mensual', nombre: 'Mensual' },
    { id: 'anual', nombre: 'Anual' },
  ];

  useEffect(() => {
    const cargarCategorias = async () => {
      setCargandoCategorias(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categorias`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setCategorias(response.data);
        if (response.data.length > 0) {
          setCategoriaId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error cargando categorías:', error);
        Alert.alert('Error', 'No se pudieron cargar las categorías');
      } finally {
        setCargandoCategorias(false);
      }
    };

    if (token) cargarCategorias();
  }, [token]);

  const handleFechaChange = (
    event: any,
    selectedDate?: Date | undefined
  ): void => {
    // Esto es necesario para Android
    setShowDatePicker(Platform.OS === 'ios'); // Cerramos el picker en Android
    
    if (event.type === 'set' && selectedDate) {
      setFecha(selectedDate);
    }
  };

  const analizarImagen = async (originalUri: string) => {
    try {
      const blocks = await MLKitOcr.detectFromUri(originalUri);
      const allText = blocks.map(block => block.text).join('\n');
      console.log('Texto completo detectado:', allText);

      // Función mejorada para detectar montos
      const extractAmount = (text: string) => {
        // Patrones específicos para Mercadona
        const mercadonaPatterns = [
          /TOTAL\s+(\d+[.,]\d{2})/i,               // TOTAL 32,68
          /TOTAL.*?\n.*?(\d+[.,]\d{2})/i,          // TOTAL (línea siguiente)
          /TARJETA\.BANCARIA\s+(\d+[.,]\d{2})/i,   // TARJETA.BANCARIA 32,68
          /(\d+[.,]\d{2})\s*€?\s*$/im              // Número al final de línea
        ];

        // Buscar primero patrones específicos de Mercadona
        for (const pattern of mercadonaPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            return match[1].replace(',', '.');
          }
        }

        // Si no encuentra, usar el método genérico
        const allNumbers = text.match(/\d+[.,]\d{2}/g) || [];
        if (allNumbers.length > 0) {
          // Ordenar de mayor a menor y tomar el primero (el más grande)
          const sortedNumbers = [...new Set(allNumbers)].sort((a, b) => {
            const numA = parseFloat(a.replace(',', '.'));
            const numB = parseFloat(b.replace(',', '.'));
            return numB - numA;
          });
          return sortedNumbers[0].replace(',', '.');
        }

        return null;
      };

      // Función mejorada para detectar descripción
      const extractDescription = (text: string) => {
        // Detectar si es ticket de Mercadona
        const isMercadona = text.includes('MERCADONA') || 
                          text.includes('MERCADONA S.A.') || 
                          text.includes('CENTRO:');

        if (isMercadona) {
          // Extraer ubicación del Mercadona
          const locationMatch = text.match(/AVDA\. .+\n\s+([A-ZÁÉÍÓÚÑ]+)/i);
          const location = locationMatch ? locationMatch[1] : 'Mercadona';
          
          // Extraer fecha del ticket
          const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
          const date = dateMatch ? dateMatch[0] : '';
          
          return `Compra ${location} ${date}`.trim();
        }

        // Para otros supermercados, buscar el nombre
        const supermarketNames = ['CARREFOUR', 'ALCAMPO', 'LIDL', 'ALDI', 'DIA', 'HIPERCOR', 'EL CORTE INGLÉS'];
        for (const name of supermarketNames) {
          if (text.includes(name)) {
            return `Compra ${name}`;
          }
        }

        // Si no reconoce el supermercado, buscar primera línea con texto significativo
        const lines = text.split('\n')
          .filter(line => line.trim().length > 3 && !line.match(/^\d/))
          .filter(line => !line.match(/TICKET|TOTAL|CIF|TELEFONO|IVA|PRECIO|IMPORTE/i));

        return lines.length > 0 ? lines[0].trim() : 'Compra no identificada';
      };

      // Extraer datos
      const cantidadDetectada = extractAmount(allText);
      const descripcionDetectada = extractDescription(allText);

      // Mostrar confirmación con opción a editar
      Alert.alert(
        'Datos detectados',
        `Descripción: ${descripcionDetectada}\nMonto: ${cantidadDetectada || 'No detectado'}`,
        [
          {
            text: 'Usar estos datos',
            onPress: () => {
              if (cantidadDetectada) setCantidad(cantidadDetectada);
              if (descripcionDetectada) setDescripcion(descripcionDetectada);
            }
          },
          {
            text: 'Editar manualmente',
            onPress: () => {
              // Foco en los campos de texto para edición
              if (cantidadDetectada) setCantidad(cantidadDetectada);
              if (descripcionDetectada) setDescripcion(descripcionDetectada);
            },
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      console.error('Error procesando imagen:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen');
    }
  };

  const manejarImagenDesdeCamara = () => {
    launchCamera({ 
      mediaType: 'photo', 
      quality: 0.6,
      includeBase64: false,
      saveToPhotos: false // No guardar en galería para evitar permisos
    }, async response => {
      if (response.assets && response.assets.length > 0) {
        const img = response.assets[0];
        if (img.uri) {
          await analizarImagen(img.uri);
        }
      }
    });
  };

  const manejarImagenDesdeGaleria = () => {
    launchImageLibrary({ 
      mediaType: 'photo', 
      quality: 0.6,
      includeBase64: false
    }, async response => {
      if (response.assets && response.assets.length > 0) {
        const img = response.assets[0];
        if (img.uri) {
          await analizarImagen(img.uri);
        }
      }
    });
  };

  const handleGuardar = async () => {
  // Validaciones básicas
  if (!descripcion?.trim()) {
    Alert.alert('Error', 'La descripción es obligatoria');
    return;
  }

  const cantidadNum = parseFloat(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    Alert.alert('Error', 'Ingrese una cantidad válida mayor a cero');
    return;
  }

  if (!categoriaId) {
    Alert.alert('Error', 'Seleccione una categoría');
    return;
  }

  // Validación específica para Nota
  if (notas && notas.length > 500) {
    Alert.alert('Error', 'Las notas no pueden exceder los 500 caracteres');
    return;
  }

  setIsLoading(true);

  try {
    // Estructura de datos ajustada a las validaciones del backend
    const gastoData = {
      CategoriaId: categoriaId,
      Cantidad: cantidadNum,
      Descripcion: descripcion.trim(),
      Fecha: fecha.toISOString(),
      Activo: true,
      EsFrecuente: esFrecuente,
      ...(esFrecuente && {
        Frecuencia: frecuencia,
        Notificar: notificar
      }),
      Nota: notas?.trim() || '',
      MetodoPagoId: null,
      EtiquetaIds: []
    };

    console.log('Datos a enviar:', JSON.stringify(gastoData, null, 2));

    const response = await axios.post(`${API_BASE_URL}/api/gastos`, gastoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    await mostrarNotificacionGasto(descripcion, cantidadNum);
    Alert.alert('Éxito', 'Gasto guardado correctamente');
    setTimeout(() => navigation.goBack(), 500);
  } catch (error) {
    let errorMessage = 'Error al guardar el gasto';
    
    if (axios.isAxiosError(error)) {
      // Manejo detallado de errores de validación
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors)
          .flat()
          .join('\n');
        errorMessage = `Errores de validación:\n${validationErrors}`;
      } else {
        errorMessage = error.response?.data?.title || 
                      error.response?.data?.message || 
                      error.message;
      }
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

  useEffect(() => {
    (async () => {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus < 1) {
        console.warn('Permiso para notificaciones denegado');
      }
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Sección de información básica */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Gasto</Text>
        
        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Compra supermercado"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Text style={styles.label}>Cantidad (€) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={cantidad}
          onChangeText={(text) => setCantidad(text.replace(',', '.'))}
        />

        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => {
            if (Platform.OS === 'android') {
              setShowDatePicker(true); // Solo necesitamos esto en Android
            }
          }}
        > 
          <View style={{flex: 1}}>
            <Text>{formatDate(fecha)}</Text>
          </View>
          {Platform.OS === 'ios' && (
            <Icon name="calendar" size={20} color="#666" />
          )}
        </TouchableOpacity>

        {(showDatePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === 'android' ? 'calendar' : 'default'}
            onChange={handleFechaChange}
            maximumDate={new Date()} // Opcional: para no permitir fechas futuras
          />
        )}

        <Text style={styles.label}>Categoría *</Text>
        {cargandoCategorias ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        ) : categorias.length > 0 ? (
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
        ) : (
          <Text style={styles.errorText}>No hay categorías disponibles</Text>
        )}
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
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowFrecuenciaModal(true)}
            >
              <Text>
                {frecuencias.find(f => f.id === frecuencia)?.nombre ?? 'Seleccionar'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" style={styles.dropdownIcon} />
            </TouchableOpacity>

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

      {/* Sección de notas adicionales */}
      <View style={styles.section}>
        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Agrega cualquier detalle adicional sobre este gasto"
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      {/* Botón de guardar */}
      <TouchableOpacity 
        style={[styles.button, (!descripcion || !cantidad || !categoriaId || isLoading) && styles.buttonDisabled]} 
        onPress={handleGuardar}
        disabled={!descripcion || !cantidad || !categoriaId || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Guardar Gasto</Text>
        )}
      </TouchableOpacity>

      {/* Modal de frecuencia */}
      <Modal
        visible={showFrecuenciaModal}
        transparent={true}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={() => setShowFrecuenciaModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Frecuencia</Text>
          {frecuencias.map((freq) => (
            <TouchableOpacity
              key={freq.id}
              style={styles.modalOption}
              onPress={() => {
                setFrecuencia(freq.id);
                setShowFrecuenciaModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{freq.nombre}</Text>
              {frecuencia === freq.id && (
                <Icon name="checkmark" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={styles.floatingButton} onPress={manejarImagenDesdeGaleria}>
          <Icon name="image" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floatingButton, { bottom: 140 }]} onPress={manejarImagenDesdeCamara}>
          <Icon name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  categoryButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryText: {
    color: '#333',
  },
  categoryTextSelected: {
    color: 'white',
  },
  dropdownIcon: {
    marginLeft: 10,
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
    paddingBottom: 30,
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
  modalOptionText: {
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    padding: 10,
  },
  floatingButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 100,
  },
  floatingButton: {
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginBottom: 15,
  },

});

export default AgregarGastoScreen;