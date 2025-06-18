'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bytesToHex } from 'nostr-tools/utils';
import { useKey } from '../contexts/KeyProvider';

interface LastSyncInfo {
  lastSyncTime: number;
  lastSyncDate: string | null;
  icsUrl?: string | null;
}

export default function Settings() {
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [lastSyncInfo, setLastSyncInfo] = useState<LastSyncInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { secretKey, publicKey, setCustomKey: setKey, generateNewKey, error } = useKey();

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/events/sync');
      const data = await response.json();
      setLastSyncInfo(data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };


  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await fetchSyncStatus();
      } else {
        console.error('Failed to trigger manual sync');
      }
    } catch (error) {
      console.error('Error triggering manual sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await setKey(customKey);
    setCustomKey('');
  };

  const obfuscateKey = (key: string) => {
    if (!key) return 'No secret key generated';
    return '*'.repeat(64);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Event Sync Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Event Sync</h2>
          
          <div className="mb-4 space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
              <span className="text-sm font-medium">
                Status: Cron Job Active (every 5 minutes)
              </span>
            </div>
            
            {lastSyncInfo && lastSyncInfo.lastSyncDate && (
              <div className="text-sm text-gray-600">
                Last Sync: {new Date(lastSyncInfo.lastSyncDate).toLocaleString()}
              </div>
            )}

            {lastSyncInfo && lastSyncInfo.icsUrl && (
              <div className="text-sm text-gray-600">
                ICS Feed: <span className="font-mono text-xs break-all">{lastSyncInfo.icsUrl}</span>
              </div>
            )}

            {lastSyncInfo && !lastSyncInfo.icsUrl && (
              <div className="text-sm text-gray-500">
                ICS Feed: Not configured
              </div>
            )}
          </div>

          <button
            onClick={handleManualSync}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Nostr Keys Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Nostr Keys</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Key
            </label>
            <div className="p-2 bg-gray-100 rounded font-mono text-sm break-all">
              {publicKey || 'No public key generated'}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Secret Key
              </label>
              <button
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                {showSecretKey ? 'Hide' : 'Show'} Secret Key
              </button>
            </div>
            <div className="p-2 bg-gray-100 rounded font-mono text-sm break-all">
              {showSecretKey && secretKey ? bytesToHex(secretKey) : obfuscateKey(bytesToHex(secretKey || new Uint8Array()))}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={generateNewKey}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Generate New Key Pair
            </button>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Set Custom Secret Key</h3>
              <form onSubmit={handleCustomKeySubmit} className="space-y-4">
                <div>
                  <label htmlFor="customKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your nsec key
                  </label>
                  <input
                    id="customKey"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full p-2 border rounded font-mono text-sm"
                    placeholder="Enter your nsec key"
                    autoComplete="off"
                    type="password"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Set Custom Key
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 