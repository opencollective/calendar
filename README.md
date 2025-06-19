# Overview

Decentralized Community Calendar using Nostr

Started from a conversation in [Open Collective](https://github.com/opencollective/opencollective/issues/8016).

## Features

### Automated Event Sync
The application uses a Vercel cron job to automatically query Nostr relays for new events every 5 minutes. It also fetches events from an external iCal feed and creates corresponding Nostr events.

### Embeddable Calendar
The application provides an embeddable version of the events calendar that can be easily integrated into other websites using iframes.

#### Embed Usage
- **Embed URL**: `/embed` - Provides a clean, embeddable version of the events calendar
- **Features**: 
  - Compact event cards optimized for embedding
  - Responsive design that adapts to container size
  - "Add to Calendar" functionality for calendar events
  - Approval status indicators
  - No navigation buttons or admin features

#### Embed Code Example
```html
<iframe 
    src="https://your-domain.com/embed" 
    width="100%" 
    height="600" 
    frameborder="0" 
    style="border: none; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
></iframe>
```

#### Responsive Embed Example
```html
<div style="position: relative; padding-bottom: 75%; height: 0; overflow: hidden;">
    <iframe 
        src="https://your-domain.com/embed" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
        frameborder="0"
    ></iframe>
</div>
```

#### Configuration
Set the following environment variables:

- `NEXT_PUBLIC_NOSTR_COMMUNITY_ID`: Your Nostr community ID
- `NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER`: Your Nostr community identifier
- `ICS_URL`: URL to an iCal feed (optional) - events from this feed will be automatically created as Nostr events
- `NEXT_PUBLIC_BASE_URL`: Base URL for the application (default: http://localhost:3000)

#### Management
- **Settings Page**: View sync status and trigger manual syncs
- **API Endpoints**: 
  - `POST /api/events/sync` - Event sync endpoint (called by cron job and manual sync)
  - `GET /api/events/sync` - Get last sync information

#### How it Works
1. Vercel cron job runs every day and calls `/api/events/sync`
2. The sync endpoint queries Nostr relays for new events since last sync
3. If `ICS_URL` is configured, it fetches events from the iCal feed
4. New iCal events are created as Nostr events (if they don't already exist)
5. New events are processed with approval status
6. The main application displays sync status and last sync time

#### ICS Integration
- Supports standard iCal format feeds
- Automatically parses event details (title, description, start/end dates, location)
- Creates Nostr events with proper community tags
- Avoids duplicate events by checking existing Nostr events
- Handles both date-only and date-time formats

## TODO
- check nip-52 again
- replace Lu.ma iframe
