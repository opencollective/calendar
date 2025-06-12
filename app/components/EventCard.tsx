import { type NostrEvent } from 'nostr-tools';
import { generateIcsCalendar, type IcsCalendar } from 'ts-ics';
import { ApprovedEvent } from '../page';

interface EventCardProps {
  event: ApprovedEvent;
}

export function EventCard({ event }: EventCardProps) {
  const isCalendarEvent = event.kind === 31922;

  const handleDownloadICS = () => {
    if (!isCalendarEvent) return;

    const title = event.tags.find((tag: string[]) => tag[0] === 'title')?.[1] || 'Untitled Event';
    const start = event.tags.find((tag: string[]) => tag[0] === 'start')?.[1];
    const end = event.tags.find((tag: string[]) => tag[0] === 'end')?.[1];
    const location = event.tags.find((tag: string[]) => tag[0] === 'location')?.[1];

    if (!start || !end) return;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const calendar: IcsCalendar = {
      version: '2.0',
      prodId: '-//Nostr Events//EN',
      events: [{
        start: {
          date: startDate,
        },
        end: {
          date: endDate,
        },
        summary: title,
        uid: event.id,
        stamp: {
          date: new Date(event.created_at * 1000),
        },
        description: event.content,
        location: location,
        url: window.location.href,
      }],
    };

    const icsString = generateIcsCalendar(calendar);
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCalendarEvent) {
    const title = event.tags.find((tag: string[]) => tag[0] === 'title')?.[1] || 'Untitled Event';
    const start = event.tags.find((tag: string[]) => tag[0] === 'start')?.[1];
    const end = event.tags.find((tag: string[]) => tag[0] === 'end')?.[1];
    const location = event.tags.find((tag: string[]) => tag[0] === 'location')?.[1];

    return (
      <div className="border p-4 rounded-lg bg-blue-50 relative">
        <div className="group relative">
          <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${event.approved ? 'bg-green-500' : 'bg-orange-500'}`} />
          <div className="absolute top-6 right-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {event.approved ? 'Approved' : 'Pending approval'}
          </div>
        </div>
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
        <button
          onClick={handleDownloadICS}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add to Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-lg relative">
      <div className="group relative">
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${event.approved ? 'bg-green-500' : 'bg-orange-500'}`} />
        <div className="absolute top-6 right-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {event.approved ? 'Approved' : 'Pending approval'}
        </div>
      </div>
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