import { createContext, useContext, ReactNode, useState } from 'react';

interface FiltersContextType {
  businessFilter: string;
  statusFilter: string;
  bankingUnitFilter: string;
  setBusinessFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setBankingUnitFilter: (value: string) => void;
  resetFilters: () => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

interface FiltersProviderProps {
  children: ReactNode;
}

export function FiltersProvider({ children }: FiltersProviderProps) {
  const [businessFilter, setBusinessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankingUnitFilter, setBankingUnitFilter] = useState("all");

  const resetFilters = () => {
    setBusinessFilter("all");
    setStatusFilter("all");
    setBankingUnitFilter("all");
  };

  return (
    <FiltersContext.Provider
      value={{
        businessFilter,
        statusFilter,
        bankingUnitFilter,
        setBusinessFilter,
        setStatusFilter,
        setBankingUnitFilter,
        resetFilters,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}