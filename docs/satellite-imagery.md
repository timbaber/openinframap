# Satellite imagery

The map uses **ESRI World Imagery** as an optional background layer (layer switcher → Satellite).

## How up-to-date is it?

- **Same URL, latest imagery**: The tile URL (`https://server.arcgisonline.com/.../World_Imagery/MapServer/tile/...`) always serves ESRI’s current release. There is no “version” parameter; you automatically get their most recent imagery for each area.
- **Update frequency**: ESRI updates World Imagery roughly every 3–4 weeks. Updates are incremental (not global); some regions get new imagery in each release.
- **Sources**: Maxar (Vivid), plus community and agency contributions. Resolution and recency vary by location.

So you already get the most up-to-date imagery ESRI provides for this service. To see when a specific area was last updated, you’d need ESRI’s own tools (e.g. Identify in ArcGIS) or their [World Imagery Wayback](https://livingatlas.arcgis.com/wayback/) if you use it elsewhere.

## Using a different imagery provider

If you want another provider (e.g. Mapbox Satellite, your own tiles), you can change the satellite source in the frontend:

1. **Edit the style**  
   In `web/src/style/style.ts`, the `sources.satellite` entry defines the tile URL. Replace the `tiles` array with your provider’s URL template (e.g. `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=...`).
2. **Attribution**  
   Update the `attribution` string for the `satellite` source to match your provider’s terms.
3. **Optional: make it configurable**  
   For a build-time or runtime switch (e.g. env variable or config file), you could branch in `style.ts` and set `sources.satellite.tiles` and `attribution` from that config.

The layer ID and layer switcher label stay the same; only the tile URL and attribution need to change.
