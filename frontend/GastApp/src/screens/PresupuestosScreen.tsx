import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Pressable,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

interface Presupuesto {
  id: number; // Cambiado de id_presupuesto a id
  categoriaId: number; // Cambiado de categoria_id a categoriaId
  categoriaNombre: string; // Cambiado de categoria_nombre a categoriaNombre
  cantidad: number;
  fechaInicio: string; // Cambiado de fecha_inicio a fechaInicio
  fechaFin: string; // Cambiado de fecha_fin a fechaFin
  gastado: number;
}

const PresupuestosScreen = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const { token } = useAuth();

    type NavigationProp = StackNavigationProp<RootStackParamList, 'Principal'>;
    const navigation = useNavigation<NavigationProp>();
  
    useEffect(() => {
    const fetchPresupuestos = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/presupuestos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const presupuestosConGastos = await Promise.all(
          res.data.map(async (presupuesto: any) => {
            const gastosRes = await axios.get(
              `${API_BASE_URL}/api/gastos/categoria/${presupuesto.categoriaId}`, // Cambiado a categoriaId
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const gastosEnRango = gastosRes.data.filter((g: any) => {
              const fecha = new Date(g.fecha);
              return (
                fecha >= new Date(presupuesto.fechaInicio) && // Cambiado a fechaInicio
                fecha <= new Date(presupuesto.fechaFin) // Cambiado a fechaFin
              );
            });

            const totalGastado = gastosEnRango.reduce(
              (sum: number, g: any) => sum + g.cantidad,
              0
            );

            return {
              id: presupuesto.id, // Cambiado a id
              categoriaId: presupuesto.categoriaId, // Cambiado a categoriaId
              categoriaNombre: presupuesto.categoriaNombre || 'Sin categoría', // Cambiado a categoriaNombre
              cantidad: presupuesto.cantidad,
              fechaInicio: presupuesto.fechaInicio, // Cambiado a fechaInicio
              fechaFin: presupuesto.fechaFin, // Cambiado a fechaFin
              gastado: totalGastado,
            };
          })
        );

        setPresupuestos(presupuestosConGastos);
      } catch (error) {
        console.error('Error obteniendo presupuestos:', error);
      }
    };

    fetchPresupuestos();
  }, [token]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mis Presupuestos</Text>

      {presupuestos.length === 0 && (
        <Text style={styles.noData}>No tienes presupuestos creados.</Text>
      )}

      {presupuestos.map((presupuesto) => {
        const porcentaje = Math.min(
          (presupuesto.gastado / presupuesto.cantidad) * 100,
          100
        ).toFixed(0);

        return (
          <View key={presupuesto.id} style={styles.card}>
            <Text style={styles.category}>
              {presupuesto.categoriaNombre}
            </Text>
            <Text style={styles.amounts}>
              {presupuesto.gastado} / {presupuesto.cantidad} €
            </Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: (Number(porcentaje) / 100) * 200 }, // 200 is the assumed width of the progress bar background, adjust as needed
                  +porcentaje >= 90 && { backgroundColor: '#dc2626' },
                ]}
              />
            </View>
            <Text style={styles.percentage}>{porcentaje}% gastado</Text>
          </View>
        );
      })}

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('AgregarPresupuestoScreen')}
      >
        <Text style={styles.buttonText}>Agregar Presupuesto</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f1f5f9',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 15,
  },
  noData: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 30,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  category: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  amounts: {
    marginBottom: 8,
    color: '#374151',
  },
  progressBarBackground: {
    backgroundColor: '#e5e7eb',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    width: 200,
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  percentage: {
    marginTop: 5,
    fontSize: 12,
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
});

export default PresupuestosScreen;
