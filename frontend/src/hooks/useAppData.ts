import { useContext } from 'react';
import { AppDataContext, type AppDataContextValue } from '@/context/AppDataContextObject';

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
}
