import maplibregl from 'maplibre-gl'
import { t } from 'i18next'
import { el } from 'redom'
import type { FilterSpecification } from 'maplibre-gl'

/** Map layer IDs that show power plants and take a source filter */
export const POWER_PLANT_LAYER_IDS = [
  'power_plant',
  'power_plant_outline',
  'power_plant_outline_underground',
  'power_plant_outline_construction',
  'power_plant_symbol'
] as const

/** Map layer IDs that show substations and take a substation-type filter */
export const SUBSTATION_LAYER_IDS = [
  'power_substation',
  'power_substation_outline',
  'power_substation_outline_underground',
  'power_substation_point',
  'power_substation_ref_label',
  'power_substation_label',
  'power_substation_label_high_zoom',
  'power_converter_point'
] as const

/** Layers that show a single source type; we toggle visibility when that source is unchecked */
const SOURCE_SPECIFIC_LAYERS: { layerId: string; sourceId: string }[] = [
  { layerId: 'power_solar_panel', sourceId: 'solar' },
  { layerId: 'power_wind_turbine', sourceId: 'wind' },
  { layerId: 'power_wind_turbine_point', sourceId: 'wind' }
]

const KNOWN_SUBSTATION_TYPES = ['transmission', 'distribution', 'traction', 'converter', 'transition']

/** Filter options: id, translation key, and data source values in the tile data */
const SOURCE_OPTIONS: { id: string; labelKey: string; dataSources: string[] }[] = [
  { id: 'solar', labelKey: 'power.source.solar', dataSources: ['solar'] },
  { id: 'wind', labelKey: 'power.source.wind', dataSources: ['wind'] },
  { id: 'coal', labelKey: 'power.source.coal', dataSources: ['coal'] },
  { id: 'gas', labelKey: 'power.source.oil-gas', dataSources: ['gas', 'oil', 'diesel'] },
  { id: 'nuclear', labelKey: 'power.source.nuclear', dataSources: ['nuclear'] },
  { id: 'hydro', labelKey: 'power.source.hydro', dataSources: ['hydro', 'tidal', 'wave'] }
]

const SUBSTATION_OPTIONS: { id: string; labelKey: string }[] = [
  { id: 'transmission', labelKey: 'filters.substation-type.transmission' },
  { id: 'distribution', labelKey: 'filters.substation-type.distribution' },
  { id: 'traction', labelKey: 'filters.substation-type.traction' },
  { id: 'converter', labelKey: 'filters.substation-type.converter' },
  { id: 'transition', labelKey: 'filters.substation-type.transition' },
  { id: 'other', labelKey: 'filters.substation-type.other' }
]

/** Power line layers (filter by voltage/rating) */
export const POWER_LINE_LAYER_IDS = [
  'power_line_case',
  'power_line_underground_1',
  'power_line_underground_2',
  'power_line_underground_3',
  'power_line_disused',
  'power_line_1',
  'power_line_2',
  'power_line_3',
  'power_line_ref',
  'power_line_label',
  'power_line_label_low_zoom'
] as const

/** Voltage band options: minKv/maxKv in kV, or special 'hvdc' / 'traction' */
const VOLTAGE_BAND_OPTIONS: {
  id: string
  labelKey: string
  minKv?: number
  maxKv?: number
}[] = [
  { id: 'v-under-10', labelKey: 'filters.voltage-band.under-10', maxKv: 10 },
  { id: 'v-10-52', labelKey: 'filters.voltage-band.10-52', minKv: 10, maxKv: 52 },
  { id: 'v-52-132', labelKey: 'filters.voltage-band.52-132', minKv: 52, maxKv: 132 },
  { id: 'v-132-220', labelKey: 'filters.voltage-band.132-220', minKv: 132, maxKv: 220 },
  { id: 'v-220-345', labelKey: 'filters.voltage-band.220-345', minKv: 220, maxKv: 345 },
  { id: 'v-345-plus', labelKey: 'filters.voltage-band.345-plus', minKv: 345 },
  { id: 'hvdc', labelKey: 'filters.voltage-band.hvdc' },
  { id: 'traction', labelKey: 'filters.voltage-band.traction' }
]

