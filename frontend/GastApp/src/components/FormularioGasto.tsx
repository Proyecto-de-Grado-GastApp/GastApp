import React from 'react'
import { Text, SafeAreaView, View, TextInput, StyleSheet, Pressable } from 'react-native'

const FormularioGasto = () => {
  return (
    <SafeAreaView>
        <View>
            <Text>
                Cancelar
            </Text>
        </View>

        <View>
            <Text>Nuevo Gasto</Text>
        </View>

        <View>
            <Text>Nombre</Text>
            <TextInput
                placeholder='Nombre del gasto. Ej: Comida '
            />
        </View>

        <View>
            <Text>Importe</Text>
            <TextInput
                placeholder='Importe del gasto. Ej: 30'
                keyboardType='numeric'
            />
        </View>
    </SafeAreaView>
  )
}

export default FormularioGasto