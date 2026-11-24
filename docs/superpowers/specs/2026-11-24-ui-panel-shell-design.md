# UI panel shell & chrome spacing

## Goal

Fix cramped padding and poor flyout sizing across Open Infrastructure Map by introducing a shared panel shell and spacing tokens, then applying them to Layers, Key, and global chrome. Preserve map-first Layers behavior. Optimize for desktop map exploration: readable controls without covering the map.

## Background

Screenshots of the current UI show:

- Layers panel with flush edges, cramped section rows, and awkward open layout
- Key panel too narrow (`min-width: 220px`) with near-zero side padding on the body
- Header, search, and zoom controls tucked into corners with inconsistent insets and small hit targets

Prior work already made Layers collapse by default and use compact/tall height modes. This design keeps that behavior and rebuilds the panel chrome around a shared shell.

## Approach

Rebuild Layers and Key on a small shared **`OimPanel`** shell (not a CSS-only patch). Chrome (header, search, zoom/geolocate, imagery) consumes the same spacing tokens without a full component rewrite.

## Architecture

### New module

- `web/src/elements/panel.ts` — `OimPanel` helper (redom-based)
- `web/src/elements/panel.css` — shell layout + variants

**`OimPanel` responsibilities**

- Render a panel root with header slot + scrollable body
- Variants:
  - `card` — anchored map control panel (Layers)
  - `float` — floating panel positioned near a trigger (Key)
- Open/close API: `open()`, `close()`, `toggle()`, `isOpen`
- Optional Esc and outside-click dismiss (register while open)
- Optional close button in header
- Emit/allow a simple coordination hook so opening Key closes Layers and vice versa (single open panel)

**Not in `OimPanel`**

- Layer visibility / power filter logic (stays in `UnifiedMapOptionsControl`)
- Key legend content generation (stays in `KeyControl`)

### Spacing tokens (`:root` in `index.css`)

| Token | Value | Role |
| --- | --- | --- |
| `--oim-space-1` | `4px` | Tight gaps |
| `--oim-space-2` | `8px` | Default small gap |
| `--oim-space-3` | `12px` | Row / section padding |
| `--oim-space-4` | `16px` | Panel outer padding |
| `--oim-ctrl-inset` | `12px` | Chrome distance from viewport edges |
| `--oim-hit` | `36px` | Minimum control hit target |
| `--oim-panel-pad` | `12px 16px` | Default panel header/body padding |
| `--oim-panel-radius` | reuse `--oim-ctrl-radius` (10px) | Corner radius |
| `--oim-panel-card-width` | `22rem` | Layers open width |
| `--oim-panel-float-width` | `min(28rem, 40vw)` | Key open width |

### Layers (`card`)

- Starts **collapsed** (icon-only), map-first — unchanged
- Open: anchored top-right card at `--oim-panel-card-width`
- Heights: compact `min(52vh, 28rem)`; tall `min(80vh, 40rem)` when any power subsection (plants / substations / lines) is expanded
- Roomier section headers and rows using `--oim-space-3`
- Consistent left inset for radios/checkboxes; no flush labels
- Esc / outside click / icon close; section defaults reset on each open (existing map-first rules)
- Implemented by adapting `UnifiedMapOptionsControl` to mount content into `OimPanel` (or wrap existing DOM with the shell classes/API)

### Key (`float`)

- Trigger remains the Key icon control
- Open: floating panel width `--oim-panel-float-width`, max-height ~`min(80vh, 40rem)`
- Header: title + close, padded with `--oim-panel-pad`
- Body: scrollable; legend rows ~32px tall; label left / symbol right; horizontal padding from tokens (no `0.2em` flush edges)
- Position near the Key button; prefer open downward into free space (reuse current placement logic, updated for new size)
- Esc / outside click / × close
- Opening Key closes Layers; opening Layers closes Key

### Chrome (token consumers only)

- `header`, search control, MapLibre ctrl group margins, imagery pill: use `--oim-ctrl-inset` and `--oim-hit`
- Do not rebuild search or navigation into `OimPanel`
- Attribution stays bottom-right; no redesign of content

## Files

**Create**

- `web/src/elements/panel.ts`
- `web/src/elements/panel.css`

**Modify**

- `web/src/unified-map-options.ts` — use `OimPanel` card; keep filter/visibility behavior
- `web/src/key/key.ts` — use `OimPanel` float; keep legend builders
- `web/src/key/key.css` — thin wrappers / remove obsolete cramped rules
- `web/src/index.css` — tokens; chrome insets; Layers card sizing via shell classes
- `web/src/search/search.css` — inset / hit alignment
- `web/src/edit-control.css` — hit/inset only if needed
- `web/tests/puppeteer.test.ts` — extend coverage

**Out of scope**

- Light theme
- Mobile full-height drawer rewrite
- URL-encoded power filters
- “Hide …” checkbox UX rewrite
- Brand / typography overhaul

## Testing

Extend Puppeteer e2e:

1. Layers still collapsed on load
2. Layers open applies card shell class / expected min width behavior
3. Key open applies float shell; panel visible with comfortable width class
4. Opening Key while Layers is open closes Layers (mutual exclusion)
5. Esc closes the active panel

Keep existing page-load and map-first Layers tests green.

## Success criteria

- No flush-to-edge labels in Layers or Key
- Open Layers and Key are readable and use width/height tokens above
- Map remains primary; chrome insets consistent
- Shared tokens drive panels + chrome
- Mutual exclusion between Layers and Key works

## Risks

- `KeyControl` currently mounts the panel on `document.body` with absolute positioning; migrating to `OimPanel` must preserve z-index above the map and correct placement relative to the trigger
- MapLibre control `overflow` / flex height quirks (seen in map-first work) — card variant must keep a definite height when open so the body remains clickable
