# app-shell

## Purpose

Define the global layout, branding, and visual design system for DragonJobs, including header navigation, footer, typography, color palette, and accessible focus styling across the single-page application shell.

## Requirements

### Requirement: Header presents site branding and login entry
The system SHALL render a persistent header with the DragonJobs logo, site name, and a login link.

#### Scenario: Logo and name link home
- **WHEN** the user views any page in the app shell
- **THEN** the header shows an inline dragon logo SVG and "DragonJobs" text linking to `/`

#### Scenario: Login link in header
- **WHEN** the user views the header
- **THEN** the system provides a "login" link targeting `/login`

### Requirement: Footer displays site attribution
The system SHALL render a centered footer with project attribution text below the main content.

#### Scenario: Footer copy on home page
- **WHEN** the user views the home page
- **THEN** the footer displays "DragonJobs • Built for developers • Inspired by classic minimalist communities"

### Requirement: Dark theme and typography
The application SHALL use a dark color scheme with Inter as the primary typeface and a constrained content width.

#### Scenario: Base page styling
- **WHEN** the application loads
- **THEN** the page background is dark (#111), body text is light (#ddd), and main content is constrained to a centered container (max ~1000px)

#### Scenario: Header styling
- **WHEN** the header is rendered
- **THEN** the header uses a dark red background (#8B0000) with a darker bottom border

### Requirement: Accessible focus indicators
Interactive elements SHALL expose a visible focus outline for keyboard navigation.

#### Scenario: Focus-visible outline on interactive elements
- **WHEN** the user focuses a link, button, or input via keyboard
- **THEN** the system shows a #ff6464 focus-visible outline with offset
