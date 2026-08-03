# Applications Messaging Plan

## Goal

Add a real status and messaging layer to `/de/applications` so the renter can see:

- current application status
- unread / new activity
- parsed IS24 message history
- agent-side actions and notes
- landlord / listing-agent replies

The renter does **not** chat directly. The conversation is handled by the Bookimmo agent, and the renter sees a synchronized timeline.

## Source of truth

For ImmoScout24, the canonical communication source should be:

- `https://www.immobilienscout24.de/messenger/conversations`

This is important because one Bookimmo agent can represent multiple renters in parallel. So we cannot map a thread to a client only by "which agent sent the message".

The stable mapping keys should be:

- `provider_source = 'is24'`
- `provider_expose_id`
- `provider_conversation_id`
- `application_id`

Client-facing tables can stay normalized inside Bookimmo, but their contents should be derived from the IS24 Messenger conversation stream.

`apartment_replies` and `apartment_timeline` remain useful as raw ingestion / fallback traces, but they should not be treated as the final source of truth for the renter cabinet.

## What already exists

Current frontend:

- `src/components/applications/ApplicationsShell.jsx`
- application wizard with steps: profile, documents, cover letter, review
- `public.applications` table only stores draft/submitted status + cover letter

Current backend traces:

- `public.apartment_timeline`
- `public.apartment_replies`
- backend watcher already detects `messenger/conversations`
- `storage_db.py` already logs:
  - `contact_sent`
  - `reply_received`
- `apartment_replies` already stores parsed reply text + timestamp

So we do **not** start from zero. We already have raw traces plus a known messenger entrypoint, but we still need the normalized mapping layer.

## Product model

Each application should become a case file with 3 layers:

1. Submission state
- draft
- queued_for_agent
- sent_to_provider
- waiting_for_reply
- reply_received
- follow_up_sent
- viewing_requested
- viewing_confirmed
- documents_requested
- accepted
- rejected
- archived

2. Activity timeline
- internal events from Bookimmo
- parsed IS24 replies
- parsed message snippets
- optional manual notes by Bookimmo agent

