# pwa

## Purpose

Define progressive web app behavior for DragonJobs, including the web app manifest, service worker registration, static asset caching, and auto-update semantics via vite-plugin-pwa.

## Requirements

### Requirement: Web app manifest identifies the application
The system SHALL expose a PWA manifest describing DragonJobs install metadata and theme colors.

#### Scenario: Manifest metadata
- **WHEN** the production or development build is served
- **THEN** the manifest includes name "DragonJobs", short name "DragonJobs", description "Developer job board — built for developers", theme color #8B0000, background color #111111, display standalone, and start URL `/`

#### Scenario: Manifest icons
- **WHEN** the manifest is generated
- **THEN** it includes 192x192 and 512x512 PNG icons, with the 512x512 icon also marked maskable

### Requirement: Service worker registers with auto-update
The system SHALL register a service worker that auto-updates when new static assets are available.

#### Scenario: Auto-update registration
- **WHEN** the application is built or run in development with PWA dev options enabled
- **THEN** vite-plugin-pwa registers the service worker with `registerType: 'autoUpdate'`

### Requirement: Static assets are cached for offline use
The service worker SHALL precache built static assets matching configured glob patterns.

#### Scenario: Workbox glob patterns
- **WHEN** the service worker is generated at build time
- **THEN** it caches files matching `**/*.{js,css,html,ico,png,svg,woff2}`

### Requirement: Service worker is enabled in development
The PWA plugin SHALL enable service worker generation during local development.

#### Scenario: Dev server PWA
- **WHEN** the developer runs `npm run dev`
- **THEN** vite-plugin-pwa dev options enable the service worker in the dev server