const DEFAULT_PLANT_SELECTED = new Set(SOURCE_OPTIONS.map((o) => o.id))
const DEFAULT_SUBSTATION_SELECTED = new Set(SUBSTATION_OPTIONS.map((o) => o.id))
const DEFAULT_VOLTAGE_BAND_SELECTED = new Set(VOLTAGE_BAND_OPTIONS.map((o) => o.id))

export {
  SOURCE_OPTIONS,
  SUBSTATION_OPTIONS,
  VOLTAGE_BAND_OPTIONS,
  applyPlantFilters,
  applySubstationFilters,
  applyPowerLineFilters,
  DEFAULT_PLANT_SELECTED,
  DEFAULT_SUBSTATION_SELECTED,
  DEFAULT_VOLTAGE_BAND_SELECTED
}

function buildSourceFilter(selectedDataSources: string[]): FilterSpecification | null {
  if (selectedDataSources.length === 0) return null
  return ['in', ['get', 'source'], ['literal', selectedDataSources]]
}

function buildSubstationFilter(selectedTypes: Set<string>): FilterSpecification | null {
  if (selectedTypes.size === 0) return null
  const withoutOther = [...selectedTypes].filter((id) => id !== 'other')
  const hasOther = selectedTypes.has('other')
  if (withoutOther.length === 0 && hasOther) {
    return ['!', ['in', ['coalesce', ['get', 'substation'], ''], ['literal', KNOWN_SUBSTATION_TYPES]]]
  }
  if (withoutOther.length === 0) return null
  const inSelected: FilterSpecification = ['in', ['get', 'substation'], ['literal', withoutOther]]
  if (!hasOther) return inSelected
  const otherMatch: FilterSpecification = [
    '!',
    ['in', ['coalesce', ['get', 'substation'], ''], ['literal', KNOWN_SUBSTATION_TYPES]]
  ]
  return ['any', inSelected, otherMatch]
}

const hvdcLineFilter: FilterSpecification = [
  'all',
  ['has', 'frequency'],
  ['==', ['to-number', ['get', 'frequency']], 0]
]
const tractionLineFilter: FilterSpecification = [
  'all',
  ['has', 'frequency'],
  ['!=', ['get', 'frequency'], ''],
  ['!=', ['to-number', ['get', 'frequency']], 50],
  ['!=', ['to-number', ['get', 'frequency']], 60]
]

function buildVoltageBandFilter(selectedIds: Set<string>): FilterSpecification | null {
  if (selectedIds.size === 0) return null
  const voltageExpr = ['to-number', ['coalesce', ['get', 'voltage'], 0]]
  const notHvdc: FilterSpecification = ['!', hvdcLineFilter]
  const notTraction: FilterSpecification = ['!', tractionLineFilter]
  const conditions: FilterSpecification[] = []
  if (selectedIds.has('hvdc')) conditions.push(hvdcLineFilter)
  if (selectedIds.has('traction')) conditions.push(tractionLineFilter)
  for (const opt of VOLTAGE_BAND_OPTIONS) {
    if (opt.id === 'hvdc' || opt.id === 'traction' || !selectedIds.has(opt.id)) continue
    const parts: FilterSpecification[] = [notHvdc, notTraction]
    if (opt.minKv != null) parts.push(['>=', voltageExpr, opt.minKv])
    if (opt.maxKv != null) parts.push(['<', voltageExpr, opt.maxKv])
    conditions.push(['all', ...parts])
  }
  if (conditions.length === 0) return null
  return conditions.length === 1 ? conditions[0] : (['any', ...conditions] as FilterSpecification)
}

