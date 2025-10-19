import { createContext, useContext, useState, type ReactNode } from 'react';

interface GlobalSearchContextType {
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  return (
    <GlobalSearchContext.Provider value={{ globalSearchTerm, setGlobalSearchTerm }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (context === undefined) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return context;
}