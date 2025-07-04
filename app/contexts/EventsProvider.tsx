'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SimplePool, type NostrEvent, finalizeEvent, verifyEvent } from "nostr-tools";
import { useKey } from './KeyProvider';
import { getCommunityATag } from '@/lib/nip-72';
import { CalendarEvent } from '@/lib/nip-52';

export type ApprovedEvent = NostrEvent & {
  approved: boolean;
};

interface EventsContextType {
  events: ApprovedEvent[];
  communityInfo: NostrEvent | null;
  moderators: string[];
  isLoading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  createEvent: (calendarEvent: CalendarEvent) => Promise<boolean>;
  updateEvent: (updatedEvent: CalendarEvent) => Promise<boolean>;
  isInitialized: boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [communityInfo, setCommunityInfo] = useState<NostrEvent | null>(null);
  const [moderators, setModerators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const poolRef = useState(new SimplePool())[0];
  const { publicKey, secretKey, isInitialized: keyInitialized } = useKey();

  const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
  const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;
  const relays = ['wss://relay.chorus.community'];

  const fetchEvents = async () => {
    if (!community_id || !community_identifier) {
      setError('Community ID or identifier not found in environment variables');
      setIsInitialized(true);
      return;
    }

    if (!publicKey) {
      setIsInitialized(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const community_a_tag = getCommunityATag(community_id, community_identifier);

      // Fetch community info
      const communityEvents = await poolRef.querySync(
        relays,
        {
          kinds: [34550],
          authors: [community_id],
          '#d': [community_identifier],
        },
      );
      const community = communityEvents?.[0];
      setCommunityInfo(community);

      // Log community raw tags for debugging
      if (community) {
        console.log('Community raw tags:', JSON.stringify(community.tags, null, 2));
      }

      // Fetch community events
      const events = await poolRef.querySync(
        relays,
        {
          kinds: [11, 1, 31922, 31923], // Query both date-based and time-based calendar events
          limit: 20,
          '#a': [community_a_tag],
        },
      );

      // Get approval events from moderators
      const approvalEvents = await poolRef.querySync(
        relays,
        {
          kinds: [4550],
          '#a': [community_a_tag],
        },
      );

      const mods = community?.tags
        .filter(tag => tag[0] === 'p' && tag[3] === 'moderator')
        .map(tag => tag[1]);
      setModerators(mods || []);

      // Build set of approved event IDs
      const approvedEventIds = new Set(
        approvalEvents
          .filter(event => mods?.includes(event.pubkey))
          .map(event => event.tags.find(tag => tag[0] === 'e')?.[1])
      );

      if (events) {
        setEvents(events.map(event => ({
          ...event,
          approved: approvedEventIds.has(event.id)
        })));
      }
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const createEvent = async (calendarEvent: CalendarEvent): Promise<boolean> => {
    try {
      if (!secretKey || !publicKey) {
        console.error('No secret key available');
        return false;
      }

      let event = finalizeEvent(calendarEvent, secretKey);
      
      let isGood = verifyEvent(event);
      console.log('Creating event:', event);
      
      if (isGood) {
        await Promise.all(poolRef.publish(relays, event));
        
        // Wait a moment for the event to be published
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh events to include the newly created event
        await fetchEvents();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating event:', error);
      return false;
    }
  };

  const updateEvent = async (updatedEvent: CalendarEvent): Promise<boolean> => {
    try {
      if (!secretKey || !publicKey) {
        console.error('No secret key available');
        return false;
      }

      let event = finalizeEvent(updatedEvent, secretKey);
      
      let isGood = verifyEvent(event);
      console.log('Updating event:', event);
      
      if (isGood) {
        await Promise.all(poolRef.publish(relays, event));
        
        // Wait a moment for the event to be published
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh events to include the updated event
        await fetchEvents();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  };

  useEffect(() => {
    if (keyInitialized) {
      fetchEvents();
    }
  }, [publicKey, keyInitialized]);

  return (
    <EventsContext.Provider value={{
      events,
      communityInfo,
      moderators,
      isLoading,
      error,
      refreshEvents: fetchEvents,
      createEvent,
      updateEvent,
      isInitialized
    }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
} 