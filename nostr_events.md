It felt for me recently that a community's success is somewhat constrained by the bandwidth of moderators, and so it could be important in this case that the barrier for people to start organizing and taking initiative be low enough.

Proposal always come from community members with more motivation or more time to dedicate to the community.
Let's take the example of organizing a community events. An event organizer has an incentive to publicize and formalize an event as soon as possible in the calendar so he can get help and resources from the community. However this event needs to match with the ethos / guidelines of the community.

This applies to events but could also apply to other things like allocation or resources or the guidelines themselves. However I wanted to limit the scope of this to events and later extend it to other proposals.

I talked to Xavier and he mentioned that NOSTR could eventually be used as a sort of backend for Open Collective. 

In the context of the Commons hub, events need to ultimately be present in the CHB calendar and Luma. This could be done by a CHB community NOSTR client that would ensure those are up-to-date with the Communit 

## Suggestions for implementation in NOSTR

A community member wants to create an event and wants it to appear in a community calendar. The event should be reviewed for community guidelines and there should be a process for that. For now let us assume that we have a `community moderator` who does that work.

The best is probably to use [NIP-52](https://github.com/nostr-protocol/nips/blob/master/52.md) format for an event.

The use-case seems to fit somewhat into the [Moderated Community NIP-72](https://github.com/nostr-protocol/nips/blob/master/72.md). In this case a `moderator` as defined with the `p` tag of the community definition would be able to approve or disapprove of an event posted to the community.

Any event can be posted to a community so a user proposing an event can simply post an calendar event to a community, which then must be approved by 

To summarize : 

- A community is created as per `NIP-72`
```
{
  "created_at": <Unix timestamp in seconds>,
  "kind": 34550,
  "tags": [
    ["d", "<community-d-identifier>"],
    ["name", "<Community name>"],
    ["description", "<Community description>"],
    ["image", "<Community image url>", "<Width>x<Height>"],

    // moderators
    ["p", "<32-bytes hex of a pubkey1>", "<optional recommended relay URL>", "moderator"],
    // relays used by the community (w/optional marker)
    ["relay", "<relay hosting author kind 0>", "author"],
    ["relay", "<relay where to send and receive requests>", "requests"],
    ["relay", "<relay where to send and receive approvals>", "approvals"],
    ["relay", "<relay where to post requests to and fetch approvals from>"]
  ],
  // other fields...
}
```
- A client sends a request to a community to create an event. The user does not have to specify any participants for the event.
From [NIP-52](https://github.com/nostr-protocol/nips/blob/master/52.md):
```
{
  "id": <32-bytes lowercase hex-encoded SHA-256 of the the serialized event data>,
  "pubkey": <32-bytes lowercase hex-encoded public key of the event creator>,
  "created_at": <unix timestamp in seconds>,
  "kind": 31922,
  "content": "<description of calendar event>",
  "tags": [
    ["d", "<random-identifier>"],
    ["title", "<title of calendar event>"],
    // dates
    ["start", "<YYYY-MM-DD>"],
    ["end", "<YYYY-MM-DD>"],
    // location
    ["location", "<location>"],
    ["g", "<geohash>"],
  ]
}
```
- The moderator sends an approval message
From [NIP-72](https://github.com/nostr-protocol/nips/blob/master/72.md): 
```
{
  "kind": 1,
  "tags": [
    ["a", "34550:<community event author pubkey>:<community-d-identifier>", "<optional-relay-url>"],
  ],
  "content": "hello world",
  // other fields...
}
```
- Clients are free to read from the community events and see for themselves which events have been approved








Talking to Xavier about the needs in a community we landed on doing something about proposals and start with a more specific use-case around event proposals.