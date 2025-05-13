import React, {useEffect} from 'react'
import { Text, View, StyleSheet } from "react-native";
import globalStyles from "../styles";
import { Picker } from "@react-native-picker/picker";
import { Gastos } from '../types';
import { initialGastoState } from '../types';

interface Filtro {
    filtro: string;
    setFiltro : (setFiltro: string) => void;
    gastos :Gastos[];
    setGastosFiltrados:React.Dispatch<React.SetStateAction<Gastos[]>>;
}

const Filtro = ({setFiltro,filtro, gastos, setGastosFiltrados}:Filtro) => {
    // Cada vez que cambia el filtro se ejecuta
    useEffect(() => {
        // Si el filtro está vacio el array de gastos también
        if (filtro === '') {
            setGastosFiltrados([])
        } else {
            // Si el filtro no está vacío, llenamos gastosFiltrados con los gastos de la categoría que coincide con la categoría del gasto
            const gastosFiltrados = gastos.filter(gasto => gasto.categoria === filtro)

            setGastosFiltrados(gastosFiltrados)
        }
    }, [filtro])

  return (
    <View style={styles.contenedor}>
        <Text style={styles.label}>Filtrar Gastos</Text>
        <Picker selectedValue={filtro} onValueChange={(valor) => setFiltro(valor)} >
            <Picker.Item label='-- Mostrar Todos --' value=""/>
            <Picker.Item label='Comida' value="comida"/>
            <Picker.Item label='Ahorro' value="ahorro"/>
            <Picker.Item label='Suscripciones' value="suscripciones"/>
            <Picker.Item label='Ocio' value="ocio"/>
            <Picker.Item label='Salud' value="salud"/>
            <Picker.Item label='Gastos Varios' value="gastos"/>
        </Picker>
    </View>
  )
}

const styles = StyleSheet.create({
    contenedor: {
        ...globalStyles.contenedor,
        transform: [{translateY: 0}],
        marginTop: 80
    },
    label:{
        fontSize: 22,
        fontWeight: '900',
        color: "#64748b"
    }
})

export default Filtro