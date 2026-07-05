# Bookimmo Cabinet Map And AI Search Ticket Backlog

## Usage

This is the execution backlog for the cabinet map workspace and AI search flow.

Priority labels:

- `P0` critical foundation
- `P1` high-value user feature
- `P2` improvement / hardening

Status labels:

- `todo`
- `in_progress`
- `blocked`
- `done`

## Epic A. Search Workspace Foundation

### BM-001 `P0` `todo`
Create `SearchWorkspacePage` on cabinet layout.

Deliverables:

- route wiring;
- shell layout;
- placeholder sections for saved searches, filters, list, map.

Acceptance:

- route opens inside cabinet layout;
- page supports desktop and tablet widths;
- authenticated and guest behavior is explicit.

### BM-002 `P0` `todo`
Define shared workspace state model.

Deliverables:

- current filters state;
- current map bounds state;
- current selection state;
- loading and error states.

Acceptance:

- map and list can read from one shared search state;
- no duplicate filter logic in separate components.

### BM-003 `P0` `todo`
Connect workspace to live listing results.

Deliverables:

- reuse existing unified listing search hook/layer;
- provider-aware normalized response handling.

Acceptance:

- workspace can render real listings;
- detail routes open correctly from results.

## Epic B. Map Experience

### BM-010 `P1` `todo`
Embed map panel into search workspace.

Deliverables:

- map on the right side of split layout;
- default center logic;
- marker rendering from live results.

Acceptance:

- markers display for results with coordinates;
- map renders without breaking list experience.

### BM-011 `P1` `todo`
Synchronize marker and card selection.

Deliverables:

- click marker highlights list card;
- click list card highlights marker.

Acceptance:

- one selected listing state is shared across map and list.

### BM-012 `P1` `todo`
Open listing preview drawer/card from map selection.

Deliverables:

- preview image;
- price;
- district;
- provider;
- CTAs.

Acceptance:

- preview supports `Open details`, `Save`, `Start application`.

### BM-013 `P2` `todo`
Add map-bounds-driven search refresh.

Acceptance:

- results can rerun based on visible map bounds;
- no excessive rerender/request loop.

## Epic C. Saved Searches

### BM-020 `P0` `todo`
Define saved search schema.

Deliverables:

- table/entity design;
- normalized intent payload;
- filter payload structure.

Acceptance:

- can store search name, filters, locations, map state.

### BM-021 `P1` `todo`
Implement saved search CRUD.

Deliverables:

- create;
- rename/update;
- delete;
- load last/current.

Acceptance:

- user can save and reopen search presets from the workspace.

### BM-022 `P1` `todo`
Add saved search sidebar/rail.

Acceptance:

- user can switch between saved searches without losing state unexpectedly.

## Epic D. AI Search Intent

### BM-030 `P0` `todo`
Define AI intent contract.

Deliverables:

- exact request schema;
- exact response schema;
- ambiguity rules.

Acceptance:

- AI returns structured filter object, not raw prose only.

### BM-031 `P1` `todo`
Build `AiSearchIntentForm`.

Deliverables:

- natural-language input;
- language-aware UX;
- loading/error states;
- structured preview of parsed intent.

Acceptance:

- user can type free text and review extracted filters before applying.

### BM-032 `P1` `todo`
Feed profile context into AI search parse.

Deliverables:

- profile language;
- city;
- household;
- move-in;
- budget;
- districts.

Acceptance:

- AI parse improves based on existing user profile.

### BM-033 `P1` `todo`
Apply AI intent to deterministic search state.

Acceptance:

- parsed output updates filters and reruns search;
- user can still manually edit any parsed field.

## Epic E. Onboarding Bridge

### BM-040 `P1` `todo`
Route post-onboarding users into AI search setup.

Acceptance:

- first-time user after profile completion gets a guided search setup flow.

### BM-041 `P1` `todo`
Preseed first saved search from onboarding/profile data.

Acceptance:

- user does not start from an empty map if enough profile data exists.

### BM-042 `P2` `todo`
Add dashboard shortcuts into saved searches.

Acceptance:

- dashboard can show “resume your search” cards.

## Epic F. Favorites And Applications Integration

### BM-050 `P0` `todo`
Ensure map/list previews can create draft applications.

Acceptance:

- user can start application from workspace without entering detail page first.

### BM-051 `P0` `todo`
Ensure map/list previews can save favorites.

Acceptance:

- favorite state updates instantly from workspace.

### BM-052 `P1` `todo`
Persist listing snapshot fields needed for multi-source draft continuity.

Acceptance:

- application drafts survive provider context and can reopen exact detail pages.

## Epic G. Data And API Hardening

### BM-060 `P0` `todo`
Add backend/API surface for saved search entities.

Acceptance:

- frontend does not rely on ad hoc local-only state for saved searches.

### BM-061 `P1` `todo`
Normalize Germany location handling for AI and provider search.

Deliverables:

- city/district normalization;
- provider geocode mapping contract.

Acceptance:

- AI location output can be translated into real provider search params.

### BM-062 `P2` `todo`
Add search analytics / debug events.

Acceptance:

- we can inspect AI query text, parsed intent and result count.

## Epic H. QA And UX Hardening

### BM-070 `P1` `todo`
Design empty states for no results / low profile confidence.

Acceptance:

- user always has a meaningful next action.

### BM-071 `P1` `todo`
Test mobile and tablet search workspace behavior.

Acceptance:

- no broken layout between list and map transitions.

### BM-072 `P2` `todo`
Improve performance for large listing sets.

Acceptance:

- map/list interaction remains usable with dense results.

## Suggested Delivery Order

1. `BM-001`
2. `BM-002`
3. `BM-003`
4. `BM-010`
5. `BM-011`
6. `BM-012`
7. `BM-020`
8. `BM-021`
9. `BM-030`
10. `BM-031`
11. `BM-032`
12. `BM-033`
13. `BM-040`
14. `BM-050`
15. `BM-051`
16. `BM-052`

## Recommended First Sprint

Goal:

- a user can complete onboarding, enter a real search workspace, see live listings on map + list, save/favorite, and create application drafts.

Tickets:

- `BM-001`
- `BM-002`
- `BM-003`
- `BM-010`
- `BM-011`
- `BM-012`
- `BM-050`
- `BM-051`

## Recommended Second Sprint

Goal:

- add saved searches and AI refinement in a controlled way.

Tickets:

- `BM-020`
- `BM-021`
- `BM-022`
- `BM-030`
- `BM-031`
- `BM-032`
- `BM-033`
- `BM-040`
