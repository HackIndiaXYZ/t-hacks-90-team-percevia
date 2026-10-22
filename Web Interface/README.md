# SAHAYAK dashboard

React and TypeScript frontend built with Vite. The complete application setup is in [docs/SETUP.md](../docs/SETUP.md).

## Local development

Start the Python backend from the repository root with `python sahayak_cloud/server.py`. Then run:

```powershell
cd "Web Interface"
npm ci
npm run dev
```

Vite serves the dashboard at http://127.0.0.1:8080 and proxies `/api` and `/upload` to the backend on port 5000.

## Build and checks

```powershell
npx tsc -p tsconfig.app.json --noEmit
node --test tests/browser-audio.test.cjs
npm run build
```

The static output is `dist/`. The Python backend can serve these files locally. For cloud hosting, Vercel serves the frontend and forwards `/api` to the private application's HTTPS backend. See [deploy/CLOUD.md](../deploy/CLOUD.md).

## Location card

Browser geolocation starts only after the user selects **Enable live location** and grants browser permission. It refreshes every three minutes while the page is active. Navigation opens Google Maps for the displayed coordinates. These coordinates describe the browser device, not an ESP32 GPS sensor.

To configure an optional starting pin, copy `.env.example` to `.env.local` and set its two coordinate variables. Keep personal coordinates out of Git. Vite embeds `VITE_` values in the public build, so this file is not a place for API keys or secrets. Blank values leave location unset until the browser obtains a position.

## Data and credentials

Camera inference, persistent memories, enrolled face samples, Gemini credentials and Telegram credentials stay in the backend. Do not put provider tokens or passwords in frontend source or Vite variables. Runtime data and deployment account metadata are excluded from source control.
