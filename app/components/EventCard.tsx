import { type NostrEvent } from 'nostr-tools';

interface EventCardProps {
  event: NostrEvent;
}

export function EventCard({ event }: EventCardProps) {
  const isCalendarEvent = event.kind === 31922;

  if (isCalendarEvent) {
    const title = event.tags.find((tag: string[]) => tag[0] === 'title')?.[1] || 'Untitled Event';
    const start = event.tags.find((tag: string[]) => tag[0] === 'start')?.[1];
    const end = event.tags.find((tag: string[]) => tag[0] === 'end')?.[1];
    const location = event.tags.find((tag: string[]) => tag[0] === 'location')?.[1];

    return (
      <div className="border p-4 rounded-lg bg-blue-50">
        <div className="text-sm text-gray-500">
          {new Date(event.created_at * 1000).toLocaleString()}
        </div>
        <h3 className="text-lg font-semibold mt-2">{title}</h3>
        <div className="mt-2">{event.content}</div>
        <div className="mt-2 text-sm text-gray-500">
          <div>Start: {start}</div>
          <div>End: {end}</div>
          {location && <div>Location: {location}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-lg">
      <div className="text-sm text-gray-500">
        {new Date(event.created_at * 1000).toLocaleString()}
      </div>
      <div className="mt-2">{event.content}</div>
      <div className="mt-2 text-sm text-gray-500">
        Kind: {event.kind}
      </div>
    </div>
  );
} 