# Bookimmo Cabinet Map And AI Search Workspace

## Purpose

Define the next cabinet milestone after onboarding:

- map-first search workspace inside the client cabinet;
- AI-assisted search form after onboarding;
- saved search intent model connected to real Germany listing data;
- direct bridge from search to favorites and application drafts.

This document is written as an implementation-facing specification, not a conceptual brainstorm.

## Product Goal

After a user completes onboarding, they should land in a search workspace where:

- their profile already influences search defaults;
- they can browse listings on a Germany map and in a synchronized list;
- they can refine intent in natural language through an AI search form;
- AI transforms that intent into structured filters, not into opaque search output;
- the resulting filters drive real provider search across the unified listing layer.

The feature should reduce the distance between:

- profile completion;
- search discovery;
- saved preferences;
- application start.

## User Outcome

The user should feel:

- “the platform already understands what kind of apartment I need”;
- “I can quickly refine it in normal language”;
- “I can see the result immediately on the map”;
- “I can save this search and start an application without repeating myself”.

## Scope

## In Scope

- cabinet search workspace page;
- map + list synchronized listing browsing;
- post-onboarding AI search form;
- structured search intent extraction;
- saved searches;
- reuse of profile context inside search defaults;
- transition from listing preview to favorite / draft application / detail page.

## Out Of Scope

- fully autonomous AI search with no structured filters;
- provider-side application submission from the search page;
- advanced commute-time routing;
- neighborhood scoring engine;
- CRM/operator matching UI;
- document generation inside the search flow.

## Core UX Flow

## Entry Flow

1. User completes registration and onboarding.
2. User saves or confirms their renter profile.
3. System checks whether at least one search intent exists.
4. If not, user is routed into `AI Search Setup`.
5. AI Search Setup proposes a first structured search based on profile context.
6. User confirms or edits.
7. User lands in `Search Workspace`.

## Workspace Flow

1. User sees a split layout:
- left: AI search summary, filters, list results, saved searches;
- right: interactive Germany map.
2. Listings are shown as markers and as cards.
3. Clicking a marker highlights the corresponding card.
4. Clicking a card highlights the corresponding marker.
5. User can:
- save listing;
- open detail page;
- create application draft;
- edit search;
- save current filters as a named search.

## AI Refinement Flow

1. User opens `Refine search with AI`.
2. User writes free text in selected system language.
3. AI receives:
- renter profile context;
- current search filters;
- optional previous saved search name/intent;
- supported location/filter vocabulary.
4. AI returns a structured intent object.
5. UI shows:
- normalized filters;
- extracted locations;
- inferred assumptions;
- unresolved ambiguities, if any.
6. User confirms.
7. Search reruns against live listing providers.

## Information Architecture

## Main Page

Suggested route:

- `/:lang/search-workspace`

Suggested sections:

- search header;
- current search summary;
- AI search entry point;
- saved searches rail;
- filter panel;
- result list;
- map panel;
- listing preview sheet/card.

## Listing Preview

Must include:

- title;
- provider/source;
- district / city;
- price;
- rooms;
- area if available;
- image;
- badges like furnished / pets / balcony if available;
- CTA:
- `Open details`
- `Save`
- `Start application`

## Map Experience

## Functional Requirements

- map centers on Germany by default if no profile location exists;
- if profile has preferred locations, map initializes there;
- markers use unified listing coordinates;
- clustering is optional for phase 1 but recommended;
- list updates when map bounds materially change;
- map updates when filters or saved search change;
- selected listing remains visually linked across map and list;
- provider-specific detail route must open from marker/list.

## Empty / Low Data States

- no results for current filters;
- no coordinates for some listings;
- profile incomplete;
- no saved search yet.

For low data cases:

- show fallback list even if some listings lack coordinates;
- display a helpful prompt to broaden or refine search;
- propose AI refinement.

## AI Search Form Specification

## Input Sources

AI may use:

- `preferredLanguage`
- `currentCity`
- `moveInDate`
- `maxBudget`
- `adultsCount`
- `childrenCount`
- `pets`
- `occupation`
- `employmentStatus`
- `monthlyNetIncome`
- `preferredDistricts`
- `aboutMe`
- profile completeness state

## User Prompt Types

Examples:

- “We are a couple moving from Amsterdam to Hamburg in October, need 3 rooms under 2600 warm.”
- “Find family-friendly apartments in Winterhude or Eppendorf near parks.”
- “Pet-friendly furnished apartment in Berlin for 6 months.”

