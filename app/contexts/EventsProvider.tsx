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
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refreshEvents: () => Promise<void>;
  loadMoreEvents: () => Promise<void>;
  createEvent: (calendarEvent: CalendarEvent) => Promise<boolean>;
  updateEvent: (updatedEvent: CalendarEvent) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  isInitialized: boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [communityInfo, setCommunityInfo] = useState<NostrEvent | null>(null);
  const [moderators, setModerators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<number | null>(null);
  const [loadedEventIds, setLoadedEventIds] = useState<Set<string>>(new Set());
  const poolRef = useState(new SimplePool())[0];
  const { publicKey, secretKey, isInitialized: keyInitialized } = useKey();

  const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
  const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;
  const relays = ['wss://relay.chorus.community'];
  const EVENTS_PER_PAGE = 20;

  // Helper function to deduplicate events
  const deduplicateEvents = (newEvents: ApprovedEvent[], existingIds: Set<string>): ApprovedEvent[] => {
    return newEvents.filter(event => {
      if (existingIds.has(event.id)) {
        return false;
      }
      existingIds.add(event.id);
      return true;
    });
  };

  const fetchEvents = async (isInitialLoad = true) => {
    if (!community_id || !community_identifier) {
      setError('Community ID or identifier not found in environment variables');
      setIsInitialized(true);
      return;
    }

    if (!publicKey) {
      setIsInitialized(true);
      return;
    }

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const community_a_tag = getCommunityATag(community_id, community_identifier);

      // Fetch community info (only on initial load)
      if (isInitialLoad) {
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

        // Fetch initial community events
        const events = await poolRef.querySync(
          relays,
          {
            kinds: [31922, 31923], // Query both date-based and time-based calendar events
            limit: EVENTS_PER_PAGE,
            '#a': [community_a_tag],
          },
        );

        if (events && events.length > 0) {
          const processedEvents = events.map(event => ({
            ...event,
            approved: approvedEventIds.has(event.id)
          }));
          
          // Deduplicate events
          const uniqueEvents = deduplicateEvents(processedEvents, new Set());
          setEvents(uniqueEvents);
          setLoadedEventIds(new Set(uniqueEvents.map(event => event.id)));
          setLastEventTimestamp(events[events.length - 1].created_at);
          setHasMore(events.length === EVENTS_PER_PAGE);
        } else {
          setEvents([]);
          setLoadedEventIds(new Set());
          setHasMore(false);
        }
      } else {
        // Load more events for pagination
        if (!lastEventTimestamp) {
          setHasMore(false);
          return;
        }

        const moreEvents = await poolRef.querySync(
          relays,
          {
            kinds: [31922, 31923],
            limit: EVENTS_PER_PAGE,
            until: lastEventTimestamp,
            '#a': [community_a_tag],
          },
        );

        if (moreEvents && moreEvents.length > 0) {
          // Get approval events for new events
          const approvalEvents = await poolRef.querySync(
            relays,
            {
              kinds: [4550],
              '#a': [community_a_tag],
            },
          );

          const mods = communityInfo?.tags
            .filter(tag => tag[0] === 'p' && tag[3] === 'moderator')
            .map(tag => tag[1]) || [];

          const approvedEventIds = new Set(
            approvalEvents
              .filter(event => mods?.includes(event.pubkey))
              .map(event => event.tags.find(tag => tag[0] === 'e')?.[1])
          );

          const processedEvents = moreEvents.map(event => ({
            ...event,
            approved: approvedEventIds.has(event.id)
          }));

          // Deduplicate new events against existing ones
          const uniqueNewEvents = deduplicateEvents(processedEvents, loadedEventIds);
          
          setEvents(prev => [...prev, ...uniqueNewEvents]);
          setLastEventTimestamp(moreEvents[moreEvents.length - 1].created_at);
          setHasMore(moreEvents.length === EVENTS_PER_PAGE);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
        setIsInitialized(true);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const loadMoreEvents = async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchEvents(false);
  };

  const refreshEvents = async () => {
    setLoadedEventIds(new Set());
    await fetchEvents(true);
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

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      if (!secretKey || !publicKey) {
        console.error('No secret key available');
        return false;
      }

      // Create NIP-09 deletion event (kind 5)
      const deletionEvent = {
        kind: 5,
        pubkey: publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['e', eventId]], // Event ID to be deleted
        content: '',
      };

      let event = finalizeEvent(deletionEvent, secretKey);
      
      let isGood = verifyEvent(event);
      console.log('Deleting event:', event);
      
      if (isGood) {
        await Promise.all(poolRef.publish(relays, event));
        
        // Wait a moment for the event to be published
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh events to reflect the deletion
        await fetchEvents();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting event:', error);
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
      isLoadingMore,
      error,
      hasMore,
      refreshEvents,
      loadMoreEvents,
      createEvent,
      updateEvent,
      deleteEvent,
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