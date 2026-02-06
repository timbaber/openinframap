# Open Infrastructure Map (Fork)

This is a fork of [Open Infrastructure Map](https://github.com/openinframap/openinframap), a map showing the world's
infrastructure from [OpenStreetMap](https://www.openstreetmap.org).

![Screenshot of OpenInfraMap with Satellite Imagery](./docs/screenshots/main.png)

## Changes from upstream

- **Satellite imagery background** -- Added ESRI World Imagery as a selectable background layer in the layer switcher, alongside the existing OpenStreetMap and Nighttime Lights options. Translations included for all 24 supported locales.
- **Docker dev environment fixes** -- Fixed database initialization (extension permissions, SQL function ordering) and service startup race conditions so `docker compose up` works reliably from a clean state.
- **Automated dev setup** -- Added `dev-setup.sh` to automate the full local development pipeline: downloading an OSM extract, importing data, creating database views, and starting all services.
- **Full local stack** -- Added `web-backend` service to Docker Compose and Vite proxy configuration so stats pages, search, and other backend routes work in local development.

> *"But wait, there's more! You get satellite imagery, a fully automated dev setup, AND a working Docker stack -- all for the low, low price of one `git clone`!"* -- Billy Mays (probably)

## Quick start

```bash
# Clone and set up (defaults to Texas OSM extract):
./dev-setup.sh

# Or use a custom Geofabrik region:
./dev-setup.sh https://download.geofabrik.de/europe/monaco-latest.osm.pbf

# Start the web frontend:
cd web && npm install && npm run dev
```

## Upstream links

- [Open Infrastructure Map](https://openinframap.org)
- [Upstream repository](https://github.com/openinframap/openinframap)
- [IRC: #osm-infrastructure](https://webchat.oftc.net/?channels=osm-infrastructure) | [Matrix](https://matrix.to/#/#osm-infrastructure:matrix.org)
- [Translations on Weblate](https://hosted.weblate.org/engage/open-infrastructure-map/)

## Development
For details on how to develop Open Infrastructure Map, see the [architecture documentation](./docs/architecture.md).
