import maplibregl from 'maplibre-gl'
import { t } from 'i18next'
import { mount } from 'redom'

import { URLHash } from '@russss/maplibregl-layer-switcher'

import EditButton from './edit-control.js'
import InfoPopup from './popup/infopopup.js'
import KeyControl from './key/key.js'
import UnifiedMapOptionsControl from './unified-map-options.js'
import ImageryInfoControl from './imagery-info-control.js'
import WarningBox from './warning-box/warning-box.js'
import OIMSearch from './search/search.ts'

import { getStyle, getLayers } from './style/style.js'

import { ValidationErrorPopup } from './popup/validation-error-popup.js'
import { SymbolLoader } from './symbol-loader.ts'
import { ClickRouter } from './click-router.js'

export default class OpenInfraMap {
  map?: maplibregl.Map

  isWebglSupported() {
    if (window.WebGLRenderingContext) {
      const canvas = document.createElement('canvas')
      try {
        const context =
          canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
          canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
        if (context && typeof context.getParameter == 'function') {
          return true
        }
      } catch {
        // WebGL is supported, but disabled
      }
      return false
    }
    // WebGL not supported
    return false
  }

  constructor() {
    if (!this.isWebglSupported()) {
      const infobox = new WarningBox(t('warning', 'Warning'))
      infobox.update(t('warnings.webgl'))
      mount(document.body, infobox)
    }

    maplibregl.setRTLTextPlugin(
      'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
      true // Lazy load the plugin
    )
  }

  init() {
    const unified_map_options = new UnifiedMapOptionsControl()
    const url_hash = new URLHash(unified_map_options as Parameters<typeof URLHash>[0])

    const map_style = getStyle()

    unified_map_options.setInitialVisibility(map_style)

    const map = new maplibregl.Map(
      url_hash.init({
        container: 'map',
        style: map_style,
        maxZoom: 20,
        zoom: 2,
        center: [12, 26],
        localIdeographFontFamily: "'Apple LiSung', 'Noto Sans', 'Noto Sans CJK SC', sans-serif",
        attributionControl: { compact: true }
      })
    )

    const clickRouter = new ClickRouter(map, map_style.layers)
    new SymbolLoader(map)

    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()

    url_hash.enable(map)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    )

    map.addControl(new maplibregl.ScaleControl({}), 'bottom-left')
    map.addControl(new ImageryInfoControl(), 'bottom-left')

    map.addControl(unified_map_options, 'top-right')
    map.addControl(new KeyControl(), 'top-right')
    map.addControl(new EditButton(), 'bottom-right')
    map.addControl(new OIMSearch(), 'top-left')
    new InfoPopup(
      getLayers().map((layer: { [x: string]: any }) => layer['id']),
      6
    ).add(map, clickRouter)
    new ValidationErrorPopup(map, clickRouter)

    clickRouter.register()
    this.map = map
  }
}
