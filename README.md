# Steval workspace

Steval financial evaluation, Swing quality and Risk management, plus the redesigned Confluence setup analyzer as a tab.

```sh
npm ci
npm test
npm run lint
npm run build
```

Build outputs `public/index.html` and `public/confluence/`. Root `api/` remains Vercel Functions; it is not copied into public. `vercel.json` specifies the install/build/output contract. `confluence/` is a private React/Vite npm workspace; `/confluence/` also opens the analyzer directly. Root package intentionally does not set `type:module`, preserving existing API module handling.

Confluence's engine, schema and history logic were imported unchanged from Ronin1351/Confluence commit e96aef5. The root integration tests guard their normalized source hashes. The presentation uses the approved white/navy/cobalt design and retains all remediation behavior. All its inputs are manual; the tab does not imply automatic market-data transfer from Steval.

Confluence runs in a same-origin titled iframe to isolate CSS and global state from legacy Steval scripts. Worksheet values survive switching tabs while the page remains open. Saved setups use browser localStorage on the current deployment origin; history from the separate Confluence hostname is not automatically migrated. Clear inputs resets only the worksheet, not history. HTML export of Steval includes a link to hosted Confluence; the React app is not bundled inside that single-file export.

SEC_UA remains configured through existing Vercel environment variables; no API key is needed for public-source WACC. Existing provider behavior is unchanged.

`feat/modern-workspace` is the combined Preview branch. `main` remains the Production branch. A merge or Production promotion requires separate release authorization.
