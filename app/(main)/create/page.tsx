'use client';

import { useEffect, useState, useRef } from 'react';
import {
  SimplePool,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  verifyEvent,
  type NostrEvent,
} from "nostr-tools";
import { useRouter } from 'next/navigation';

import { CalendarTemplateEvent } from '@/lib/nip-52';
import { EventForm } from '../../components/EventForm';

export default function CreateEvent() {
  const [isConnected, setIsConnected] = useState(false);
  const [secretKey, setSecretKey] = useState<Uint8Array | null>(null);
  const [pubKey, setPubKey] = useState<string | null>(null);
  const poolRef = useRef(new SimplePool());
  const router = useRouter();
  const relays = ['wss://relay.chorus.community'];
  
  // Initialize secret key
  useEffect(() => {
    const sk = generateSecretKey();
    setSecretKey(sk);
    let pk = getPublicKey(sk) // `pk` is a hex string
    setPubKey(pk);
  }, []);
  
  const handleEventSubmit = async (calendarEvent: CalendarTemplateEvent) => {
    try {
      if (!secretKey || !pubKey) {
        console.error('No secret key available');
        return;
      }

      let event = finalizeEvent(calendarEvent, secretKey);
      
      let isGood = verifyEvent(event);
      console.log('event', event);
      if (isGood) {
        poolRef.current.publish(relays, event);
        // Navigate back to home page after successful submission
        router.push('/');
      }
    } catch (error) {
      console.error('Error publishing event:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Create New Event</h1>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Events
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected to Nostr Network' : 'Disconnected from Nostr Network'}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Event Details</h2>
              <p className="text-sm text-gray-500">
                Fill in the details below to create a new event. All fields marked with an asterisk (*) are required.
              </p>
            </div>

            <EventForm onSubmit={handleEventSubmit} />
          </div>
        </div>
      </div>
    </main>
  );
} 