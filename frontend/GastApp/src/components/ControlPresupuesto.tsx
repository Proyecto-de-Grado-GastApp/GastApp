import React, {useState,useEffect} from 'react'
import { Text, View, Image, StyleSheet } from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";

import globalStyles from '../styles/index';
import { formatearCantidad } from '../functions';
import { Gastos } from '../types';

interface Presupuestos {
    presupuesto:number
    gastos :Gastos[]
}

const ControlPresupuesto = ({presupuesto, gastos}:Presupuestos,) => {

    const [disponible, setDisponible] = useState(0);
    const [gastado, setGastado] = useState(0);
    const [porcentaje, setPorcentaje] = useState(0)

    // Hacemos el calculo total de los gastos utilizando reduce, esta es su lógica:
    /* array.reduce((acumulador, elementoActual) => { lógica de acumulación }, valorInicial); */ 

    useEffect(() => {
        const totalGastado = gastos.reduce( (total, gasto) => total + gasto.cantidad,0)

        const totalDisponible = presupuesto - totalGastado;

        const nuevoPorcentaje = ((presupuesto - totalDisponible) / presupuesto ) * 100

        setTimeout(() => {
            setPorcentaje(nuevoPorcentaje);
        }, 1000);

        setGastado(totalGastado);
        setDisponible(totalDisponible);
        
    }, [gastos])
    
      
    

  return (
    <View style={styles.contenedor}>
        <View style={styles.centrarGrafica}>
            <CircularProgress
                value={porcentaje}
                duration={1500}
                radius={130}
                valueSuffix={'%'}
                title='Gastado'
                inActiveStrokeColor='#F5F5F5'
                inActiveStrokeWidth={15}
                activeStrokeColor='#3b82f6'
                activeStrokeWidth={15}
                titleStyle={{ fontWeight: 'bold', fontSize: 35}}
                titleColor='#64748b'
            />
        </View>

        <View style={styles.contenedorTexto}>
            <Text style={styles.valor}>
                <Text style={styles.label}>Disponible {''}</Text>
                {formatearCantidad(disponible)}
            </Text>

            <Text style={styles.valor}>
                <Text style={styles.label}>Presupuesto {''}</Text>
                {formatearCantidad(presupuesto)}
            </Text>

            <Text style={styles.valor}>
                <Text style={styles.label}>Gastado {''}</Text>
                {formatearCantidad(gastado)}
            </Text>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    contenedor:{
        ...globalStyles.contenedor
    },
    centrarGrafica:{
        alignItems: "center"
    },
    imagen:{
        width: 250,
        height: 250
    },
    contenedorTexto:{
        marginTop: 50,
        
    },
    valor:{
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 10
    },
    label:{
        fontWeight: '700',
        color: '#3b82f6'
    },
})

export default ControlPresupuesto