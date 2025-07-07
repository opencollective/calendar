import { NextResponse } from 'next/server';
import { SimplePool, finalizeEvent, generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { getCommunityATag } from '@/lib/nip-72';
import { createCalendarEventTemplate, type ICSEvent } from '@/lib/nip-52';
import { fetchAndParseICSEvents } from '@/lib/ics-utils';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;
const ics_url = process.env.ICS_URL;
const event_publishing_nsec = process.env.EVENT_PUBLISHING_NSEC;
const relays = ['wss://relay.chorus.community'];

async function fetchAndProcessICSEvents() {
  if (!ics_url) {
    console.log('No ICS URL configured, skipping ICS sync');
    return [];
  }

  return await fetchAndParseICSEvents(ics_url);
}

async function createNostrEvent(icsEvent: ICSEvent, secretKey: Uint8Array) {
  const community_a_tag = getCommunityATag(community_id!, community_identifier!);
  const eventTemplate = createCalendarEventTemplate(icsEvent, community_a_tag);
  return finalizeEvent(eventTemplate, secretKey);
}

export async function GET() {
  if (!community_id || !community_identifier) {
    return NextResponse.json(
      { error: 'Community ID or identifier not found in environment variables' },
      { status: 500 }
    );
  }

  if (!event_publishing_nsec) {
    return NextResponse.json(
      { error: 'EVENT_PUBLISHING_NSEC not found in environment variables' },
      { status: 500 }
    );
  }

  const pool = new SimplePool();
  const community_a_tag = getCommunityATag(community_id, community_identifier);

  try {
    // Fetch and process ICS events
    const icsEvents = await fetchAndProcessICSEvents();
    let icsEventsCreated = 0;

    if (icsEvents.length > 0) {
      // Convert nsec to secret key
      let secretKey: Uint8Array;
      try {
        const decoded = nip19.decode(event_publishing_nsec);
        if (decoded.type !== 'nsec') {
          throw new Error('Invalid nsec format');
        }
        secretKey = decoded.data;
      } catch (error) {
        console.error('Error decoding nsec:', error);
        return NextResponse.json(
          { error: 'Invalid EVENT_PUBLISHING_NSEC format' },
          { status: 500 }
        );
      }

      console.log(`Processing ${icsEvents.length} ICS events`);

      // Query all existing events from the pool at once (both date-based and time-based)
      console.log('Querying existing events from Nostr...');
      const existingEvents = await pool.querySync(
        relays,
        {
          kinds: [31922, 31923], // Query both date-based and time-based calendar events
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
            console.log(`Created Nostr event for: ${icsEvent.summary} (${icsEvent.isAllDay ? 'all-day' : 'time-based'})`);
          } else {
            console.log(`Event already exists: ${icsEvent.summary}`);
          }
        } catch (error) {
          console.error(`Error creating event for ${icsEvent.summary}:`, error);
        }
      }
    }

    console.log(`Synced ${icsEventsCreated} new events from ICS`);
    return NextResponse.json({
      success: true,
      icsEventsCreated: icsEventsCreated,
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
