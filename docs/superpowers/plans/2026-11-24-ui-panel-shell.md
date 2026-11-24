# UI Panel Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shared `OimPanel` shell + spacing tokens applied to Layers (card), Key (float), and chrome insets.

**Architecture:** New `elements/panel.ts` provides open/close, Esc/outside dismiss, and mutual exclusion. Layers and Key adopt the shell; chrome only consumes CSS tokens.

**Tech Stack:** TypeScript, redom, MapLibre controls, CSS custom properties, Vitest + Puppeteer.

## Global Constraints

- Preserve map-first Layers: collapsed by default; compact/tall height modes; Esc/outside close; section defaults on open.
- Card width `22rem`; float width `min(28rem, 40vw)`; compact `min(52vh, 28rem)`; tall `min(80vh, 40rem)`.
- Opening Key closes Layers and vice versa.
- No light theme, mobile drawer rewrite, URL filters, or Hide-checkbox UX changes.

---

### Task 1: OimPanel + tokens + failing tests

**Files:**
- Create: `web/src/elements/panel.ts`, `web/src/elements/panel.css`
- Modify: `web/src/index.css` (tokens + chrome insets), `web/tests/puppeteer.test.ts`

- [ ] **Step 1:** Add spacing tokens and chrome inset/hit to `:root` and control margins in `index.css`.
- [ ] **Step 2:** Implement `OimPanel` with variants `card`/`float`, `open`/`close`/`toggle`/`isOpen`, Esc/outside dismiss, and `registerPanel` mutual exclusion.
- [ ] **Step 3:** Extend Puppeteer tests for card/float classes, Key open, mutual exclusion (will fail until Tasks 2–3).
- [ ] **Step 4:** Commit.

### Task 2: Layers → card shell

**Files:**
- Modify: `web/src/unified-map-options.ts`, `web/src/index.css` (Layers sizing via `oim-panel--card`)

- [ ] **Step 1:** Wrap Layers control with `oim-panel oim-panel--card`; body uses `oim-panel-body`; register with panel registry; call `notifyPanelOpened('layers')` on open.
- [ ] **Step 2:** Apply roomier row/section padding via tokens; card width/height per spec.
- [ ] **Step 3:** Commit.

### Task 3: Key → float shell

**Files:**
- Modify: `web/src/key/key.ts`, `web/src/key/key.css`

- [ ] **Step 1:** Rebuild Key panel with `OimPanel` float (title, close, body); position near trigger; register mutual exclusion.
- [ ] **Step 2:** Fix legend row padding (~32px rows, token horizontal pad).
- [ ] **Step 3:** Run `npm run test:e2e`; fix until green; commit.

### Task 4: Chrome polish + ship

**Files:**
- Modify: `web/src/search/search.css`, `web/src/edit-control.css` if needed

- [ ] **Step 1:** Align search/edit hit targets and margins with `--oim-ctrl-inset` / `--oim-hit`.
- [ ] **Step 2:** Push branch and open/update PR.