## AI Output Contract

AI must return a structured object, not prose-only output.

Suggested object:

```json
{
  "query_label": "Family 3-room Hamburg under 2600 warm",
  "language": "en",
  "locations": [
    {
      "country": "DE",
      "city": "Hamburg",
      "district": "Winterhude",
      "provider_geocode": "optional"
    }
  ],
  "filters": {
    "budget_max": 2600,
    "budget_type": "warm",
    "rooms_min": 3,
    "rooms_max": 4,
    "furnished": false,
    "pets_allowed": true,
    "move_in_date": "2026-10-01"
  },
  "lifestyle_preferences": [
    "family_friendly",
    "near_parks"
  ],
  "assumptions": [
    "warm rent interpreted as total monthly housing cost"
  ],
  "needs_confirmation": []
}
```

## Important Rule

AI does not directly fetch listings.

AI only:

- interprets user intent;
- maps it to structured filters;
- resolves language into search semantics;
- proposes a normalized search configuration.

Provider search remains deterministic and runs through the listing adapters.

## Data Model

## New/Expanded Entities

### `saved_searches`

Purpose:

- persist user search presets;
- allow one-click re-run;
- power notifications later.

Suggested fields:

- `id`
- `user_id`
- `name`
- `language`
- `query_text`
- `intent_payload jsonb`
- `filters_payload jsonb`
- `map_center_lat`
- `map_center_lng`
- `map_zoom`
- `notifications_enabled`
- `created_at`
- `updated_at`

### `saved_search_locations`

Purpose:

- normalized location rows linked to a saved search.

Suggested fields:

- `id`
- `saved_search_id`
- `country_code`
- `city`
- `district`
- `provider`
- `provider_geocode`
- `lat`
- `lng`

### Optional `search_events`

Purpose:

- analytics and debugging for AI-to-search conversion.

Suggested fields:

- `id`
- `user_id`
- `saved_search_id`
- `query_text`
- `intent_payload`
- `result_count`
- `created_at`

## Backend / API Requirements

## Search Workspace API Surface

We need endpoints or equivalent client-accessible functions for:

- get current saved searches;
- create saved search;
- update saved search;
- delete saved search;
- run listing search from normalized filters;
- optional AI intent parsing endpoint.

## Required Inputs To Listing Search

- provider set or provider mode;
- normalized locations;
- bounds if map-driven;
- budget;
- rooms;
- furnished flag;
- pets flag;
- move-in date;
- any provider-compatible extras.

## Listing Response Shape

Must stay provider-aware but UI-normalized:

- `source`
- `external_id`
- `detail_slug`
- `title`
- `price`
- `rooms`
- `area`
- `district`
- `city`
- `lat`
- `lon`
- `image`
- `source_url`
- `badges`

## Frontend Integration Requirements

## Existing Pieces To Reuse

- cabinet layout;
- map component;
- live listing search hooks;
- favorites flow;
- applications draft flow;
- unified listing detail routing;
- profile state from Supabase-backed cabinet.

## New Frontend Components

- `SearchWorkspacePage`
- `SearchWorkspaceShell`
- `SavedSearchList`
- `AiSearchIntentForm`
- `SearchIntentSummary`
- `SearchMapPanel`
- `SearchResultList`
- `ListingPreviewDrawer`

## State Requirements

Need a single state model for:

- current free-text query;
- current structured filters;
- current map bounds;
- selected listing id;
- selected saved search id;
- loading / error states;
- AI parse state;
- listing result state.

## Acceptance Criteria

## Phase 1

- user can complete onboarding and land in search workspace;
- workspace shows synchronized map and list;
- listings open detail pages;
- listings can be saved and drafted into applications;
- user can save a structured search;
- user can reopen a saved search and get the same filters back;
- AI form can transform free text into structured filters;
- AI output is reviewable before search is run.

## Phase 2

- multiple saved searches per user;
- search summary cards on dashboard;
- optional notifications for saved searches;
- provider-aware geocode handling for Germany.

## Risks

- AI output can over-infer location or budget semantics;
- provider geocode precision can differ across sources;
- some listings may not have reliable coordinates;
- saved searches can drift if provider filter semantics change;
- profile data and AI output can become inconsistent if not normalized centrally.

## Implementation Principle

Build the deterministic search workspace first, then layer AI refinement on top.

Do not build an AI-first flow without a clear normalized search model underneath.
