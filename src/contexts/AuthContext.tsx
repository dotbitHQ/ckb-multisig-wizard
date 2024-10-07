'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCookie } from 'cookies-next';

interface AuthContextType {
  pubKeyHash: string | null;
  setPubKeyHash: (pubKeyHash: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pubKeyHash, setPubKeyHash] = useState<string | null>(null);

  useEffect(() => {
    const storedPubKeyHash = getCookie('pubKeyHash') as string;
    if (storedPubKeyHash) {
        setPubKeyHash(storedPubKeyHash);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ pubKeyHash, setPubKeyHash }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
