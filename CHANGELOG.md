# Changelog

## [Unreleased]

## [0.1.6] - 2026-11-15

- Two layouts only: Instrument (dark readout) and Dual (stacked From / To cards). No System mode, no background colours.
- Instrument UI polish: monospace readout, rounded panel, short landscape fit with footer at the bottom.
- Theme switch refreshes the result unit suffix; layout chips use a radiogroup.
- Data sizes use 1024 (1 GB = 1024 MB). Separate KiB/MiB labels removed as duplicates.
- Offline shell defaults match Instrument. Service worker cache is 0.1.6.

## [0.1.5] - 2026-11-14

- iOS home-screen status bar uses `black` (opaque) instead of the translucent default.

## [0.1.4] - 2026-11-06

- A single decimal point stays a decimal (`1.234` is 1.234, not 1234).
- Grouped numbers keep a scientific exponent (`1,234e2`).
- Huge results use compact notation. Knot and km/h use exact factors.
- Saved values are length-capped, and oversized storage is dropped.
- Offline visits with an extra query string open the cached app.
- Theme sheet can clear data stored on this device. Tab stays inside the sheet, and the sheet is inert while closed.
- Category chips wrap so every category is on screen.
- Script HTML sinks are gone, and CSP asks for Trusted Types.
- Sample `_headers` and `.htaccess` for hosts that can send framing headers.
- Service worker cache is 0.1.4, so the previous cache is dropped.

## [0.1.3] - 2026-11-04

- Portable PWA identity: relative `start_url`/`scope`, unique `id` query (`?app=seclusa-convert`).
- Locale-aware number parsing (US / European grouping).
- Null-safe boot wiring; service worker failures warn and toast.
- Tests for parse grouping, normalizeState, and swap round-trip.

## [0.1.2] - 2026-11-04

- Fix PWA install on GitHub Pages: unique manifest `id` / `start_url` / `scope` under `/unit-convert/`, drop SVG from install icons (keep favicon link).

## [0.1.1] - 2026-11-04

- First apps-folder release.
- Theme bottom sheet: System / Light / Dark, background swatches, custom hex.
- Footer: GPL-3.0 · Made with ❤️ 🇬🇧.
- App icons (⇄ mark) for PWA install.
- Length, mass, temperature, volume, area, speed, time, pressure, energy, data, angle.
