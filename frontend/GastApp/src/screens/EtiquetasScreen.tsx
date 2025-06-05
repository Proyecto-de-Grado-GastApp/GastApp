import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import Icon from 'react-native-vector-icons/Ionicons';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  EtiquetasScreen: undefined;
  AgregarGasto: undefined;
  CrearEtiquetaScreen: undefined;
  // ... otras pantallas
};

interface EtiquetaPersonalizada {
  id: number;
  nombre: string;
  color: string;
  usuarioId?: number;
}

interface Gasto {
  id: number;
  descripcion: string;
  cantidad: number;
  fecha: string;
  categoriaId: number;
  categoriaNombre: string;
}

const EtiquetasScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList> }> = ({ navigation }) => {
  const { token } = useAuth();
  const [etiquetas, setEtiquetas] = useState<EtiquetaPersonalizada[]>([]);
  const [gastosPorEtiqueta, setGastosPorEtiqueta] = useState<Record<number, Gasto[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedEtiqueta, setExpandedEtiqueta] = useState<number | null>(null);
      const [refreshing, setRefreshing] = useState(false);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            // Obtener etiquetas del usuario
            const etiquetasResponse = await axios.get(`${API_BASE_URL}/api/EtiquetasPersonalizadas`, {
            headers: { Authorization: `Bearer ${token}` }
            });
            
            setEtiquetas(etiquetasResponse.data);
            
            // Obtener gastos para cada etiqueta
            const gastosData: Record<number, Gasto[]> = {};
            
            await Promise.all(
            etiquetasResponse.data.map(async (etiqueta: EtiquetaPersonalizada) => {
                try {
                const response = await axios.get(`${API_BASE_URL}/api/Gastos/por-etiqueta/${etiqueta.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                gastosData[etiqueta.id] = response.data;
                } catch (error) {
                console.error(`Error cargando gastos para etiqueta ${etiqueta.id}:`, error);
                gastosData[etiqueta.id] = [];
                }
            })
            );
            
            setGastosPorEtiqueta(gastosData);
        } catch (error) {
            console.error('Error cargando datos:', error);
            Alert.alert('Error', 'No se pudieron cargar las etiquetas y gastos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => {
        if (token) cargarDatos();
    }, [token]);

  const toggleExpandEtiqueta = (id: number) => {
    setExpandedEtiqueta(expandedEtiqueta === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const handleDeleteEtiqueta = async (id: number) => {
    Alert.alert(
      'Eliminar etiqueta',
      '¿Estás seguro de que quieres eliminar esta etiqueta? Esta acción no se puede deshacer.',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel' 
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(`${API_BASE_URL}/api/EtiquetasPersonalizadas/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (response.status === 204) {
                // Actualizar la lista de etiquetas después de borrar
                setEtiquetas(prev => prev.filter(e => e.id !== id));
                setGastosPorEtiqueta(prev => {
                  const newGastos = {...prev};
                  delete newGastos[id];
                  return newGastos;
                });
                Alert.alert('Éxito', 'Etiqueta eliminada correctamente');
              }
            } catch (error) {
              console.error('Error eliminando etiqueta:', error);
              
              let errorMessage = 'No se pudo eliminar la etiqueta';
              if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                  errorMessage = 'La etiqueta no existe o ya fue eliminada';
                } else if (error.response?.data?.message) {
                  errorMessage = error.response.data.message;
                }
              }
              
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const renderGastoItem = ({ item }: { item: Gasto }) => (
    <View style={styles.gastoItem}>
      <View style={styles.gastoInfo}>
        <Text style={styles.gastoDescripcion}>{item.descripcion}</Text>
        <Text style={styles.gastoFecha}>{formatDate(item.fecha)}</Text>
      </View>
      <Text style={styles.gastoCantidad}>{item.cantidad.toFixed(2)}€</Text>
    </View>
  );

  const renderEtiqueta = ({ item }: { item: EtiquetaPersonalizada }) => (
    <View style={styles.etiquetaContainer}>
      <TouchableOpacity 
        style={[styles.etiquetaHeader, { backgroundColor: item.color }]}
        onPress={() => toggleExpandEtiqueta(item.id)}
      >
        <Text style={styles.etiquetaNombre}>{item.nombre}</Text>
        <View style={styles.etiquetaHeaderRight}>
          <Text style={styles.etiquetaCantidad}>
            {gastosPorEtiqueta[item.id]?.length || 0} gastos
          </Text>
          <Icon 
            name={expandedEtiqueta === item.id ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="white" 
          />
        </View>
      </TouchableOpacity>
      
      {expandedEtiqueta === item.id && (
        <View style={styles.gastosContainer}>
          <View style={styles.etiquetaActions}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteEtiqueta(item.id)}
            >
              <Icon name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Eliminar etiqueta</Text>
            </TouchableOpacity>
          </View>
          
          {gastosPorEtiqueta[item.id]?.length > 0 ? (
            <FlatList
              data={gastosPorEtiqueta[item.id]}
              renderItem={renderGastoItem}
              keyExtractor={(gasto) => gasto.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.sinGastosText}>No hay gastos con esta etiqueta</Text>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando etiquetas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    {/* Cabecera */}
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="arrow-back" size={24} color="#2563eb" />
      </TouchableOpacity>
      <Text style={styles.title}>Mis Etiquetas</Text>
      <View style={styles.headerRightPlaceholder} />
    </View>
    
    {/* Contenido principal */}
    <ScrollView contentContainerStyle={styles.scrollContainer} refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }>
      {etiquetas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="pricetags-outline" size={50} color="#94a3b8" />
          <Text style={styles.emptyText}>No tienes etiquetas creadas</Text>
        </View>
      ) : (
        <FlatList
          data={etiquetas}
          renderItem={renderEtiqueta}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ScrollView>

    {/* Botón flotante para crear etiquetas */}
    <TouchableOpacity
      style={styles.fab}
      onPress={() => navigation.navigate('CrearEtiquetaScreen')}
    >
      <Icon name="add" size={28} color="white" />
    </TouchableOpacity>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
    marginBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginVertical: 16,
    textAlign: 'center',
  },
  crearEtiquetaButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  crearEtiquetaText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  etiquetaContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  etiquetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  etiquetaNombre: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  etiquetaHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etiquetaCantidad: {
    color: 'white',
    marginRight: 12,
  },
  gastosContainer: {
    padding: 8,
  },
  gastoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  gastoInfo: {
    flex: 1,
  },
  gastoDescripcion: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
  },
  gastoFecha: {
    fontSize: 12,
    color: '#64748b',
  },
  gastoCantidad: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sinGastosText: {
    textAlign: 'center',
    padding: 16,
    color: '#64748b',
    fontStyle: 'italic',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      marginBottom: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1, // Para que no interfiera con los toques
    },
    headerRightPlaceholder: {
        width: 80, // Para balancear el diseño
    },
    fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  etiquetaActions: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  paddingVertical: 8,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#f1f5f9',
},
deleteButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 8,
  borderRadius: 6,
  backgroundColor: '#fee2e2',
},
deleteButtonText: {
  marginLeft: 6,
  color: '#ef4444',
  fontWeight: '500',
},
});

export default EtiquetasScreen;
