import { NextResponse } from 'next/server';
import { SimplePool, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import { getCommunityATag } from '@/lib/nip-72';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;
const ics_url = process.env.ICS_URL;
const relays = ['wss://relay.chorus.community'];

// In-memory storage for last sync time (in production, use a database)
let lastSyncTime = 0;

// Simple iCal parser function
function parseICS(icsContent: string) {
  const events: Array<{
    summary: string;
    description: string;
    start: string;
    end: string;
    location?: string;
    uid: string;
  }> = [];

  const lines = icsContent.split('\n');
  let currentEvent: any = {};
  let inEvent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.summary && currentEvent.start && currentEvent.end) {
        events.push(currentEvent);
      }
    } else if (inEvent && line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      switch (key) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
          break;
        case 'DTSTART':
          currentEvent.start = parseICSDate(value);
          break;
        case 'DTEND':
          currentEvent.end = parseICSDate(value);
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'UID':
          currentEvent.uid = value;
          break;
      }
    }
  }

  return events;
}

function parseICSDate(dateString: string): string {
  // Handle different iCal date formats
  if (dateString.includes('T')) {
    // Date-time format: 20231201T120000Z or 20231201T120000
    const date = dateString.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3');
    return date;
  } else {
    // Date-only format: 20231201
    const date = dateString.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    return date;
  }
}

async function fetchAndProcessICSEvents() {
  if (!ics_url) {
    console.log('No ICS URL configured, skipping ICS sync');
    return [];
  }

  try {
    console.log('Fetching ICS from:', ics_url);
    const response = await fetch(ics_url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ICS: ${response.status} ${response.statusText}`);
    }

    const icsContent = await response.text();
    const events = parseICS(icsContent);
    
    console.log(`Parsed ${events.length} events from ICS`);
    return events;
  } catch (error) {
    console.error('Error fetching ICS:', error);
    return [];
  }
}

async function createNostrEvent(icsEvent: any, secretKey: Uint8Array) {
  const community_a_tag = getCommunityATag(community_id!, community_identifier!);
  
  const nostrEvent = {
    kind: 31922,
    tags: [
      ['a', community_a_tag],
      ['d', icsEvent.uid || Math.random().toString(36).substring(7)],
      ['title', icsEvent.summary],
      ['start', icsEvent.start],
      ['end', icsEvent.end],
      ...(icsEvent.location ? [['location', icsEvent.location]] : []),
    ],
    content: icsEvent.description || '',
    created_at: Math.floor(Date.now() / 1000),
  };

  return finalizeEvent(nostrEvent, secretKey);
}

export async function POST() {
  if (!community_id || !community_identifier) {
    return NextResponse.json(
      { error: 'Community ID or identifier not found in environment variables' },
      { status: 500 }
    );
  }

  const pool = new SimplePool();
  const community_a_tag = getCommunityATag(community_id, community_identifier);

  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const since = lastSyncTime > 0 ? lastSyncTime : currentTime - 3600; // Default to 1 hour ago if first sync

    console.log(`Syncing events since ${new Date(since * 1000).toISOString()}`);

    // Fetch and process ICS events
    const icsEvents = await fetchAndProcessICSEvents();
    let icsEventsCreated = 0;

    if (icsEvents.length > 0) {
      // Generate a secret key for creating events (in production, use a proper key management system)
      const secretKey = generateSecretKey();

      console.log(`Processing ${icsEvents.length} ICS events`);

      // Query all existing events from the pool at once
      console.log('Querying existing events from Nostr...');
      const existingEvents = await pool.querySync(
        relays,
        {
          kinds: [31922],
          '#a': [community_a_tag],
        }
      );

      // Create a map of existing events using their 'd' tag as key
      const existingEventsMap = new Map<string, any>();
      for (const event of existingEvents) {
        const dTag = event.tags.find((tag: any) => tag[0] === 'd');
        if (dTag && dTag[1]) {
          existingEventsMap.set(dTag[1], event);
        }
      }

      console.log(`Found ${existingEvents.length} existing events in Nostr`);

      for (const icsEvent of icsEvents) {
        try {
          const eventUid = icsEvent.uid || Math.random().toString(36).substring(7);
          
          // Check if event already exists using the map
          if (!existingEventsMap.has(eventUid)) {
            // Create new Nostr event
            const nostrEvent = await createNostrEvent(icsEvent, secretKey);
            await Promise.all(pool.publish(relays, nostrEvent));
            icsEventsCreated++;
            console.log(`Created Nostr event for: ${icsEvent.summary}`);
          } else {
            console.log(`Event already exists: ${icsEvent.summary}`);
          }
        } catch (error) {
          console.error(`Error creating event for ${icsEvent.summary}:`, error);
        }
      }
    }

    // Update last sync time
    lastSyncTime = currentTime;

    console.log(`Synced ${icsEventsCreated} new events from ICS`);
    pool.close(relays);
    return NextResponse.json({
      success: true,
      icsEventsCreated: icsEventsCreated,
      lastSyncTime: currentTime,
      icsUrl: ics_url || null
    });

  } catch (error) {
    console.error('Error syncing events:', error);
    return NextResponse.json(
      { error: 'Failed to sync events' },
      { status: 500 }
    );
  } finally {
    pool.close(relays);
  }
}

export async function GET() {
  return NextResponse.json({
    lastSyncTime: lastSyncTime,
    lastSyncDate: lastSyncTime > 0 ? new Date(lastSyncTime * 1000).toISOString() : null,
    icsUrl: ics_url || null
  });
} 