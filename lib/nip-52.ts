import { EventTemplate, type UnsignedEvent } from 'nostr-tools';

export interface ICSEvent {
  summary: string;
  description: string;
  start: string;
  end: string;
  location?: string;
  uid: string;
  isAllDay?: boolean;
  startTzid?: string;
  endTzid?: string;
}

export interface DateBasedCalendarEvent extends EventTemplate {
  kind: 31922;
  tags: Array<
    | ['a', string] // community reference
    | ['d', string] // random identifier
    | ['title', string] // title of calendar event
    | ['start', string] // YYYY-MM-DD
    | ['end', string] // YYYY-MM-DD
    | ['location', string] // location
    | ['g', string] // geohash
  >;
}

export interface TimeBasedCalendarEvent extends EventTemplate {
  kind: 31923;
  tags: Array<
    | ['a', string] // community reference
    | ['d', string] // random identifier
    | ['title', string] // title of calendar event
    | ['summary', string] // brief description
    | ['image', string] // image URI
    | ['start', string] // unix timestamp in seconds
    | ['end', string] // unix timestamp in seconds
    | ['start_tzid', string] // IANA Time Zone Database identifier
    | ['end_tzid', string] // IANA Time Zone Database identifier
    | ['location', string] // location
    | ['g', string] // geohash
  >;
}

export type CalendarEvent = DateBasedCalendarEvent | TimeBasedCalendarEvent;

export function createDateBasedCalendarEventTemplate(
  icsEvent: ICSEvent,
  communityATag: string
): DateBasedCalendarEvent {
  const tags: DateBasedCalendarEvent['tags'] = [
    ['a', communityATag],
    ['d', icsEvent.uid || Math.random().toString(36).substring(7)],
    ['title', icsEvent.summary],
    ['start', icsEvent.start],
  ];

  if (icsEvent.end && icsEvent.end !== icsEvent.start) {
    tags.push(['end', icsEvent.end]);
  }

  if (icsEvent.location) {
    tags.push(['location', icsEvent.location]);
  }

  return {
    kind: 31922,
    tags,
    content: icsEvent.description || '',
    created_at: Math.floor(Date.now() / 1000),
  };
}

export function createTimeBasedCalendarEventTemplate(
  icsEvent: ICSEvent,
  communityATag: string
): TimeBasedCalendarEvent {
  const tags: TimeBasedCalendarEvent['tags'] = [
    ['a', communityATag],
    ['d', icsEvent.uid || Math.random().toString(36).substring(7)],
    ['title', icsEvent.summary],
    ['start', icsEvent.start],
  ];

  if (icsEvent.end && icsEvent.end !== icsEvent.start) {
    tags.push(['end', icsEvent.end]);
  }

  if (icsEvent.startTzid) {
    tags.push(['start_tzid', icsEvent.startTzid]);
  }

  if (icsEvent.endTzid) {
    tags.push(['end_tzid', icsEvent.endTzid]);
  }

  if (icsEvent.location) {
    tags.push(['location', icsEvent.location]);
  }

  return {
    kind: 31923,
    tags,
    content: icsEvent.description || '',
    created_at: Math.floor(Date.now() / 1000),
  };
}

export function createCalendarEventTemplate(
  icsEvent: ICSEvent,
  communityATag: string
): CalendarEvent {
  if (icsEvent.isAllDay) {
    return createDateBasedCalendarEventTemplate(icsEvent, communityATag);
  } else {
    return createTimeBasedCalendarEventTemplate(icsEvent, communityATag);
  }
}

export function validateCalendarEvent(event: EventTemplate): event is CalendarEvent {
  return event.kind === 31922 || event.kind === 31923;
}

export function validateDateBasedCalendarEvent(event: EventTemplate): event is DateBasedCalendarEvent {
  if (event.kind !== 31922) return false;

  // Find start and end tags
  const startTag = event.tags.find(tag => tag[0] === 'start');
  const endTag = event.tags.find(tag => tag[0] === 'end');

  // Check if start tag exists and matches YYYY-MM-DD format
  if (!startTag?.[1]) return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startTag[1])) return false;

  // If end tag exists, check it matches YYYY-MM-DD format and is after start
  if (endTag?.[1]) {
    if (!dateRegex.test(endTag[1])) return false;
    if (endTag[1] <= startTag[1]) return false;
  }

  return true;
}

export function validateTimeBasedCalendarEvent(event: EventTemplate): event is TimeBasedCalendarEvent {
  if (event.kind !== 31923) return false;

  // Find start and end tags
  const startTag = event.tags.find(tag => tag[0] === 'start');
  const endTag = event.tags.find(tag => tag[0] === 'end');

  // Check if start tag exists and is a valid Unix timestamp
  if (!startTag?.[1]) return false;

  const startTimestamp = parseInt(startTag[1], 10);
  if (isNaN(startTimestamp) || startTimestamp <= 0) return false;

  // If end tag exists, check it's a valid Unix timestamp and after start
  if (endTag?.[1]) {
    const endTimestamp = parseInt(endTag[1], 10);
    if (isNaN(endTimestamp) || endTimestamp <= 0) return false;
    if (endTimestamp <= startTimestamp) return false;
  }

  return true;
}