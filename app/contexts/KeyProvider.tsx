'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { bytesToHex, hexToBytes } from 'nostr-tools/utils';
import { decode } from 'nostr-tools/nip19';
import localforage from 'localforage';

interface KeyContextType {
  secretKey: Uint8Array | null;
  publicKey: string | null;
  setCustomKey: (key: string) => Promise<void>;
  generateNewKey: () => Promise<void>;
  error: string | null;
  isInitialized: boolean;
}

const KeyContext = createContext<KeyContextType | undefined>(undefined);

export function KeyProvider({ children }: { children: ReactNode }) {
  const [secretKey, setLocalSecretKey] = useState<Uint8Array | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize secret key from localForage
  useEffect(() => {
    const initializeKey = async () => {
      const storedKey = await localforage.getItem('secretKey') as Uint8Array;

      if (storedKey) {
        setSecretKey(storedKey);
        setPublicKey(getPublicKey(storedKey));
      } else {
        // Generate new key if none exists
        const sk = generateSecretKey();
        await localforage.setItem('secretKey', bytesToHex(sk));
        setSecretKey(sk);
        setPublicKey(getPublicKey(sk));
      }
      setIsInitialized(true);
    };
    
    initializeKey();
  }, []);

  const generateNewKey = async () => {
    const newKey = generateSecretKey();
    const newPubKey = getPublicKey(newKey);
    
    await localforage.setItem('secretKey', bytesToHex(newKey));
    setSecretKey(newKey);
    setPublicKey(newPubKey);
    setError(null);
  };

  const setSecretKey = async (key: Uint8Array) => {
    await localforage.setItem('secretKey', key);
    setLocalSecretKey(key);
    setPublicKey(getPublicKey(key));
  };

  const setCustomKey = async (key: string) => {
    setError(null);
    
    try {
      const decoded = decode(key);
      if (decoded.type !== 'nsec') {
        setError('Invalid secret key format. Please enter a valid nsec key.');
        return;
      }

      const keyBytes = new Uint8Array(decoded.data);
      await setSecretKey(keyBytes);
    } catch (err) {
      setError('Failed to set custom key. Please try again.');
      console.error('Error setting custom key:', err);
    }
  };

  return (
    <KeyContext.Provider value={{
      secretKey,
      publicKey,
      setCustomKey,
      generateNewKey,
      error,
      isInitialized
    }}>
      {children}
    </KeyContext.Provider>
  );
}

export function useKey() {
  const context = useContext(KeyContext);
  if (context === undefined) {
    throw new Error('useKey must be used within a KeyProvider');
  }
  return context;
} 