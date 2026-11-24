import { el } from 'redom'
import './panel.css'

export type OimPanelVariant = 'card' | 'float'

export interface ExclusivePanelHandle {
  id: string
  close: () => void
  contains: (node: Node) => boolean
}

const exclusivePanels = new Map<string, ExclusivePanelHandle>()

/** Register a panel for mutual exclusion (opening one closes others). */
export function registerExclusivePanel(handle: ExclusivePanelHandle): () => void {
  exclusivePanels.set(handle.id, handle)
  return () => {
    if (exclusivePanels.get(handle.id) === handle) exclusivePanels.delete(handle.id)
  }
}

/** Notify that `id` opened — closes every other registered panel. */
export function notifyPanelOpened(id: string): void {
  for (const [otherId, handle] of exclusivePanels) {
    if (otherId !== id) handle.close()
  }
}

export interface OimPanelOptions {
  id: string
  variant: OimPanelVariant
  title?: string
  showClose?: boolean
  dismissOnOutside?: boolean
  dismissOnEscape?: boolean
  /** Extra nodes treated as “inside” for outside-click (e.g. trigger button). */
  excludeFromOutside?: () => HTMLElement | null | undefined
}

/**
 * Shared panel shell for Layers (card) and Key (float).
 * Callers own content inside `bodyEl`.
 */
export class OimPanel {
  readonly id: string
  readonly variant: OimPanelVariant
  readonly el: HTMLDivElement
  readonly headerEl: HTMLElement | null
  readonly bodyEl: HTMLDivElement
  readonly titleEl: HTMLElement | null

  private _open = false
  private _unregister: (() => void) | null = null
  private _excludeFromOutside?: () => HTMLElement | null | undefined
  private _dismissOnOutside: boolean
  private _dismissOnEscape: boolean

  private _onPointerDown = (e: PointerEvent) => {
    if (!this._open || !this._dismissOnOutside) return
    const target = e.target
    if (!(target instanceof Node)) return
    if (this.el.contains(target)) return
    const exclude = this._excludeFromOutside?.()
    if (exclude && exclude.contains(target)) return
    this.close()
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (!this._open || !this._dismissOnEscape) return
    if (e.key === 'Escape') {
      e.stopPropagation()
      this.close()
    }
  }

  constructor(options: OimPanelOptions) {
    this.id = options.id
    this.variant = options.variant
    this._dismissOnOutside = options.dismissOnOutside ?? true
    this._dismissOnEscape = options.dismissOnEscape ?? true
    this._excludeFromOutside = options.excludeFromOutside

    const showHeader = Boolean(options.title) || Boolean(options.showClose)
    let titleEl: HTMLElement | null = null
    let headerEl: HTMLElement | null = null

    if (showHeader) {
      titleEl = options.title ? (el('h2', options.title, { class: 'oim-panel-title' }) as HTMLElement) : null
      const closeBtn = options.showClose
        ? (el('button', '×', {
            class: 'oim-panel-close',
            type: 'button',
            'aria-label': 'Close'
          }) as HTMLButtonElement)
        : null
      if (closeBtn) closeBtn.addEventListener('click', () => this.close())
      const headerChildren = [titleEl, closeBtn].filter(Boolean) as HTMLElement[]
      headerEl = el('div', headerChildren, { class: 'oim-panel-header' }) as HTMLElement
    }

    this.titleEl = titleEl
    this.headerEl = headerEl
    this.bodyEl = el('div', { class: 'oim-panel-body' }) as HTMLDivElement

    const rootChildren = headerEl ? [headerEl, this.bodyEl] : [this.bodyEl]
    this.el = el('div', rootChildren, {
      class: `oim-panel oim-panel--${options.variant}`,
      'data-oim-panel': options.id
    }) as HTMLDivElement

    this._unregister = registerExclusivePanel({
      id: this.id,
      close: () => this.close(),
      contains: (node) => {
        if (this.el.contains(node)) return true
        const exclude = this._excludeFromOutside?.()
        return Boolean(exclude && exclude.contains(node))
      }
    })
  }

  get isOpen(): boolean {
    return this._open
  }

  open(): void {
    if (this._open) return
    this._open = true
    this.el.classList.add('oim-panel--open')
    this.el.classList.remove('oim-panel--collapsed')
    notifyPanelOpened(this.id)
    this._attachDismiss()
  }

  close(): void {
    if (!this._open) return
    this._open = false
    this.el.classList.remove('oim-panel--open')
    this._detachDismiss()
  }

  toggle(): void {
    if (this._open) this.close()
    else this.open()
  }

  /** Position a float panel near a trigger element. */
  positionNear(trigger: HTMLElement, preferredHeightVh = 80): void {
    const button = trigger.getBoundingClientRect()
    const panelHeight = (preferredHeightVh * window.innerHeight) / 100
    const spaceBelow = window.innerHeight - button.bottom
    const openDown = spaceBelow >= panelHeight || spaceBelow >= button.top
    if (openDown) {
      this.el.style.top = `${button.bottom + 8}px`
      this.el.style.bottom = 'auto'
    } else {
      this.el.style.bottom = `${window.innerHeight - button.top + 8}px`
      this.el.style.top = 'auto'
    }
    this.el.style.right = `${document.documentElement.clientWidth - button.right}px`
    this.el.style.left = 'auto'
  }

  destroy(): void {
    this.close()
    this._unregister?.()
    this._unregister = null
    this.el.remove()
  }

  private _attachDismiss(): void {
    this._detachDismiss()
    if (this._dismissOnOutside) {
      document.addEventListener('pointerdown', this._onPointerDown, true)
    }
    if (this._dismissOnEscape) {
      document.addEventListener('keydown', this._onKeyDown, true)
    }
  }

  private _detachDismiss(): void {
    document.removeEventListener('pointerdown', this._onPointerDown, true)
    document.removeEventListener('keydown', this._onKeyDown, true)
  }
}
