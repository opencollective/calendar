import { type NostrEvent } from 'nostr-tools';
import { generateIcsCalendar, type IcsCalendar } from 'ts-ics';
import { ApprovedEvent } from '../contexts/EventsProvider';

interface EmbedEventCardProps {
  event: ApprovedEvent;
}

export function EmbedEventCard({ event }: EmbedEventCardProps) {
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
      <div className="border border-gray-200 p-3 rounded-md bg-blue-50 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${event.approved ? 'bg-green-500' : 'bg-orange-500'}`} />
              <h3 className="text-base font-semibold">{title}</h3>
            </div>
            {event.content && (
              <div className="text-sm text-gray-700 mb-2">{event.content}</div>
            )}
            <div className="text-xs text-gray-500 space-y-1">
              <div>Start: {start}</div>
              <div>End: {end}</div>
              {location && <div>Location: {location}</div>}
            </div>
          </div>
          <button
            onClick={handleDownloadICS}
            className="ml-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            Add to Calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 p-3 rounded-md relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${event.approved ? 'bg-green-500' : 'bg-orange-500'}`} />
            <div className="text-xs text-gray-500">
              {new Date(event.created_at * 1000).toLocaleDateString()}
            </div>
          </div>
          <div className="text-sm text-gray-700">{event.content}</div>
          <div className="text-xs text-gray-500 mt-1">Kind: {event.kind}</div>
        </div>
      </div>
    </div>
  );
} 