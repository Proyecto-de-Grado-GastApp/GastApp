import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

const CustomInput = (props: TextInputProps) => {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor="#999"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  }
});

export default CustomInput;