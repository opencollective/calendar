'use client';
import { useState } from 'react';
import { CalendarEvent, createDateBasedCalendarEventTemplate, createTimeBasedCalendarEventTemplate } from '@/lib/nip-52';
import { getCommunityATag } from '@/lib/nip-72';

interface EventFormProps {
  onSubmit: (event: CalendarEvent) => void;
}

export function EventForm({ onSubmit }: EventFormProps) {
  const [isAllDay, setIsAllDay] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    location: '',
    geohash: '',
    content: '',
    startTzid: '',
    endTzid: '',
  });

  const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
  const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!community_id || !community_identifier) {
      console.error('Community ID or identifier not found in environment variables');
      return;
    }

    const communityATag = getCommunityATag(community_id, community_identifier);
    
    let calendarEvent: CalendarEvent;

    if (isAllDay) {
      // Create date-based event (kind 31922)
      calendarEvent = createDateBasedCalendarEventTemplate(
        {
          summary: formData.title,
          description: formData.content,
          start: formData.start,
          end: formData.end,
          location: formData.location,
          uid: Math.random().toString(36).substring(7),
          isAllDay: true,
        },
        communityATag
      );
    } else {
      // Create time-based event (kind 31923)
      const startTimestamp = Math.floor(new Date(formData.start).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(formData.end).getTime() / 1000);
      
      calendarEvent = createTimeBasedCalendarEventTemplate(
        {
          summary: formData.title,
          description: formData.content,
          start: startTimestamp.toString(),
          end: endTimestamp.toString(),
          location: formData.location,
          uid: Math.random().toString(36).substring(7),
          isAllDay: false,
          startTzid: formData.startTzid || undefined,
          endTzid: formData.endTzid || undefined,
        },
        communityATag
      );
    }

    onSubmit(calendarEvent);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="text-sm text-gray-700 font-semibold">Community ID: <span className="font-mono">{community_id}</span></div>
        <div className="text-sm text-gray-700 font-semibold">Community Identifier: <span className="font-mono">{community_identifier}</span></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter event title"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAllDay"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-700">
            All-day event
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-gray-700">
              Start {isAllDay ? 'Date' : 'Date & Time'} <span className="text-red-500">*</span>
            </label>
            <input
              type={isAllDay ? "date" : "datetime-local"}
              id="start"
              name="start"
              value={formData.start}
              onChange={handleChange}
              required
              className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="end" className="block text-sm font-medium text-gray-700">
              End {isAllDay ? 'Date' : 'Date & Time'} <span className="text-red-500">*</span>
            </label>
            <input
              type={isAllDay ? "date" : "datetime-local"}
              id="end"
              name="end"
              value={formData.end}
              onChange={handleChange}
              required
              className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {!isAllDay && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="startTzid" className="block text-sm font-medium text-gray-700">
                Start Timezone
              </label>
              <select
                id="startTzid"
                name="startTzid"
                value={formData.startTzid}
                onChange={handleChange}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Local time</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div>
              <label htmlFor="endTzid" className="block text-sm font-medium text-gray-700">
                End Timezone
              </label>
              <select
                id="endTzid"
                name="endTzid"
                value={formData.endTzid}
                onChange={handleChange}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Same as start</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter event location"
          />
        </div>

        <div>
          <label htmlFor="geohash" className="block text-sm font-medium text-gray-700">
            Geohash
          </label>
          <input
            type="text"
            id="geohash"
            name="geohash"
            value={formData.geohash}
            onChange={handleChange}
            className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter geohash (optional)"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={4}
            className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter event description"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Event
          </button>
        </div>
      </form>
    </>
  );
} 