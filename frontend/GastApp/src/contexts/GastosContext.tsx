import React, { createContext, useContext, useState } from 'react';
import { Gastos, initialGastoState } from '../types';

interface GastosContextType {
  gastos: Gastos[];
  setGastos: React.Dispatch<React.SetStateAction<Gastos[]>>;
  modal: boolean;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
  modificarGasto: Gastos;
  setModificarGasto: React.Dispatch<React.SetStateAction<Gastos>>;
}

const GastosContext = createContext<GastosContextType | undefined>(undefined);

export const GastosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gastos, setGastos] = useState<Gastos[]>([]);
  const [modal, setModal] = useState(false);
  const [modificarGasto, setModificarGasto] = useState<Gastos>(initialGastoState);

  return (
    <GastosContext.Provider
      value={{
        gastos,
        setGastos,
        modal,
        setModal,
        modificarGasto,
        setModificarGasto
      }}
    >
      {children}
    </GastosContext.Provider>
  );
};

export const useGastosContext = (): GastosContextType => {
  const context = useContext(GastosContext);
  if (!context) {
    throw new Error('useGastosContext debe usarse dentro de un GastosProvider');
  }
  return context;
};
