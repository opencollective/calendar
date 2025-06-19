import { type ICSEvent } from './nip-52';

/**
 * Parse ICS content and extract calendar events
 * @param icsContent - The raw ICS file content
 * @returns Array of parsed ICSEvent objects
 */
export function parseICS(icsContent: string): ICSEvent[] {
  const events: ICSEvent[] = [];

  const lines = icsContent.split('\n');
  let currentEvent: any = {};
  let inEvent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.summary && currentEvent.start && currentEvent.end) {
        events.push(currentEvent);
      }
    } else if (inEvent && line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      switch (key) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
          break;
        case 'DTSTART':
          const startResult = parseICSDateTime(value);
          currentEvent.start = startResult.value;
          currentEvent.isAllDay = startResult.isAllDay;
          currentEvent.startTzid = startResult.tzid;
          break;
        case 'DTEND':
          const endResult = parseICSDateTime(value);
          currentEvent.end = endResult.value;
          currentEvent.endTzid = endResult.tzid;
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'UID':
          currentEvent.uid = value;
          break;
      }
    }
  }

  return events;
}

interface ICSDateTimeResult {
  value: string;
  isAllDay: boolean;
  tzid?: string;
}

/**
 * Parse ICS date-time format and determine if it's all-day or time-based
 * @param dateTimeString - ICS date-time string
 * @returns Object with parsed value, all-day flag, and timezone info
 */
export function parseICSDateTime(dateTimeString: string): ICSDateTimeResult {
  // Check for timezone parameter
  const tzidMatch = dateTimeString.match(/TZID=([^:]+):(.+)/);
  let tzid: string | undefined;
  let dateTime: string;

  if (tzidMatch) {
    tzid = tzidMatch[1];
    dateTime = tzidMatch[2];
  } else {
    dateTime = dateTimeString;
  }

  // Check if it's a date-only format (all-day event)
  if (!dateTime.includes('T')) {
    // Date-only format: 20231201
    const date = dateTime.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    return {
      value: date,
      isAllDay: true,
      tzid
    };
  } else {
    // Date-time format: 20231201T120000Z or 20231201T120000
    const timestamp = parseICSDateTimeToTimestamp(dateTime, tzid);
    return {
      value: timestamp.toString(),
      isAllDay: false,
      tzid
    };
  }
}

/**
 * Convert ICS date-time string to Unix timestamp
 * @param dateTimeString - ICS date-time string (e.g., "20231201T120000Z" or "20231201T120000")
 * @param tzid - Optional timezone identifier
 * @returns Unix timestamp in seconds
 */
export function parseICSDateTimeToTimestamp(dateTimeString: string, tzid?: string): number {
  // Remove Z suffix if present (UTC)
  const cleanDateTime = dateTimeString.replace('Z', '');
  
  // Parse the date-time components
  const match = cleanDateTime.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    throw new Error(`Invalid ICS date-time format: ${dateTimeString}`);
  }

  const [, year, month, day, hour, minute, second] = match;
  
  // Create Date object (handles timezone conversion)
  const date = new Date(
    parseInt(year),
    parseInt(month) - 1, // Month is 0-indexed
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );

  // If original string had Z, it was UTC
  if (dateTimeString.endsWith('Z')) {
    return Math.floor(date.getTime() / 1000);
  }

  // For now, treat as local time if no timezone specified
  // In a production app, you might want to use a library like moment-timezone
  // to handle timezone conversions properly
  return Math.floor(date.getTime() / 1000);
}

/**
 * Parse ICS date format and convert to YYYY-MM-DD format (for backward compatibility)
 * @param dateString - ICS date string (e.g., "20231201")
 * @returns Date string in YYYY-MM-DD format
 */
export function parseICSDate(dateString: string): string {
  // Handle different iCal date formats
  if (dateString.includes('T')) {
    // Date-time format: 20231201T120000Z or 20231201T120000
    const date = dateString.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3');
    return date;
  } else {
    // Date-only format: 20231201
    const date = dateString.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    return date;
  }
}

/**
 * Fetch and parse ICS events from a URL
 * @param icsUrl - URL to fetch ICS content from
 * @returns Promise resolving to array of ICSEvent objects
 */
export async function fetchAndParseICSEvents(icsUrl: string): Promise<ICSEvent[]> {
  if (!icsUrl) {
    console.log('No ICS URL provided, skipping ICS fetch');
    return [];
  }

  try {
    console.log('Fetching ICS from:', icsUrl);
    const response = await fetch(icsUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ICS: ${response.status} ${response.statusText}`);
    }

    const icsContent = await response.text();
    const events = parseICS(icsContent);
    
    console.log(`Parsed ${events.length} events from ICS`);
    return events;
  } catch (error) {
    console.error('Error fetching ICS:', error);
    return [];
  }
} 