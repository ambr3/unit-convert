# Seclusa Convert

A private unit converter. Runs entirely on this device: conversions happen in
the browser, last-used units are stored locally, and nothing is ever sent
anywhere. Works offline once it has loaded.

## What it does

- Version 0.1.3
- Convert length, mass, temperature, volume, area, speed, time, pressure, energy, data, and angle.
- Swap units, copy the result.
- Remembers the last category, units, and value on this device.
- Theme sheet: System / Light / Dark, plus orange lines or a solid / custom background.

## Usage

Open `index.html` (or serve the folder), pick a category, type a value. To add
it to your home screen, open your browser's menu and choose "Add to Home Screen".

## Privacy

- No accounts, tracking, analytics, ads, or third-party scripts.
- `connect-src 'none'` in the content security policy: the browser refuses
  network calls from the app.
- Data stays in local storage on this device.

## Files

- `index.html` — the app shell
- `manifest.json` — PWA manifest
- `sw.js` — service worker (offline-first)
- `static/` — styles, scripts, icons
- `test/logic.test.mjs` — node --test tests for the pure logic

## Running the tests

```
node --test test/
```

## License

GPL-3.0. See [LICENSE](LICENSE).
