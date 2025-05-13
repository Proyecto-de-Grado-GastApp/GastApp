import React from 'react'
import { Text, View, StyleSheet } from "react-native";
import { Gastos } from '../types';
import Gasto from "./Gasto";
import { initialGastoState } from '../types';

interface GastosGuardados {
    gastos :Gastos[],
    setModal : (modal:boolean) => void;
    setModificarGasto: React.Dispatch<React.SetStateAction<Gastos>>;
    filtro: string;
    gastosFiltrados: Gastos[]
}


const ListadoGastos = ({gastos, setModal, setModificarGasto,filtro,gastosFiltrados}: GastosGuardados) => {
  return (
    <View style={styles.contenedor}>
        <Text style={styles.titulo}>Gastos</Text>

        {/* Si se ha establecido un filtro, iteramos sobre los gastosFiltrados, si no mostramos todos los gastos */}
        { filtro ? gastosFiltrados.map(gasto => (<Gasto key={gasto.id || gasto.nombre} gasto={gasto} setModal={setModal} setModificarGasto={setModificarGasto} />)) : gastos.map(gasto => (<Gasto key={gasto.id || gasto.nombre} gasto={gasto} setModal={setModal} setModificarGasto={setModificarGasto} />)) }

        {/* Si la categoría del filtro no tiene gastos asociados */}
        { (gastos.length === 0 || (gastosFiltrados.length === 0 && !!filtro)) && (
            <Text style={styles.noGastos}>No hay gastos</Text>
        ) }

    </View>
  )
}

const styles = StyleSheet.create({
    contenedor: {
        marginTop: 30,
        marginBottom: 100
    },
    titulo:{
        color: "#64748b",
        fontSize: 30,
        textAlign: 'center',
        fontWeight: '700',
        marginTop: 10
    },
    noGastos:{
        marginTop: 20,
        textAlign: 'center',
        fontSize: 20
    }
})

export default ListadoGastos