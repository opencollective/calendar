import { useState } from 'react';
import { type NostrEvent } from 'nostr-tools';
import { generateIcsCalendar, type IcsCalendar } from 'ts-ics';
import { ApprovedEvent } from '../contexts/EventsProvider';
import { EventEditForm } from './EventEditForm';
import { CalendarEvent } from '@/lib/nip-52';
import { useKey } from '../contexts/KeyProvider';

interface EventCardProps {
  event: ApprovedEvent;
  onEventUpdate?: (updatedEvent: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => Promise<boolean>;
}

export function EventCard({ event, onEventUpdate, onEventDelete }: EventCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { publicKey } = useKey();
  const isCalendarEvent = event.kind === 31922 || event.kind === 31923;
  const isOwner = publicKey === event.pubkey;

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

  const handleEditSubmit = (updatedEvent: CalendarEvent) => {
    if (onEventUpdate) {
      onEventUpdate(updatedEvent);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onEventDelete) return;
    
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        const success = await onEventDelete(event.id);
        if (success) {
          console.log('Event deleted successfully');
        } else {
          console.error('Failed to delete event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  if (isEditing) {
    return (
      <EventEditForm
        event={event}
        onSubmit={handleEditSubmit}
        onCancel={handleEditCancel}
      />
    );
  }

  if (isCalendarEvent) {
    const title = event.tags.find((tag: string[]) => tag[0] === 'title')?.[1] || 'Untitled Event';
    const start = event.tags.find((tag: string[]) => tag[0] === 'start')?.[1];
    const end = event.tags.find((tag: string[]) => tag[0] === 'end')?.[1];
    const location = event.tags.find((tag: string[]) => tag[0] === 'location')?.[1];
    const startTzid = event.tags.find((tag: string[]) => tag[0] === 'start_tzid')?.[1];
    const endTzid = event.tags.find((tag: string[]) => tag[0] === 'end_tzid')?.[1];

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
        <div className="text-xs text-gray-400 mb-2">
          {event.kind === 31922 ? 'All-day event' : 'Time-based event'}
        </div>
        <h3 className="text-lg font-semibold mt-2 group relative">
          <span className="cursor-help">{title}</span>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10">
            <div><strong>Kind:</strong> {event.kind}</div>
            <div><strong>Pubkey:</strong> {event.pubkey.slice(0, 16)}...</div>
            <div><strong>ID:</strong> {event.tags.find((tag: string[]) => tag[0] === 'd')?.[1] || 'N/A'}</div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </h3>
        <div className="mt-2">{event.content}</div>
        <div className="mt-2 text-sm text-gray-500">
          <div>Start: {startDisplay}</div>
          <div>End: {endDisplay}</div>
          {location && <div>Location: {location}</div>}
          {startTzid && <div>Start Timezone: {startTzid}</div>}
          {endTzid && <div>End Timezone: {endTzid}</div>}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleDownloadICS}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add to Calendar
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Edit Event
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete Event
              </button>
            </>
          )}
        </div>
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
      {isOwner && (
        <div className="mt-4">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Event
          </button>
        </div>
      )}
    </div>
  );
} 