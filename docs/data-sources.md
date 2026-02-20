# Data sources and infrastructure layers

The map is built from **OpenStreetMap** data, served as vector tiles (e.g. via Tegola) and styled in the frontend. What you can show is limited by what’s in the tile schema and OSM tagging.

## What’s already in the map

### Telecoms (layer: “Telecoms” under Pipelines & utilities)

- **Communication lines** – Cables and fibres from OSM (e.g. `man_made=communications_line`, telecoms relations). Styled as dashed lines; no distinction yet between fibre, copper, etc. in the UI.
- **Data centres** – From `man_made=datacenter` (and equivalents). Polygons and point symbols; datacenters are listed and visible when the Telecoms layer is on.
- **Exchanges / cabinets / masts** – Points for exchanges, cabinets, and masts from the telecoms source.

So **datacenters are already there**; turn on **Layers → Infrastructure → Pipelines & utilities → Telecoms** to see communication lines and datacenter footprints/symbols.

### Other infrastructure

- **Power** – Power plants (with source filters), substations, lines (with voltage filters).
- **Oil & natural gas** – Pipelines, sites, wells.
- **Other pipelines** – Non‑petroleum pipelines (e.g. industrial, chemical).
- **Water** – Water pipelines, pumping stations, treatment plants, reservoirs, etc.

## What could be added (data infrastructure, fibre, etc.)

Ideas that would make “data infrastructure” and backbone fibre more visible:

1. **Fiber / backbone vs other telecoms**  
   If the tile schema (and OSM data) expose a type or tag (e.g. `cable=fiber`, `communication=backbone`, or a `substance`/`type` field), the frontend could:
   - Filter or style **fibre/backbone** lines differently (e.g. colour or line style).
   - Optionally add a **“Backbone / fibre”** sub-layer or filter under Telecoms (similar to power plant / voltage filters).

2. **More data-infrastructure points**  
   If the backend adds more OSM point types (e.g. specific datacenter subtypes, IXPs, landing stations), the style and key can be extended to show them and list them in the key.

3. **Backend/tile changes**  
   New layers or filters require the **vector tile schema** to expose the right fields. For example:
   - A “backbone” or “fiber” layer or a `cable`/`communication` property on telecom lines.
   - Any new point layer (e.g. IXPs) would need to be defined in the Tegola (or equivalent) config and the style.

So: **data infrastructure (datacenters) is already there**. To get **backbone fibre trunks** and a clearer “data infrastructure” story, the next step is to see what the current telecoms tiles expose (e.g. in the `telecoms_communication_line` layer and its attributes) and then either add filtering/styling in the frontend or extend the tile pipeline to expose fibre/backbone and optionally more data-infra point types.
