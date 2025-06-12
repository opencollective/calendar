'use client';

import { useState } from 'react';
import Link from 'next/link';
import { bytesToHex } from 'nostr-tools/utils';
import { useKey } from '../contexts/KeyProvider';

export default function Settings() {
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const { secretKey, publicKey, setCustomKey: setKey, generateNewKey, error } = useKey();

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
                    type="text"
                    id="customKey"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full p-2 border rounded font-mono text-sm"
                    placeholder="Enter your nsec key"
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