# Bookimmo Execution Status Report

## Purpose

This note summarizes:

- what is already implemented in the `bookimmo` client cabinet;
- what was recently added around live listing search and applications;
- what is planned next;
- what remains structurally important before launch.

It is written as a working execution report, not as a marketing summary.

## Current Product Direction

The cabinet is moving toward a unified renter workspace:

- profile-driven onboarding;
- complete Bewerbermappe / tenant dossier;
- favorites;
- live listing discovery;
- map-based browsing;
- property detail pages;
- application submission flow with AI-generated cover letter.

Important architectural constraint:

- the platform does **not** rely on a single source;
- we monitor multiple external listing sources;
- therefore listing search, detail pages and applications must be built around a **provider-aware model**, not around a single provider like ImmoScout24.

## What Is Already Implemented

## 1. Cabinet foundation

Ready or in usable shape:

- dashboard route;
- search route;
- favorites route;
- account/profile route;
- applications route;
- auth routes on Supabase.

Main shell already exists and is now being used as the real cabinet layout:

- [CabinetLayout.jsx](/Users/miguelaprossine/bookimmo/src/components/cabinet/CabinetLayout.jsx)

## 2. Profile / Bewerbermappe flow

Implemented:

- expanded profile state;
- profile completion tracking;
- document readiness tracking;
- user profile data persisted into Supabase profile/auth metadata;
- structured Bewerbermappe-style wizard.

Key files:

- [useProfile.js](/Users/miguelaprossine/bookimmo/src/hooks/useProfile.js)
- [ProfileShell.jsx](/Users/miguelaprossine/bookimmo/src/components/profile/ProfileShell.jsx)

## 3. Applications flow

Implemented:

- draft creation from listing cards;
- application state in Supabase or local fallback;
- profile/documents/cover letter/review wizard;
- submitted/draft counters;
- property-linked application experience.

Key files:

- [useApplications.js](/Users/miguelaprossine/bookimmo/src/hooks/useApplications.js)
- [ApplicationsShell.jsx](/Users/miguelaprossine/bookimmo/src/components/applications/ApplicationsShell.jsx)

## 4. AI cover letter

Implemented:

- cover letter moved to the final step of the application flow;
- magic-wand generation CTA;
- generation language driven by user profile language;
- AI generation uses context from listing + profile + application;
- current provider is Gemini via local bridge from `~/membria-ce`.

Key file:

- [generate-cover-letter.js](/Users/miguelaprossine/bookimmo/api/generate-cover-letter.js)

## 5. Live Germany search layer

Implemented:

- live search against ImmoScout mobile endpoint;
- first merged multi-source search layer with `Immowelt` added as second adapter;
- search results normalized into frontend-friendly listing objects;
- location seed/geocode layer for Germany;
- map-ready result format with `lat/lon`;
- live map panel in cabinet search;
- listing cards connected to favorites and applications.

Key files:

- [is24.js](/Users/miguelaprossine/bookimmo/api/_lib/is24.js)
- [immowelt.js](/Users/miguelaprossine/bookimmo/api/_lib/immowelt.js)
- [search.js](/Users/miguelaprossine/bookimmo/api/is24/search.js)
- [map-listings.js](/Users/miguelaprossine/bookimmo/api/is24/map-listings.js)
- [locations.js](/Users/miguelaprossine/bookimmo/api/is24/locations.js)
- [SearchMain.jsx](/Users/miguelaprossine/bookimmo/src/components/SearchMain.jsx)
- [useIs24Search.js](/Users/miguelaprossine/bookimmo/src/hooks/useIs24Search.js)
- [useIs24Locations.js](/Users/miguelaprossine/bookimmo/src/hooks/useIs24Locations.js)
- [Is24MapView.jsx](/Users/miguelaprossine/bookimmo/src/components/maps/Is24MapView.jsx)

## 6. Unified listing detail direction

Implemented in principle:

- provider-aware listing detail slug model;
- external listing detail route format;
- unified detail endpoint concept;
- live `is24` expose adapter;
- `Immowelt` detail hydration from decoded search payloads for known mapped areas;
- new detail page shell not tied to Directus-only listings.

Key files:

- [listingRouting.js](/Users/miguelaprossine/bookimmo/src/lib/listingRouting.js)
- [listing-detail.js](/Users/miguelaprossine/bookimmo/api/listing-detail.js)
- [useListingDetail.js](/Users/miguelaprossine/bookimmo/src/hooks/useListingDetail.js)
- [PropertyDetailPage.jsx](/Users/miguelaprossine/bookimmo/src/pages/PropertyDetailPage.jsx)

## 7. Backend coordinates persistence

Improved:

- listing monitor now carries `lat`, `lon`, `postcode`;
- Supabase apartment saving was extended so map data is not lost when persisting monitored listings.

