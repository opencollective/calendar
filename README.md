# Overview

Decentralized Community Calendar using Nostr

Started from a conversation in [Open Collective](https://github.com/opencollective/opencollective/issues/8016).

## Features

### Automated Event Sync
The application uses a Vercel cron job to automatically query Nostr relays for new events every 5 minutes. It also fetches events from an external iCal feed and creates corresponding Nostr events.

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
1. Vercel cron job runs every 5 minutes and calls `/api/events/sync`
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
