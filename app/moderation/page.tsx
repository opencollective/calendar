'use client';

import { useEffect, useState, useRef } from 'react';
import {
  SimplePool,
  type NostrEvent,
  finalizeEvent,
} from "nostr-tools";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getCommunityATag } from '@/lib/nip-72';
import { useKey } from '../contexts/KeyProvider';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;

export default function ModerationPage() {
  const [pendingEvents, setPendingEvents] = useState<NostrEvent[]>([]);
  const [communityInfo, setCommunityInfo] = useState<NostrEvent | null>(null);
  const poolRef = useRef(new SimplePool());
  const router = useRouter();
  const relays = ['wss://relay.chorus.community'];
  const { publicKey, secretKey } = useKey();

  useEffect(() => {
    if (!community_id || !community_identifier || !publicKey) {
      console.error('Missing required information');
      return;
    }

    const asyncFetchData = async () => {
      // Fetch community info to verify moderator status
      const communityEvents = await poolRef.current.querySync(
        relays,
        {
          kinds: [34550],
          authors: [community_id],
          '#d': [community_identifier],
        },
      );

      if (communityEvents.length === 0) {
        console.error('Community not found');
        return;
      }

      const community = communityEvents[0];
      const isModerator = community.tags.some(tag => 
        tag[0] === 'p' && 
        tag[1] === publicKey && 
        tag[3] === 'moderator'
      );

      if (!isModerator) {
        console.error('Not authorized as moderator');
        router.push('/');
        return;
      }

      setCommunityInfo(community);

      // Fetch pending events
      const community_a_tag = getCommunityATag(community_id, community_identifier);
      const events = await poolRef.current.querySync(
        relays,
        {
          kinds: [31922], // Calendar events
          '#a': [community_a_tag],
        },
      );

      if (events) {
        setPendingEvents(events);
      }
    };

    asyncFetchData();
  }, [publicKey]);

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
      // Remove the approved event from the list
      console.log('approvalEvent', approvalEvent);
      setPendingEvents(prev => prev.filter(e => e.id !== event.id));
    } catch (error) {
      console.error('Error publishing approval:', error);
    }
  };

  const handleReject = async (event: NostrEvent) => {
    if (!publicKey || !secretKey) return;

    // Create rejection event
    const rejectionEvent = finalizeEvent({
      kind: 1,
      tags: [
        ['a', getCommunityATag(community_id!, community_identifier!)],
        ['e', event.id],
      ],
      content: 'Rejected',
      created_at: Math.floor(Date.now() / 1000),
    }, secretKey);

    try {
      await poolRef.current.publish(relays, rejectionEvent);
      // Remove the rejected event from the list
      setPendingEvents(prev => prev.filter(e => e.id !== event.id));
    } catch (error) {
      console.error('Error publishing rejection:', error);
    }
  };

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
          {pendingEvents.map((event) => {
            const title = event.tags.find(tag => tag[0] === 'title')?.[1] || 'Untitled Event';
            const start = event.tags.find(tag => tag[0] === 'start')?.[1];
            const end = event.tags.find(tag => tag[0] === 'end')?.[1];
            const location = event.tags.find(tag => tag[0] === 'location')?.[1];

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
                    <button
                      onClick={() => handleReject(event)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Reject
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