Key files:

- [monitor_with_extension.py](/Users/miguelaprossine/bookimmo/backend/monitor_with_extension.py)
- [supabase_db.py](/Users/miguelaprossine/bookimmo/backend/supabase_db.py)

## What Is In Progress

## 1. Unified multi-source listing model

This is the most important architectural thread now.

Why:

- the project tracks more than one listing source;
- detail pages cannot be `is24`-specific forever;
- application drafts must survive regardless of listing source;
- search, favorites and applications need the same canonical reference model.

The target model is:

- `source`
- `external_id`
- `detail_slug`
- `source_url`
- normalized listing summary
- normalized listing detail payload

## 2. External provider adapters

Current state:

- `is24` is the first live external adapter.
- `Immowelt` is now connected as the second adapter through decoded search payloads.

Next provider explicitly identified:
- the remaining monitored providers after `is24` and `Immowelt`

After that:

- add the remaining monitored providers into the same adapter architecture.

## 3. Application-to-listing snapshot consistency

Still needs to be strengthened:

- applications currently store the property link in a lighter shape;
- we need a stronger snapshot so the exact listing detail can always reopen from:
  - search;
  - favorites;
  - application wizard;
  - submitted applications history.

## What Is Planned Next

## 1. Expand `Immowelt` from first live version to full parity

Planned work:

- expand explicit location mappings beyond the first verified `Winterhude` route;
- add reliable coordinates / map pins for `Immowelt` listings;
- widen the search index set so detail hydration is not limited to known mapped areas;
- keep the same detail page and application draft model for `source = immowelt`.

## 2. Complete canonical external listing reference model

Planned work:

- store `source`, `external_id`, `detail_slug`, `source_url` in application-related state;
- align favorites and viewed-history records with the same model;
- prepare backend schema for canonical multi-source properties.

## 3. Improve listing detail page

Planned work:

- richer gallery behavior;
- better map block;
- provider-specific metadata sections;
- source-specific CTA logic;
- cleaner fallback for partial/hidden addresses.

## 4. Expand search beyond hardcoded seed locations

Current reality:

- official ImmoScout geo autocomplete requires authenticated business API access;
- cabinet currently uses verified project geocodes plus manual code entry.

Planned work:

- better Germany location catalog;
- reusable location source layer by provider;
- later central geocoding/search dictionary for all providers.

Important note:

- `Immowelt` currently requires provider-specific location path mappings;
- `Winterhude` is the first verified mapping in code;
- this is enough to prove the adapter and unified flow, but not yet enough for full Germany coverage.

## 5. Strengthen property persistence layer

Planned work:

- move from transient live listings toward canonical `properties` + `property_locations`;
- support multi-source deduplication;
- preserve images, price, address and source metadata in a normalized DB shape.

## 6. Applications endgame

Planned work:

- submitted state should eventually map to real outbound contact flow;
- documents should move from metadata-only toward real file storage;
- cover letter + profile + documents should form a reusable submission packet;
- provider-specific send/contact automation can later attach to the same final payload.

## Known Constraints And Risks

## 1. Multi-source complexity

Risk:

- if we continue with source-specific one-offs, the cabinet will become brittle very quickly.

Decision:

- all new listing work should go through adapters and a normalized shape.

## 2. External API instability

Risk:

- mobile/web endpoints of third-party platforms can change without notice.

Mitigation:

- keep provider logic isolated per adapter;
- avoid leaking provider-specific assumptions into page components;
- maintain source URL fallback.

## 3. Search vs CMS split

Current split:

- Directus remains useful as CMS/content layer;
- external providers power live rental discovery.

Risk:

- mixing CMS property assumptions into live external listing logic.

Mitigation:

- keep Directus and external provider models separate, with a normalization boundary between them.

## 4. Build warnings

Still present:

- unresolved `_local` font asset warnings at build time;
- large JS/CSS bundle warnings.

These do not currently block development but should be cleaned before production hardening.

## Recommended Execution Order

1. Add `Immowelt` adapter into the same provider-aware listing architecture.
2. Persist canonical external listing reference fields into application/favorites state.
3. Finish unified detail page behavior for at least two providers.
4. Expand location/search dictionary for Germany.
5. Move toward canonical multi-source `properties` storage and deduplication.
6. Connect final application packet to real outbound provider/contact workflows.

## Short Conclusion

The project has already moved beyond mock cabinet work.

What is now real:

- profile state;
- application wizard;
- AI cover letter;
- live ImmoScout search;
- map view;
- unified external detail architecture start.

What matters next is not “more pages”, but finishing the multi-source data model correctly.

The next critical milestone is:

- `Immowelt` as the second adapter;
- then making search, detail, favorites and applications all use the same provider-aware listing identity.
