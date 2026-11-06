# Seclusa Convert

A private unit converter. Runs entirely on this device: conversions happen in
the browser, last-used units are stored locally, and nothing you type is sent
anywhere. Works offline once it has loaded.

## What it does

- Version 0.1.4
- Convert length, mass, temperature, volume, area, speed, time, pressure, energy, data, and angle.
- Swap units, copy the result.
- Remembers the last category, units, and value on this device.
- Theme sheet: System / Light / Dark, plus orange lines or a solid / custom background.
- Clear saved data, from the theme sheet, removes the saved conversion and theme choices on this device.

## Usage

Open `index.html` (or serve the folder), pick a category, type a value. To add
it to your home screen, open your browser's menu and choose "Add to Home Screen".

## Privacy

- No accounts, tracking, analytics, ads, or third-party scripts.
- `connect-src 'none'` in the content security policy: the page cannot make
  network calls. The service worker only downloads this app's own files so it
  can run offline. The value you type is not uploaded.
- Data stays in local storage on this device. Clear it from the theme sheet.

## Host headers

`_headers` and `.htaccess` are for hosts that can set response headers
(Cloudflare Pages, Netlify, Apache). They send the clickjacking and
content-type headers a page cannot set on its own. GitHub Pages ignores both
files. The header `connect-src` is `'self'` so the service worker can refresh
its own files; the page policy stays `'none'`, and the stricter one wins.

## Files

- `index.html` — the app shell
- `manifest.json` — PWA manifest
- `sw.js` — service worker (offline-first)
- `_headers`, `.htaccess` — optional host headers (not used by GitHub Pages)
- `static/` — styles, scripts, icons
- `test/logic.test.mjs` — node --test tests for the pure logic

## Running the tests

```
node --test test/
```

## License

GPL-3.0. See [LICENSE](LICENSE).
