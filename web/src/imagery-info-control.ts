import maplibregl from 'maplibre-gl'
import { t } from 'i18next'
import { el } from 'redom'

const SATELLITE_LAYER_ID = 'satellite_background'
const BLACK_MARBLE_LAYER_ID = 'black_marble'
const POLL_INTERVAL_MS = 800

type BackgroundType = 'satellite' | 'black_marble' | 'osm'

function getActiveBackground(map: maplibregl.Map): BackgroundType | null {
  if (!map.getLayer(SATELLITE_LAYER_ID) || !map.getLayer(BLACK_MARBLE_LAYER_ID)) return null
  const sat = map.getLayoutProperty(SATELLITE_LAYER_ID, 'visibility')
  const bm = map.getLayoutProperty(BLACK_MARBLE_LAYER_ID, 'visibility')
  if (sat === 'visible') return 'satellite'
  if (bm === 'visible') return 'black_marble'
  return 'osm'
}

function buildContent(type: BackgroundType): { source: string; date: string } {
  switch (type) {
    case 'satellite':
      return {
        source: t('imagery.satellite.source', 'Esri World Imagery'),
        date: t(
          'imagery.satellite.date',
          'Capture dates vary by location; imagery is updated periodically by Esri.'
        )
      }
    case 'black_marble':
      return {
        source: t('imagery.black-marble.source', 'NASA Black Marble 2024'),
        date: t('imagery.black-marble.date', 'Annual composite; see NASA for product details.')
      }
    case 'osm':
      return {
        source: t('imagery.osm.source', 'OpenStreetMap'),
        date: t('imagery.osm.date', '© OpenStreetMap contributors.')
      }
  }
}

export default class ImageryInfoControl implements maplibregl.IControl {
  _map?: maplibregl.Map
  _container!: HTMLDivElement
  _inner!: HTMLDivElement
  _sourceEl!: HTMLElement
  _dateEl!: HTMLElement
  _pollTimer: ReturnType<typeof setInterval> | null = null

  onAdd(map: maplibregl.Map): HTMLElement {
    this._map = map

    const title = el('div', t('imagery.title', 'Map imagery'), { class: 'oim-imagery-title' })
    this._sourceEl = el('div', { class: 'oim-imagery-source' })
    this._dateEl = el('div', { class: 'oim-imagery-date' })

    this._inner = el('div', title, this._sourceEl, this._dateEl, {
      class: 'oim-imagery-info-inner'
    })

    this._container = el('div', this._inner, {
      class: 'maplibregl-ctrl oim-imagery-info'
    })

    const update = () => this._update()
    map.on('style.load', update)

    this._pollTimer = setInterval(update, POLL_INTERVAL_MS)
    setTimeout(update, 100)

    return this._container
  }

  _update() {
    const map = this._map
    if (!map || !map.getStyle()) return

    const type = getActiveBackground(map)
    if (type === null) {
      this._container.classList.remove('oim-imagery-info-visible')
      return
    }

    const { source, date } = buildContent(type)
    this._sourceEl.textContent = source
    this._dateEl.textContent = date
    this._container.classList.add('oim-imagery-info-visible')
  }

  onRemove(): void {
    if (this._pollTimer) {
      clearInterval(this._pollTimer)
      this._pollTimer = null
    }
    this._map = undefined
    this._container?.remove()
  }
}
