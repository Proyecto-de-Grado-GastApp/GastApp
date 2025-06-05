// hooks/useAutoRefresh.ts
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function useAutoRefresh(callback: () => void) {
  useFocusEffect(
    useCallback(() => {
      callback();
    }, [callback])
  );
}
