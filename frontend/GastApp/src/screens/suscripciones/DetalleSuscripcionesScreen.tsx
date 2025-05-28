import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Button
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EditarSuscripcionScreen from './EditarSuscripcionScreen';

interface Plan {
  id: number;
  nombre: string;
  precio: number;
}

interface Suscripcion {
  id: number;
  nombre: string;
  planes: Plan[];
}

const DetalleSuscripcionScreen = ({ route, navigation }: any) => {
  const { token } = useAuth();
  const { suscripcionId, title } = route.params;
  const [suscripcion, setSuscripcion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suscripcionesPredefinidas, setSuscripcionesPredefinidas] = useState<Suscripcion[]>([]);

  // Validación de parámetros
  React.useEffect(() => {
    if (!suscripcionId || isNaN(Number(suscripcionId))) {
      Alert.alert('Error', 'ID de suscripción inválido');
      navigation.goBack();
    }
  }, [route.params]);

  const formatFecha = (date: Date) => {
    return format(date, "dd MMMM yyyy", { locale: es });
  };

  const calcularProximoPago = (fecha: Date, frecuencia: number) => {
    const nuevaFecha = new Date(fecha);
    if (frecuencia === 3) { // Mensual
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    } else if (frecuencia === 4) { // Anual
      nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
    }
    return nuevaFecha;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Cargar suscripción desde API
        const response = await axios.get(`${API_BASE_URL}/api/gastos/${suscripcionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Cargar suscripciones predefinidas (de tu archivo de datos)
        // Esto es un ejemplo, ajusta según tu estructura real
        const suscripcionesData = await import('../../data/suscripcionesData');
        setSuscripcionesPredefinidas(
          suscripcionesData.suscripciones.map((s: any, idx: number) => ({
            id: s.id ?? idx,
            nombre: s.nombre,
            planes: s.planes
          }))
        );

        // Buscar si es una suscripción predefinida
        const suscripcionPredefinida = suscripcionesData.suscripciones.find(
          s => s.nombre === response.data.descripcion
        );

        setSuscripcion({
          ...response.data,
          fecha: new Date(response.data.fecha),
          plan: suscripcionPredefinida?.planes.find(
            p => p.precio === response.data.cantidad
          )
        });

      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('No se pudieron cargar los datos de la suscripción');
      } finally {
        setLoading(false);
      }
    };

    if (suscripcionId) {
      fetchData();
    }
  }, [suscripcionId, token]);

  const handleEditar = () => {
    if (!suscripcion) return;
    
    navigation.navigate('EditarSuscripcionScreen', {
      suscripcion: {
        ...suscripcion,
        fecha: suscripcion.fecha.toISOString() // Serializar fecha
      }
    });
  };

  const handleCancelar = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/gastos/${suscripcionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Éxito', 'Suscripción cancelada correctamente');
      // Navega a HomeScreen con flag de refresh
      navigation.navigate('HomeScreen', { refresh: true });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cancelar la suscripción');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando detalles de la suscripción...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="warning-outline" size={40} color="#dc2626" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="Volver" 
          onPress={() => navigation.goBack()} 
        />
      </View>
    );
  }

  if (!suscripcion) {
    return (
      <View style={styles.errorContainer}>
        <Text>No se encontraron datos de la suscripción</Text>
        <Button 
          title="Volver" 
          onPress={() => navigation.goBack()} 
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>{title || 'Detalle de Suscripción'}</Text>
        <TouchableOpacity onPress={handleEditar}>
          <Icon name="create-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Servicio:</Text>
          <Text style={styles.detailValue}>{suscripcion.descripcion || 'Sin descripción'}</Text>
        </View>
        
        {suscripcion.plan && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan:</Text>
            <Text style={styles.detailValue}>
              {suscripcion.plan.nombre} ({suscripcion.plan.precio.toFixed(2)}€)
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Precio:</Text>
          <Text style={[styles.detailValue, styles.amountText]}>
            {suscripcion.cantidad.toFixed(2)}€
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha de inicio:</Text>
          <Text style={styles.detailValue}>{formatFecha(new Date(suscripcion.fecha))}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frecuencia:</Text>
          <Text style={styles.detailValue}>
            {suscripcion.frecuencia === 3 ? 'Mensual' : 
             suscripcion.frecuencia === 4 ? 'Anual' : '-'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Próximo pago:</Text>
          <Text style={styles.detailValue}>
            {formatFecha(calcularProximoPago(
              new Date(suscripcion.fecha), 
              suscripcion.frecuencia
            ))}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Notificaciones:</Text>
          <Text style={styles.detailValue}>
            {suscripcion.notificar ? 'Activadas' : 'Desactivadas'}
          </Text>
        </View>
        
        {suscripcion.nota && (
          <View style={styles.notesContainer}>
            <Text style={styles.detailLabel}>Notas:</Text>
            <Text style={styles.notesText}>{suscripcion.nota}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.deleteButton]} 
        onPress={handleCancelar}
      >
        <Icon name="trash-outline" size={20} color="white" />
        <Text style={styles.buttonText}>Cancelar Suscripción</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Reutiliza los mismos estilos de DetalleGastoScreen
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
    padding: 20
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#dc2626',
    fontSize: 18,
    marginVertical: 20,
    textAlign: 'center'
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
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
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
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: '#e0f2fe',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 5,
    marginBottom: 5,
  },
  tagText: {
    color: '#0369a1',
    fontSize: 12,
  }
});

export default DetalleSuscripcionScreen;