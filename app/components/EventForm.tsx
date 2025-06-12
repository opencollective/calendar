'use client';
import { useState } from 'react';
import { CalendarTemplateEvent } from '@/lib/nip-52';
import { getCommunityATag } from '@/lib/nip-72';

interface EventFormProps {
  onSubmit: (event: CalendarTemplateEvent) => void;
}

export function EventForm({ onSubmit }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    location: '',
    geohash: '',
    content: '',
  });

  const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
  const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!community_id || !community_identifier) {
      console.error('Community ID or identifier not found in environment variables');
      return;
    }
    
    const calendarEvent: CalendarTemplateEvent = {
      kind: 31922,
      tags: [
        ['a', getCommunityATag(community_id, community_identifier)],
        ['d', Math.random().toString(36).substring(7)], // Random identifier
        ['title', formData.title],
        ['start', formData.start],
        ['end', formData.end],
        ['location', formData.location],
        ['g', formData.geohash],
      ],
      content: formData.content,
      created_at: Math.floor(Date.now() / 1000),
    };

    onSubmit(calendarEvent);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
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
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="end"
              name="end"
              value={formData.end}
              onChange={handleChange}
              required
              className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

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