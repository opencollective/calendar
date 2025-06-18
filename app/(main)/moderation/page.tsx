'use client';

import { useMemo, useRef } from 'react';
import {
  SimplePool,
  type NostrEvent,
  finalizeEvent,
} from "nostr-tools";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getCommunityATag } from '@/lib/nip-72';
import { useKey } from '../../contexts/KeyProvider';
import { useEvents, type ApprovedEvent } from '../../contexts/EventsProvider';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;

export default function ModerationPage() {
  const poolRef = useRef(new SimplePool());
  const router = useRouter();
  const relays = ['wss://relay.chorus.community'];
  const { publicKey, secretKey } = useKey();
  const { events, communityInfo, refreshEvents } = useEvents();

  // Check if user is a moderator
  const isModerator = communityInfo?.tags.some(tag => 
    tag[0] === 'p' && 
    tag[1] === publicKey && 
    tag[3] === 'moderator'
  );

  if (!isModerator) {
    router.push('/');
    return null;
  }

  const handleApprove = async (event: NostrEvent) => {
    if (!publicKey || !secretKey) return;

    // Create approval event
    const approvalEvent = finalizeEvent({
      kind: 4550,
      tags: [
        ['a', getCommunityATag(community_id!, community_identifier!)],
        ['e', event.id],
        ['p', event.pubkey],
        ['k', event.kind.toString()],
      ],
      content: JSON.stringify(event),
      created_at: Math.floor(Date.now() / 1000),
    }, secretKey);

    try {
      poolRef.current.publish(relays, approvalEvent);
      // Refresh events to update the list
      await refreshEvents();
    } catch (error) {
      console.error('Error publishing approval:', error);
    }
  };
  const calendarEvents = useMemo(() => events.filter(event => event.kind === 31922 && event.approved === false), [events]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Event Moderation</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Back to Events
          </Link>
        </div>

        <div className="space-y-4">
          {calendarEvents.map((event: ApprovedEvent) => {
            const title = event.tags.find((tag: string[]) => tag[0] === 'title')?.[1] || 'Untitled Event';
            const start = event.tags.find((tag: string[]) => tag[0] === 'start')?.[1];
            const end = event.tags.find((tag: string[]) => tag[0] === 'end')?.[1];
            const location = event.tags.find((tag: string[]) => tag[0] === 'location')?.[1];

            return (
              <div key={event.id} className="border p-4 rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Start: {start}</div>
                      <div>End: {end}</div>
                      {location && <div>Location: {location}</div>}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <div>Author: {event.pubkey}</div>
                      <div>Created: {new Date(event.created_at * 1000).toLocaleString()}</div>
                    </div>
                    <div className="mt-2">{event.content}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(event)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
} 