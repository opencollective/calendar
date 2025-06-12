'use client';

import { useEffect, useState, useRef } from 'react';
import {
  SimplePool,
  type EventTemplate,
  finalizeEvent,
  VerifiedEvent,
  verifyEvent,
  type NostrEvent,
} from "nostr-tools";
import Link from 'next/link';

import { CalendarTemplateEvent } from '@/lib/nip-52';
import { EventCard } from './components/EventCard';
import { getCommunityATag } from '@/lib/nip-72';
import { useKey } from './contexts/KeyProvider';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;


export type ApprovedEvent = NostrEvent & {
  approved: boolean;
};

export default function Home() {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [communityInfo, setCommunityInfo] = useState<NostrEvent | null>(null);
  const [moderators, setModerators] = useState<string[]>([]);
  const poolRef = useRef(new SimplePool());
  const relays = ['wss://relay.chorus.community'];
  const { publicKey } = useKey();
  
  useEffect(() => {
    if (!community_id || !community_identifier) {
      console.error('Community ID or identifier not found in environment variables');
      return;
    }
    const community_a_tag = getCommunityATag(community_id, community_identifier);
    const asyncFetchEvents = async () => {
      if (!publicKey) {
        return;
      }

      // Fetch community info
      const communityEvents = await poolRef.current.querySync(
        relays,
        {
          kinds: [34550],
          authors: [community_id],
          '#d': [community_identifier],
        },
      );
      const community = communityEvents?.[0];
      setCommunityInfo(community);

      // Fetch community events
      const events = await poolRef.current.querySync(
        relays,
        {
          kinds: [11, 1, 31922],
          limit: 20,
          '#a': [community_a_tag],
        },
      );

      // Get approval events from moderators
      const approvalEvents = await poolRef.current.querySync(
        relays,
        {
          kinds: [4550],
          '#a': [community_a_tag],
        },
      );
      const mods = community?.tags.filter(tag => tag[0] === 'p' && tag[3] === 'moderator').map(tag => tag[1]);
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
    }
    asyncFetchEvents();
  }, [publicKey]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-700 font-semibold">Community ID: <span className="font-mono">{community_id}</span></div>
          <div className="text-sm text-gray-700 font-semibold">Community Identifier: <span className="font-mono">{community_identifier}</span></div>
          {communityInfo && (
            <>
              <div className="text-sm text-gray-700 font-semibold mt-2">Community Name: <span className="font-mono">{communityInfo.tags.find(tag => tag[0] === 'name')?.[1]}</span></div>
              <div className="text-sm text-gray-700 font-semibold">Description: <span className="font-mono">{communityInfo.content}</span></div>
              <div className="text-sm text-gray-700 font-semibold mt-2">
                Moderators:
                <div className="mt-1 space-y-1">
                  {moderators
                    .map((moderator, index) => (
                      <div key={index} className="ml-4">
                        <span className="font-mono">{moderator}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
          {communityInfo && (
            <div className="text-sm text-gray-700 font-semibold mt-2">
              Raw Tags:
              <pre className="mt-1 p-2 bg-gray-200 rounded overflow-x-auto">
                {JSON.stringify(communityInfo.tags, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold mb-4">Nostr Events</h1>
        
        <div className="flex gap-4 mb-4">
          <Link
            href="/create"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create New Event
          </Link>

          <Link
            href="/settings"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Settings
          </Link>

          {communityInfo && publicKey && communityInfo.tags.some(tag => 
            tag[0] === 'p' && 
            tag[1] === publicKey && 
            tag[3] === 'moderator'
          ) && (
            <Link
              href="/moderation"
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Moderate Events
            </Link>
          )}

          <a
            href="/api/calendar"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Download Community Calendar
          </a>
        </div>

        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
} 