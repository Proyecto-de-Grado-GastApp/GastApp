// components/SubscriptionsList.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Gastos } from '../types';
import Gasto from './Gasto';

interface Props {
  gastos: Gastos[];
  setModal: (modal: boolean) => void;
  setModificarGasto: React.Dispatch<React.SetStateAction<Gastos>>;
}

const SubscriptionsList = ({ gastos, setModal, setModificarGasto }: Props) => {
  const suscripciones = gastos.filter(gasto => gasto.categoria === 'suscripciones');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Suscripciones</Text>

      {suscripciones.length > 0 ? (
        suscripciones.map(gasto => (
          <Gasto
            key={gasto.id}
            gasto={gasto}
            setModal={setModal}
            setModificarGasto={setModificarGasto}
          />
        ))
      ) : (
        <Text style={styles.empty}>No hay suscripciones</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2563eb',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    color: '#6b7280',
  },
});

export default SubscriptionsList;
