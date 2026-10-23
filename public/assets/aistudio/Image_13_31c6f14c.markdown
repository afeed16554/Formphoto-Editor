---
name: FormPhoto Expressive Studio
colors:
  surface: '#faf8fd'
  surface-dim: '#dbd9de'
  surface-bright: '#faf8fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f7'
  surface-container: '#efedf2'
  surface-container-high: '#e9e7ec'
  surface-container-highest: '#e3e2e6'
  on-surface: '#1b1b1f'
  on-surface-variant: '#444655'
  inverse-surface: '#303034'
  inverse-on-surface: '#f2f0f4'
  outline: '#747687'
  outline-variant: '#c4c5d8'
  surface-tint: '#254be7'
  primary: '#0f3edc'
  on-primary: '#ffffff'
  primary-container: '#385bf5'
  on-primary-container: '#ededff'
  inverse-primary: '#b9c3ff'
  secondary: '#00677d'
  on-secondary: '#ffffff'
  secondary-container: '#50d9fe'
  on-secondary-container: '#005c70'
  tertiary: '#774a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#986000'
  on-tertiary-container: '#ffecd9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001158'
  on-primary-fixed-variant: '#0032c3'
  secondary-fixed: '#b3ebff'
  secondary-fixed-dim: '#4cd6fb'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5f'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8fd'
  on-background: '#1b1b1f'
  surface-variant: '#e3e2e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 57px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.25px
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 45px
    fontWeight: '700'
    lineHeight: 52px
  display-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.15px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.4px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.5px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies the playful precision, kinetic clarity, and tactile warmth of Google Material 3 Expressive. Built for high-velocity creative photography workflows, batch editing, and digital passport/ID rendering, the visual language balances utilitarian utility with joyful, rounded aesthetics.

### Aesthetic Attributes
- **Playful Rigor:** Structural geometry governed strictly by standard M3 token intervals, softened by high-curvature corners, buoyant pill shapes, and squircle containers.
- **Physical Responsiveness:** Tactile interaction states using layered tonal depth, expressive elevation leaps, and vibrant chromatic feedback rather than cold skeuomorphism.
- **Visual Weight:** Surfaces use fluid contrast shifts with distinct container tiers, accented by floating navigation docks, floating action buttons (FABs), and high-visibility status indicators.

## Colors

The palette employs a high-chroma primary anchor coupled with tonal surface containment tiers calibrated for dense image manipulation tools and photo previews.

### Color Roles & Dynamic Range
- **Primary (`#385bf5` / `#4f6ef7`):** Electric Indigo drives definitive actions, active selection boundaries, and hero component states.
- **Secondary (`#00b4d8`):** Vivid Cyan handles auxiliary utility states, filter switches, batch progress trackers, and crop framing indicators.
- **Tertiary (`#f59e0b`):** Warm Amber commands warnings, photo compliance notices, aspect-ratio mismatch badges, and non-destructive action prompts.
- **Surface Elevation Hierarchy:**
  - `surface-container-lowest`: Absolute canvas base `#ffffff` (light) / `#0f111a` (dark).
  - `surface-container-low`: Main workspace background `#f5f6fc` / `#161926`.
  - `surface-container`: Standard card level `#eff1f9` / `#1c2033`.
  - `surface-container-high`: Interactive cards, flyout drawers `#e8eaf4` / `#232840`.
  - `surface-container-highest`: Modal sheets, popovers, and elevated pill toolbars `#e0e3ed` / `#2b314d`.

## Typography

The type scale leverages **Plus Jakarta Sans** across all roles to achieve the characteristic Material 3 Expressive blend of structural geometric geometry and approachable, humanistic curves. 

Display and headline styles carry tighter tracking and robust weights (`600` and `700`) to provide high personality in photo studio headers, export summaries, and studio dashboards. Small UI controls rely on `label-*` tokens featuring increased letter-spacing (`0.1px` to `0.5px`) for legibility on compact camera adjustment sliders, aperture toggles, and metadata readouts.

## Layout & Spacing

The structural layout relies on an adaptive fluid grid anchored by Material 3 baseline increments.

