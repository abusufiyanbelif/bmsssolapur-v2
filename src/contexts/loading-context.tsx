
"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface LoadingContextType {
  isDataLoading: boolean;
  setIsDataLoading: (isLoading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isDataLoading, setIsDataLoading] = useState(true);

  const value = useMemo(() => ({
    isDataLoading,
    setIsDataLoading,
  }), [isDataLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
