# RequestLab macOS DMG Wrapper

This folder contains a standalone Electron wrapper that runs the existing RequestLab UI/flow as a desktop app and builds a `.dmg` installer.

## Important

- Existing source code in `client/` and `server/` is not modified.
- Electron app starts the existing `server/app.ts` internally and loads the same UI at `http://127.0.0.1:3001`.
- PostgreSQL still needs to be available (same requirement as your current app).

## Local Run (Electron)

```bash
cd mac-dmg
npm install
npm run dev
```

## Build macOS DMG

```bash
cd mac-dmg
npm install
npm run dist:mac
```

Generated artifact:

- `mac-dmg/dist/RequestLab-1.0.0-<arch>.dmg`

## Trusted Build (Signed + Notarized)

Use this when you want recipients to install without Gatekeeper "damaged app" warnings.

### 1. Prerequisites

- Active Apple Developer Program account
- `Developer ID Application` certificate installed in your Keychain
- App-specific password for your Apple ID

Check certificate is present:

```bash
security find-identity -v -p codesigning
```

### 2. Export credentials (replace placeholders)

```bash
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCDE12345"
```

### 3. Build trusted DMG

```bash
cd mac-dmg
npm run dist:mac:trusted
```

The trusted artifact is still written to:
- `mac-dmg/dist/RequestLab-1.0.0-<arch>.dmg`

## Runtime `.env`

At launch, the wrapper creates a runtime env file here (if missing):

- `~/Library/Application Support/RequestLab/runtime/.env`

It seeds from:
1. `../server/.env` (dev mode)
2. `../server/.env.sample`
3. `../.env.sample`
4. fallback defaults in `electron/main.cjs`

Update this runtime `.env` to point to your PostgreSQL instance (for example, `DB_HOST=localhost`).
If you previously launched with older config and still get startup issues, remove this file once and relaunch so it is regenerated:

```bash
rm -f "$HOME/Library/Application Support/RequestLab/runtime/.env"
```

## Port Override

By default, the desktop wrapper uses port `3001`.
If needed, override it explicitly:

```bash
REQUESTLAB_PORT=3002 npm run dev
```
