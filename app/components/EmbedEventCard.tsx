import { type NostrEvent } from 'nostr-tools';
import { generateIcsCalendar, type IcsCalendar } from 'ts-ics';
import { ApprovedEvent } from '../contexts/EventsProvider';

interface EmbedEventCardProps {
  event: ApprovedEvent;
}

export function EmbedEventCard({ event }: EmbedEventCardProps) {
  const isCalendarEvent = event.kind === 31922 || event.kind === 31923;

  const handleDownloadICS = () => {
    if (!isCalendarEvent) return;

    const title = event.tags.find((tag: string[]) => tag[0] === 'title')?.[1] || 'Untitled Event';
    const start = event.tags.find((tag: string[]) => tag[0] === 'start')?.[1];
    const end = event.tags.find((tag: string[]) => tag[0] === 'end')?.[1];
    const location = event.tags.find((tag: string[]) => tag[0] === 'location')?.[1];

    if (!start) return;

    let startDate: Date;
    let endDate: Date;

    if (event.kind === 31922) {
      // Date-based event (YYYY-MM-DD format)
      startDate = new Date(start);
      endDate = end ? new Date(end) : new Date(start);
    } else {
      // Time-based event (Unix timestamp)
      startDate = new Date(parseInt(start) * 1000);
      endDate = end ? new Date(parseInt(end) * 1000) : startDate;
    }

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

    let startDisplay: string;
    let endDisplay: string;

    if (event.kind === 31922) {
      // Date-based event
      startDisplay = start || 'No start date';
      endDisplay = end || startDisplay;
    } else {
      // Time-based event
      if (start) {
        const startDate = new Date(parseInt(start) * 1000);
        startDisplay = startDate.toLocaleString();
      } else {
        startDisplay = 'No start time';
      }
      
      if (end) {
        const endDate = new Date(parseInt(end) * 1000);
        endDisplay = endDate.toLocaleString();
      } else {
        endDisplay = 'No end time';
      }
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
              <div className="text-xs text-gray-400">
                {event.kind === 31922 ? 'All-day' : 'Time-based'}
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 group relative">
              <span className="cursor-help">{title}</span>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
                <div><strong>Kind:</strong> {event.kind}</div>
                <div><strong>Pubkey:</strong> {event.pubkey.slice(0, 16)}...</div>
                <div><strong>ID:</strong> {event.tags.find((tag: string[]) => tag[0] === 'd')?.[1] || 'N/A'}</div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </h3>
            <div className="text-xs text-gray-600 mt-1">
              <div>Start: {startDisplay}</div>
              <div>End: {endDisplay}</div>
              {location && <div>Location: {location}</div>}
            </div>
            <div className="text-xs text-gray-700 mt-1">{event.content}</div>
            <button
              onClick={handleDownloadICS}
              className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Add to Calendar
            </button>
          </div>
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