3. Conversation thread
- normalized message list
- source-aware (`is24`, later `immowelt`, email, phone note, manual`)
- unread marker for renter

## Recommended data model

Keep `public.applications`, but extend it.

### 1. Extend `public.applications`

Add fields:

- `provider_source TEXT`
- `provider_expose_id TEXT`
- `provider_conversation_id TEXT`
- `assigned_agent_id TEXT`
- `stage TEXT NOT NULL DEFAULT 'draft'`
- `stage_updated_at TIMESTAMPTZ`
- `last_message_at TIMESTAMPTZ`
- `last_message_preview TEXT`
- `unread_count INTEGER NOT NULL DEFAULT 0`
- `conversation_state TEXT NOT NULL DEFAULT 'none'`

Purpose:

- fast list rendering in the left rail
- no need to aggregate full thread on every page load

### 2. New `public.application_events`

One unified timeline.

Columns:

- `id TEXT PRIMARY KEY`
- `application_id TEXT NOT NULL`
- `event_type TEXT NOT NULL`
- `event_source TEXT NOT NULL`
- `actor_role TEXT`
- `title TEXT`
- `body TEXT`
- `payload JSONB NOT NULL DEFAULT '{}'::jsonb`
- `occurred_at TIMESTAMPTZ NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Examples:

- `draft_created`
- `submitted_to_provider`
- `agent_followup_sent`
- `reply_received`
- `documents_requested`
- `viewing_suggested`
- `status_changed`

### 3. New `public.application_messages`

Normalized message thread.

Columns:

- `id TEXT PRIMARY KEY`
- `application_id TEXT NOT NULL`
- `provider_source TEXT NOT NULL`
- `external_thread_id TEXT`
- `external_message_id TEXT`
- `direction TEXT NOT NULL`
- `sender_role TEXT NOT NULL`
- `sender_name TEXT`
- `subject TEXT`
- `body_text TEXT`
- `body_html TEXT`
- `attachments JSONB NOT NULL DEFAULT '[]'::jsonb`
- `message_timestamp TIMESTAMPTZ NOT NULL`
- `is_unread_for_client BOOLEAN NOT NULL DEFAULT TRUE`
- `raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Direction:

- `outbound`
- `inbound`
- `internal`

Sender role:

- `bookimmo_agent`
- `landlord`
- `listing_agent`
- `system`

## Mapping IS24 data to applications

This is the key part.

We need a stable join between:

- Bookimmo application
- cached listing
- IS24 expose ID
- IS24 conversation / reply rows
- represented renter in Bookimmo

Recommended rule:

1. When an application draft is created from a listing:
- persist `provider_source`
- persist `provider_expose_id`
- persist `provider_conversation_id` later, once the messenger thread is known

2. When backend syncs `messenger/conversations`:
- match by `provider_conversation_id` first
- fall back to `provider_expose_id` if the thread is not linked yet
- resolve matching `application_id`
- write both:
  - `application_events`
  - `application_messages` if there is actual message text

3. Keep `apartment_timeline` and `apartment_replies` as ingestion/raw tables for now.
- They can remain the parser landing zone.
- A sync job converts them into application-facing records.
- But for IS24, that sync should be fed from `messenger/conversations`, not only from email-style reply rows.

## Ingestion flow

### Short-term MVP

1. Backend messenger sync reads conversation threads from:
- `https://www.immobilienscout24.de/messenger/conversations`

2. Parser writes raw traces into:
- `apartment_replies`
- `apartment_timeline`

3. New sync job:
- scans unseen conversation messages
- finds `application` by `provider_conversation_id`
- falls back to `provider_expose_id`
- creates:
  - `application_events.reply_received`
  - `application_messages.inbound`
- updates application summary fields:
  - `stage = 'reply_received'`
  - `last_message_at`
  - `last_message_preview`
  - `unread_count += 1`

4. When Bookimmo agent sends a follow-up:
- backend creates:
  - `application_events.agent_followup_sent`
  - `application_messages.outbound`
- updates:
  - `stage = 'waiting_for_reply'` or `follow_up_sent`

### Later

Make the IS24 conversation sync incremental, so full thread history, unread state and the latest inbound/outbound activity stay aligned with the renter cabinet.

## API shape

### `GET /api/applications`

Current response is too small.

Extend each application with:

- `stage`
- `stageUpdatedAt`
- `lastMessageAt`
- `lastMessagePreview`
- `unreadCount`
- `providerSource`
- `providerExposeId`
- `providerConversationId`

### `GET /api/applications/:id/thread`

Returns:

- application summary
- events timeline
- messages list
- provider thread metadata

### `POST /api/applications/:id/read`

Marks all client-visible messages as read.

### `POST /api/applications/:id/note`

Optional internal note by Bookimmo staff.

### `POST /api/applications/:id/status`

Manual override for stage transitions when needed.

## Frontend UX for `/applications`

Replace the current wizard-only feel with a split workspace.

### Left rail

Per application card show:

- title
- stage pill
- last activity time
- unread badge
- last message preview

### Main panel

Top:

- property summary
- current stage
- assigned Bookimmo agent
- “last reply from landlord / listing agent”

Middle:

- tabs:
  - `Workflow`
  - `Messages`
  - `Timeline`
  - `Documents`

### Messages tab

Chat-style thread, but read-only for renter.

Message groups:

- outbound from Bookimmo agent
- inbound from landlord / listing agent
- system blocks for status changes

### Timeline tab

Operational history:

- draft created
- application sent
- follow-up sent
- reply received
- viewing proposed
- status changed

This is useful even when the raw message body is short or missing.

### Notification behavior

Show in Applications list and dashboard:

- unread badge on application row
- top-level counter: “1 application needs your attention”
- highlight latest incoming reply

## Status rules

Recommended automatic transitions:

- `draft` -> when created
- `sent_to_provider` -> when backend confirms contact sent
- `waiting_for_reply` -> after outbound agent follow-up
- `reply_received` -> on inbound parsed reply
- `documents_requested` -> if message classifier detects document ask
- `viewing_requested` -> if message classifier detects invitation / scheduling

Keep manual override for agent operations.

## Message classification

Simple first pass:

- keyword rules on German / English message bodies
- classify into:
  - request_for_documents
  - viewing_invitation
  - rejection
  - generic_reply

Store classification result in `payload`.

Later:

- small LLM classifier for cleaner routing

## Implementation order

### Phase 1

- extend `applications` summary fields
- add `application_events`
- add `application_messages`
- add conversation mapping fields (`provider_expose_id`, `provider_conversation_id`)
- expose thread API for one application
- show unread badge + last activity in applications list

### Phase 2

- add `Messages` and `Timeline` tabs in `ApplicationsShell`
- mark thread as read
- stage pills and notification counters

### Phase 3

- sync full IS24 messenger threads from `messenger/conversations`
- add attachment support
- add agent notes / manual status controls

## Why this is the right approach

- fits the current schema instead of replacing it
- reuses already parsed IS24 backend data while moving the canonical source to Messenger
- separates raw ingestion from client-facing normalized thread data
- supports future sources beyond IS24
- gives renter visibility without exposing direct provider messaging controls

## Immediate next coding step

Build the backend normalization layer first:

1. schema migration for `application_events` and `application_messages`
2. add `provider_source` + `provider_expose_id` + `provider_conversation_id` to `applications`
3. expose `GET /api/applications/:id/thread`
4. write sync job from `messenger/conversations`
5. keep `apartment_replies` / `apartment_timeline` as raw fallback ingestion

After that, update `ApplicationsShell` to add:

- unread badge
- current stage block
- messages tab
- timeline tab

## Implemented on August 3, 2026

Backend/API layer now includes:

- `public.application_provider_threads`
- `POST /api/applications-link-thread`
- `POST /api/applications-sync`
- `GET /api/applications-thread?id=...` returning `providerThread`

The current sync layer already:

- reads `public.apartment_timeline`
- reads `public.apartment_replies`
- normalizes them into:
  - `public.application_events`
  - `public.application_messages`
- updates application summary fields:
  - `stage`
  - `last_message_at`
  - `last_message_preview`
  - `unread_count`
  - `conversation_state`

Still pending for the full production path:

- direct browser/parser sync from live `messenger/conversations`
- automatic extraction of `provider_conversation_id` from the agent runtime
- automatic expose/thread linking without manual `applications-link-thread`