- **Mobile (<600px):** 4-column layout with 16px margins and 16px gutters. Compact vertical toolbars compress into bottom floating sheets and bottom pill bars.
- **Tablet (600px - 1024px):** 8-column layout with 24px margins and 24px gutters. Secondary inspection panels tuck into sliding side sheets.
- **Desktop (>1024px):** 12-column layout with 32px to 48px margins and 24px gutters. Workspaces permit side-by-side editing canvas, studio lighting dials, and batch photo queues.
- **Rhythm Rules:** All layout offsets, internal component paddings, and stack gaps adhere strictly to the `4px` / `8px` spacing continuum defined through `space-*` tokens.

## Elevation & Depth

Visual hierarchy uses Material 3 surface tinting compounded with soft, directional chromatic blurs.

- **Level 0 (Flat):** Zero shadow offset. Color is defined by `surface-container-lowest` or `surface-container-low`. Used for backdrops, non-interactive photo workspaces, and viewports.
- **Level 1 (Subtle Rest):** `0 2px 8px -2px rgba(56, 91, 245, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)`. Applied to resting cards, segment controls, and list containers.
- **Level 2 (Elevated):** `0 4px 16px -4px rgba(56, 91, 245, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.06)`. Applied to hover states, dropdown menus, and standard FABs.
- **Level 3 (Floating Docks & Sheets):** `0 8px 24px -4px rgba(56, 91, 245, 0.14), 0 4px 12px -2px rgba(0, 0, 0, 0.08)`. Applied to floating pill navigation bars, batch floating action bars, and modal dialogs.
- **Dynamic Glow:** Focused states and active dragging layers pick up an ambient primary glow: `0 0 0 3px rgba(56, 91, 245, 0.25)`.

## Shapes

The shape scale executes the expressive, ultra-rounded Material 3 aesthetic:

- **Full Pill (`9999px`):** Used universally for primary buttons, input search bars, segmented control tracks, floating indicator chips, and interactive FABs.
- **Extra Large (`24px` to `28px`):** Reserved for photo viewports, studio property cards, preview containers, and modal dialogs.
- **Large (`16px`):** Standard for tool property panels, dropdown flyouts, and list grouping containers.
- **Medium (`12px`):** Applied to internal image thumbnails, color swatches, and metadata tags.

## Components

### Buttons & Floating Action Buttons
- **Primary Buttons:** Fully pill-shaped (`9999px`), background in Primary (`#385bf5`), text in crisp white with `label-lg` styling. Vertical padding `12px`, horizontal padding `24px`.
- **Tonal Buttons:** Soft Lilac / Radiant Periwinkle background (`#e0e7ff`), text in Primary Indigo.
- **Expressive FABs:** Rounded squircle (`24px` radius) or extended pill shape. Resting at Level 2 elevation, escalating to Level 3 on hover with tactile spring scaling (`scale: 1.03`).

### Segmented Controls & Pill Bars
- Enclosed within a `surface-container-high` background pill track with `4px` internal padding. Active segment transitions with an animated sliding white pill container resting at Level 1 elevation with primary colored text.

### Chips & Filter Pills
- Heights fixed at `32px` with full pill curvature (`9999px`).
- Filter chips display dynamic checkmarks that morph smoothly. Selected state applies Primary Container tone with an Indigo border stroke (`1px`).

### Cards & Studio Workspaces
- **Tonal Cards:** Built with `24px` corner radii and `surface-container` background fill. Borderless in light mode; subtle low-contrast `1px` translucent outline (`rgba(255, 255, 255, 0.08)`) in dark mode.
- **Photo Processing Canvas:** Deep `surface-container-lowest` well with an inner border radius of `20px` and inset clipping.

### Input Fields & Sliders
- **Text Inputs:** Outlined pill variants or soft-filled pill containers (`surface-container-high`) with `16px` horizontal padding. Focus shifts outline to `2px` Primary with an ambient cobalt focus ring.
- **Continuous Sliders (Exposure, Contrast, Hue):** Chunky tactile track (`8px` height) with a prominent circular thumb (`20px`) that displays a numeric value bubble on drag.

### Checkboxes & Switches
- **Switches:** Pill track (`32px` height, `52px` width) housing an oversized thumb (`24px`). Unchecked thumb stays neutral; checked state inflates thumb slightly and shifts track to vibrant cobalt.
- **Checkboxes:** Smooth `6px` squircle shape with high-contrast SVG checkmark animation.