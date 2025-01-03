'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  pubKeyHash: string | null;
  setPubKeyHash: (pubKeyHash: string | null) => void;
  userName: string | null;
  setUserName: (userName: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [pubKeyHash, setPubKeyHash] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedPubKeyHash = getCookie('pubKeyHash') as string;
    if (!storedPubKeyHash && pathname !== '/') {
      router.push('/?error=Please sign in first.');
    }

    setPubKeyHash(storedPubKeyHash);

    const storedUserName = getCookie('userName') as string;
    setUserName(storedUserName);
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ pubKeyHash, setPubKeyHash, userName, setUserName }}>
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
