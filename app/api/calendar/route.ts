import { NextResponse } from 'next/server';
import { SimplePool } from 'nostr-tools';
import { generateIcsCalendar, type IcsCalendar } from 'ts-ics';
import { getCommunityATag } from '@/lib/nip-72';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;
const relays = ['wss://relay.chorus.community'];

export async function GET() {
  if (!community_id || !community_identifier) {
    return NextResponse.json(
      { error: 'Community ID or identifier not found in environment variables' },
      { status: 500 }
    );
  }

  const pool = new SimplePool();
  const community_a_tag = getCommunityATag(community_id, community_identifier);

  try {
    // Fetch community info to get moderators
    const communityEvents = await pool.querySync(
      relays,
      {
        kinds: [34550],
        authors: [community_id],
        '#d': [community_identifier],
      }
    );

    const community = communityEvents[0];
    const moderators = community?.tags
      .filter(tag => tag[0] === 'p' && tag[3] === 'moderator')
      .map(tag => tag[1]) || [];

    // Fetch approval events
    const approvalEvents = await pool.querySync(
      relays,
      {
        kinds: [4550],
        '#a': [community_a_tag],
      }
    );

    // Build set of approved event IDs
    const approvedEventIds = new Set(
      approvalEvents
        .filter(event => moderators.includes(event.pubkey))
        .map(event => event.tags.find(tag => tag[0] === 'e')?.[1])
    );

    // Fetch calendar events
    const events = await pool.querySync(
      relays,
      {
        kinds: [31922], // Calendar events
        '#a': [community_a_tag],
      }
    );

    // Filter only approved events
    const approvedEvents = events.filter(event => approvedEventIds.has(event.id));

    const calendar: IcsCalendar = {
      version: '2.0',
      prodId: '-//Nostr Events//EN',
      events: approvedEvents.map(event => {
        const title = event.tags.find(tag => tag[0] === 'title')?.[1] || 'Untitled Event';
        const start = event.tags.find(tag => tag[0] === 'start')?.[1];
        const end = event.tags.find(tag => tag[0] === 'end')?.[1];
        const location = event.tags.find(tag => tag[0] === 'location')?.[1];

        if (!start || !end) {
          throw new Error(`Invalid event dates for event ${event.id}`);
        }

        return {
          start: {
            date: new Date(start),
          },
          end: {
            date: new Date(end),
          },
          summary: title,
          uid: event.id,
          stamp: {
            date: new Date(event.created_at * 1000),
          },
          description: event.content,
          location: location,
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/events/${event.id}`,
        };
      }),
    };

    const icsString = generateIcsCalendar(calendar);
    
    return new NextResponse(icsString, {
      headers: {
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': 'attachment; filename="community-events.ics"',
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    );
  } finally {
    pool.close(relays);
  }
} 