function applyPlantFilters(
  map: maplibregl.Map,
  originalFilters: Record<string, FilterSpecification | undefined>,
  selectedIds: Set<string>
) {
  const selectedDataSources = SOURCE_OPTIONS.filter((o) => selectedIds.has(o.id)).flatMap(
    (o) => o.dataSources
  )
  const sourceFilter = buildSourceFilter(selectedDataSources)

  for (const layerId of POWER_PLANT_LAYER_IDS) {
    const layer = map.getLayer(layerId) as
      | maplibregl.SymbolLayer
      | maplibregl.FillLayer
      | maplibregl.LineLayer
      | undefined
    if (!layer) continue
    if (selectedDataSources.length === 0) {
      map.setLayoutProperty(layerId, 'visibility', 'none')
    } else {
      map.setLayoutProperty(layerId, 'visibility', 'visible')
      const base = originalFilters[layerId]
      const filter: FilterSpecification = base
        ? ['all', base, sourceFilter!]
        : (sourceFilter as FilterSpecification)
      map.setFilter(layerId, filter)
    }
  }

  for (const { layerId, sourceId } of SOURCE_SPECIFIC_LAYERS) {
    const layer = map.getLayer(layerId)
    if (!layer) continue
    const visible = selectedIds.has(sourceId)
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

function applySubstationFilters(
  map: maplibregl.Map,
  originalFilters: Record<string, FilterSpecification | undefined>,
  selectedIds: Set<string>
) {
  const substationFilter = buildSubstationFilter(selectedIds)

  for (const layerId of SUBSTATION_LAYER_IDS) {
    const layer = map.getLayer(layerId)
    if (!layer) continue
    if (!substationFilter) {
      map.setLayoutProperty(layerId, 'visibility', 'none')
    } else {
      map.setLayoutProperty(layerId, 'visibility', 'visible')
      const base = originalFilters[layerId]
      const filter: FilterSpecification = base
        ? ['all', base, substationFilter]
        : substationFilter
      map.setFilter(layerId, filter)
    }
  }
}

function applyPowerLineFilters(
  map: maplibregl.Map,
  originalFilters: Record<string, FilterSpecification | undefined>,
  selectedIds: Set<string>
) {
  const voltageFilter = buildVoltageBandFilter(selectedIds)

  for (const layerId of POWER_LINE_LAYER_IDS) {
    const layer = map.getLayer(layerId)
    if (!layer) continue
    if (!voltageFilter) {
      map.setLayoutProperty(layerId, 'visibility', 'none')
    } else {
      map.setLayoutProperty(layerId, 'visibility', 'visible')
      const base = originalFilters[layerId]
      const filter: FilterSpecification = base
        ? ['all', base, voltageFilter]
        : voltageFilter
      map.setFilter(layerId, filter)
    }
  }
}

function addSection(
  parent: HTMLElement,
  titleKey: string,
  options: { id: string; labelKey: string }[],
  selectedIds: Set<string>,
  onToggle: (id: string, checked: boolean) => void
): void {
  const sectionLabel = el('span', t(titleKey), {
    class: 'oim-plant-filter-section-label'
  })
  const header = el('button', sectionLabel, {
    class: 'maplibregl-ctrl oim-plant-filter-section-header',
    type: 'button',
    'aria-expanded': 'true'
  })
  const list = el('div', { class: 'oim-plant-filter-list' })
  for (const option of options) {
    const label = t(option.labelKey)
    const input = el('input', {
      type: 'checkbox',
      'aria-label': label
    }) as HTMLInputElement
    input.checked = selectedIds.has(option.id)
    input.addEventListener('change', () => {
      onToggle(option.id, input.checked)
    })
    const row = el('label', input, document.createTextNode(` ${label}`), {
      class: 'oim-plant-filter-row'
    })
    list.appendChild(row)
  }
  header.addEventListener('click', () => {
    list.classList.toggle('oim-plant-filter-collapsed')
    header.setAttribute('aria-expanded', String(!list.classList.contains('oim-plant-filter-collapsed')))
  })
  parent.appendChild(header)
  parent.appendChild(list)
}

export default class PowerPlantFilterControl implements maplibregl.IControl {
  _map?: maplibregl.Map
  _container!: HTMLDivElement
  _plantSelected = new Set(DEFAULT_PLANT_SELECTED)
  _substationSelected = new Set(DEFAULT_SUBSTATION_SELECTED)
  _voltageBandSelected = new Set(DEFAULT_VOLTAGE_BAND_SELECTED)
  _plantOriginalFilters: Record<string, FilterSpecification | undefined> = {}
  _substationOriginalFilters: Record<string, FilterSpecification | undefined> = {}
  _powerLineOriginalFilters: Record<string, FilterSpecification | undefined> = {}

  onAdd(map: maplibregl.Map): HTMLElement {
    this._map = map

    const run = () => {
      for (const layerId of POWER_PLANT_LAYER_IDS) {
        const layer = map.getLayer(layerId)
        if (layer && 'filter' in layer && layer.filter) {
          this._plantOriginalFilters[layerId] = layer.filter as FilterSpecification
        } else {
          this._plantOriginalFilters[layerId] = undefined
        }
      }
      for (const layerId of SUBSTATION_LAYER_IDS) {
        const layer = map.getLayer(layerId)
        if (layer && 'filter' in layer && layer.filter) {
          this._substationOriginalFilters[layerId] = layer.filter as FilterSpecification
        } else {
          this._substationOriginalFilters[layerId] = undefined
        }
      }
      for (const layerId of POWER_LINE_LAYER_IDS) {
        const layer = map.getLayer(layerId)
        if (layer && 'filter' in layer && layer.filter) {
          this._powerLineOriginalFilters[layerId] = layer.filter as FilterSpecification
        } else {
          this._powerLineOriginalFilters[layerId] = undefined
        }
      }
      applyPlantFilters(map, this._plantOriginalFilters, this._plantSelected)
      applySubstationFilters(map, this._substationOriginalFilters, this._substationSelected)
      applyPowerLineFilters(map, this._powerLineOriginalFilters, this._voltageBandSelected)
    }

    if (map.isStyleLoaded()) {
      run()
    } else {
      map.once('style.load', run)
    }

    const headerLabel = el('span', t('filters.power-filters', 'Power filters'), {
      class: 'oim-plant-filter-header-label'
    })
    const header = el('button', headerLabel, {
      class: 'maplibregl-ctrl oim-plant-filter-header',
      type: 'button',
      'aria-expanded': 'true'
    })
    const body = el('div', { class: 'oim-plant-filter-body' })

    addSection(body, 'filters.power-plants', SOURCE_OPTIONS, this._plantSelected, (id, checked) => {
      if (checked) this._plantSelected.add(id)
      else this._plantSelected.delete(id)
      if (this._map) applyPlantFilters(this._map, this._plantOriginalFilters, this._plantSelected)
    })

    addSection(body, 'filters.substations', SUBSTATION_OPTIONS, this._substationSelected, (id, checked) => {
      if (checked) this._substationSelected.add(id)
      else this._substationSelected.delete(id)
      if (this._map)
        applySubstationFilters(this._map, this._substationOriginalFilters, this._substationSelected)
    })

    addSection(
      body,
      'filters.power-lines',
      VOLTAGE_BAND_OPTIONS,
      this._voltageBandSelected,
      (id, checked) => {
        if (checked) this._voltageBandSelected.add(id)
        else this._voltageBandSelected.delete(id)
        if (this._map)
          applyPowerLineFilters(this._map, this._powerLineOriginalFilters, this._voltageBandSelected)
      }
    )

    header.addEventListener('click', () => {
      const expanded = body.classList.toggle('oim-plant-filter-collapsed')
      header.setAttribute('aria-expanded', String(!expanded))
    })

    this._container = el('div', header, body, {
      class: 'maplibregl-ctrl maplibregl-ctrl-group oim-plant-filter'
    })
    return this._container
  }

  onRemove(): void {
    this._map = undefined
    this._container?.remove()
  }
}
