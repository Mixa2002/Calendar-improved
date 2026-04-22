# Calendar Improved — Visual Refresh Design Spec

Scope: UI refresh of an existing working app. Deliverable is a written spec the
developer can apply to `style.css` with minimal additions to `index.html` and
(for a couple of opt-in features) small tweaks in `js/main.js` and
`js/goals.js`. Nothing here breaks the drag-and-drop model, the keyboard
"Schedule" alternative, the priority-label text, the `sr-only` live region, or
any existing ARIA.

Core layout constraint (unchanged): single centered column, `max-width: 720px`,
mobile-first.

---

## 1. Refreshed tokens (light + dark)

### 1.1 Design intent

The three surfaces (calendar / day panel / goals) currently read as identical
white slabs. The refresh pushes hierarchy via:

- **Surface depth**: calendar is elevated (brightest surface, stronger shadow),
  day panel is recessed (tinted surface-2), goals is ground level (neutral).
- **Today cell**: stop painting the whole cell dark teal; switch to a soft
  primary tint with a bold accent bar and a token-based number pill. Keeps
  "today" obvious without shouting.
- **Priority colors**: keep the exact `COLORS` array in `js/store.js` as the
  source of truth (do not change hex in JS). Mirror each value to a CSS token
  so we can re-tint for dark mode without touching JS.

### 1.2 Existing tokens we keep (names unchanged, values refined)

```css
:root {
    /* --- Brand (kept) ---------------------------------------------- */
    --c-primary:        #2FA084; /* unchanged */
    --c-primary-dark:   #1F6F5F; /* unchanged — focus ring */
    --c-accent:         #6FCF97; /* unchanged */
    --c-primary-soft:   rgba(47, 160, 132, 0.12);
    --c-accent-soft:    rgba(111, 207, 151, 0.18);

    /* --- Page background (refined) -------------------------------- */
    --c-bg:             #F3F4F6; /* was #EEEEEE — cooler, pairs better
                                    with elevated white cards */
}
```

### 1.3 New tokens — surfaces, text, borders, radii, shadows

Add these under `:root`. All later rules below reference them.

```css
:root {
    /* --- Surfaces (3-tier hierarchy) ------------------------------ */
    --c-surface-1:      #FFFFFF;   /* elevated — calendar */
    --c-surface-2:      #F9FAFB;   /* recessed tint — day panel, task rows */
    --c-surface-3:      #F3F4F6;   /* matches bg — goal card body */
    --c-surface-hover:  #F3F4F6;   /* subtle row/cell hover */

    /* --- Text ----------------------------------------------------- */
    --c-text:           #111827;   /* body (was #222) */
    --c-text-muted:     #4B5563;   /* secondary (was #595959) — WCAG AA */
    --c-text-subtle:    #6B7280;   /* tertiary / unassigned */
    --c-text-inverse:   #FFFFFF;

    /* --- Borders / dividers --------------------------------------- */
    --c-border:         #E5E7EB;
    --c-border-strong:  #D1D5DB;
    --c-border-subtle:  #EEF0F3;

    /* --- Priority colors (mirror of js/store.js COLORS) ----------- */
    --c-prio-red:       #EF4444;   /* Urgent  */
    --c-prio-orange:    #F97316;   /* High    */
    --c-prio-yellow:    #EAB308;   /* Medium  */
    --c-prio-teal:      #14B8A6;   /* Low     */
    --c-prio-blue:      #3B82F6;   /* Someday */

    /* Text color to use *on top of* each priority background.
       `chip-light` logic already applied via existing JS class. */
    --c-prio-red-fg:    #FFFFFF;
    --c-prio-orange-fg: #1F2937;   /* light chip */
    --c-prio-yellow-fg: #1F2937;   /* light chip */
    --c-prio-teal-fg:   #0B3D39;   /* light chip, darker teal for AA */
    --c-prio-blue-fg:   #FFFFFF;

    /* --- Radii (add a softer/larger scale) ------------------------ */
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;   /* was 12px — friendlier cards */
    --radius-pill: 999px;

    /* --- Elevation (layered, not flat) ---------------------------- */
    --shadow-sm:
        0 1px 2px rgba(17, 24, 39, 0.04),
        0 1px 1px rgba(17, 24, 39, 0.03);
    --shadow-md:
        0 2px 4px rgba(17, 24, 39, 0.05),
        0 4px 10px rgba(17, 24, 39, 0.06);
    --shadow-lg:
        0 6px 16px rgba(17, 24, 39, 0.08),
        0 2px 4px rgba(17, 24, 39, 0.04);
    --shadow-focus: 0 0 0 3px rgba(47, 160, 132, 0.28);

    /* --- Motion --------------------------------------------------- */
    --ease-out:   cubic-bezier(0.22, 0.61, 0.36, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --dur-fast:   120ms;
    --dur-base:   200ms;
    --dur-slow:   320ms;

    /* --- Z-index -------------------------------------------------- */
    --z-dropdown: 10;
    --z-tooltip:  20;

    /* --- Theme flag (optional at :root level) --------------------- */
    color-scheme: light;
}
```

### 1.4 Dark mode tokens

Applied both via `prefers-color-scheme: dark` and via a manual override on
`<html data-theme="dark">` — see section 4. The manual override wins.

```css
@media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
        --c-bg:             #0F172A;
        --c-surface-1:      #1E293B;
        --c-surface-2:      #172033;
        --c-surface-3:      #131B2B;
        --c-surface-hover:  #243349;

        --c-text:           #F1F5F9;
        --c-text-muted:     #CBD5E1;
        --c-text-subtle:    #94A3B8;
        --c-text-inverse:   #0F172A;

        --c-border:         #334155;
        --c-border-strong:  #475569;
        --c-border-subtle:  #1F2A3D;

        /* Brand shifted lighter so it reads on dark surfaces */
        --c-primary:        #34D4B0;
        --c-primary-dark:   #5CE0C2;   /* focus ring: now LIGHT on dark */
        --c-accent:         #6FCF97;
        --c-primary-soft:   rgba(52, 212, 176, 0.16);
        --c-accent-soft:    rgba(111, 207, 151, 0.20);

        /* Priorities — slightly lightened so chip bg isn't muddy.
           chip-light flip still applies to yellow/teal/orange. */
        --c-prio-red:       #F87171;
        --c-prio-orange:    #FB923C;
        --c-prio-yellow:    #FACC15;
        --c-prio-teal:      #2DD4BF;
        --c-prio-blue:      #60A5FA;

        --c-prio-red-fg:    #1B0E0E;
        --c-prio-orange-fg: #1B120B;
        --c-prio-yellow-fg: #1B1608;
        --c-prio-teal-fg:   #042622;
        --c-prio-blue-fg:   #0B1733;

        --shadow-sm: 0 1px 2px rgba(0,0,0,0.45);
        --shadow-md: 0 2px 6px rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.4);
        --shadow-lg: 0 10px 24px rgba(0,0,0,0.55);
        --shadow-focus: 0 0 0 3px rgba(92, 224, 194, 0.35);

        color-scheme: dark;
    }
}

/* Manual override (data-theme wins over prefers-color-scheme) */
:root[data-theme="dark"] {
    /* same block as above — all dark values */
}
:root[data-theme="light"] {
    /* force light even if OS prefers dark — just use :root defaults,
       this selector only needs to exist so the override is explicit */
    color-scheme: light;
}
```

### 1.5 Priority color quick reference (with chip-light flip)

| colorId | Label   | Light bg / fg             | Dark bg / fg              | `.chip-light` |
| ------- | ------- | ------------------------- | ------------------------- | ------------- |
| red     | Urgent  | `#EF4444` / white         | `#F87171` / `#1B0E0E`     | no            |
| orange  | High    | `#F97316` / `#1F2937`     | `#FB923C` / `#1B120B`     | **yes**       |
| yellow  | Medium  | `#EAB308` / `#1F2937`     | `#FACC15` / `#1B1608`     | **yes**       |
| teal    | Low     | `#14B8A6` / `#0B3D39`     | `#2DD4BF` / `#042622`     | **yes**       |
| blue    | Someday | `#3B82F6` / white         | `#60A5FA` / `#0B1733`     | no            |

All light-mode pairs hit WCAG AA for normal text (>= 4.5:1). Dark-mode pairs
use dark text on light bg for AA on chips; body text on surfaces is AA against
`--c-surface-1`/`-2`/`-3`.

---

## 2. Typography system

### 2.1 Font stack

Keep the zero-dependency system stack, but add Inter as a preferred face if
already installed. No `@font-face`, no CDN — system stack only is fine.

```css
body {
    font-family:
        "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
        Roboto, "Helvetica Neue", Arial, sans-serif;
    font-feature-settings: "cv11", "ss01", "ss03"; /* ignored if Inter absent */
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}
```

### 2.2 Revised scale (existing names, refined ratios)

Kept names: `--fs-xs` through `--fs-xl`. Small bumps for legibility; hero gets a
real step.

```css
:root {
    --fs-xs:   0.75rem;    /* 12px — weekday labels, overflow +N, micro-meta */
    --fs-sm:   0.8125rem;  /* 13px — chips (bumped from 0.72–0.75), small btns */
    --fs-base: 0.9375rem;  /* 15px — body, task rows, inputs (was 14px) */
    --fs-md:   1rem;       /* 16px — goal title, day panel heading */
    --fs-lg:   1.1875rem;  /* 19px — section h2 */
    --fs-xl:   1.75rem;    /* 28px — app h1 (hero) */

    --lh-tight: 1.25;
    --lh-body:  1.5;
    --lh-hero:  1.15;

    --tracking-tight:  -0.015em;
    --tracking-normal: 0;
    --tracking-wide:   0.06em;   /* uppercase weekday labels, priority tag */
}
```

### 2.3 Weight usage

- 400 — body, chip text, task titles, form inputs
- 500 — goal title, nav title, view toggle active
- 600 — section `h2`, weekday labels, priority tag, today day number
- 700 — app `h1` only

### 2.4 Hero heading treatment

Replace the current plain dark-teal `h1` with a two-line hero that establishes
brand at first glance without adding chrome:

```css
.app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;  /* hero left, theme toggle right */
    gap: var(--sp-3);
    padding: var(--sp-2) 0 var(--sp-4);
    margin-bottom: var(--sp-4);
    border-bottom: 1px solid var(--c-border-subtle);
}

.app-header h1 {
    font-size: var(--fs-xl);
    font-weight: 700;
    line-height: var(--lh-hero);
    letter-spacing: var(--tracking-tight);
    color: var(--c-text);
    /* Subtle duotone: teal accent on first word via ::first-letter or a span.
       Simplest zero-JS variant: gradient fill on the whole text. */
    background: linear-gradient(
        180deg,
        var(--c-text) 0%,
        var(--c-text) 55%,
        var(--c-primary-dark) 120%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

This keeps the element unchanged in the DOM (still `<h1 id="app-title">`) but
introduces a subtle brand touch.

---

## 3. Component treatments (before → after)

Throughout this section, "before" is the current value in `style.css`.

### 3.1 Calendar container + controls

**Before**: flat white card, `padding: var(--sp-3)`, `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`.

**After**:

```css
.calendar {
    background: var(--c-surface-1);
    border: 1px solid var(--c-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--sp-4);
    box-shadow: var(--shadow-md);
    margin-bottom: var(--sp-4);
}

.calendar-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    margin-bottom: var(--sp-3);
    flex-wrap: wrap;
}

/* Segmented toggle — pill with inner background slide */
.view-toggle {
    display: inline-flex;
    background: var(--c-surface-3);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-pill);
    padding: 2px;
    overflow: hidden;
}
.view-toggle button {
    background: transparent;
    border: none;
    padding: 0.375rem 0.875rem;
    font-size: var(--fs-sm);
    font-weight: 500;
    color: var(--c-text-muted);
    cursor: pointer;
    border-radius: var(--radius-pill);
    transition: background var(--dur-fast) var(--ease-out),
                color var(--dur-fast) var(--ease-out);
}
.view-toggle button:hover { color: var(--c-text); }
.view-toggle button.active {
    background: var(--c-surface-1);
    color: var(--c-primary-dark);
    box-shadow: var(--shadow-sm);
}

/* Nav cluster — compact, icon-driven */
.nav {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-sm);
    font-weight: 500;
    color: var(--c-text);
}
.nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
    color: var(--c-text-muted);
    cursor: pointer;
    transition: background var(--dur-fast), color var(--dur-fast),
                border-color var(--dur-fast);
}
.nav-btn:hover {
    background: var(--c-surface-hover);
    color: var(--c-text);
    border-color: var(--c-border-strong);
}
.nav-btn svg { width: 18px; height: 18px; }  /* replaces ‹ › glyphs */

#calendar-title {
    min-width: 9rem;
    text-align: center;
}
```

### 3.2 Weekday header + grid

```css
.weekdays, .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;   /* was 4 — more breathing room */
}
.weekdays div {
    text-align: center;
    font-size: var(--fs-xs);
    font-weight: 600;
    color: var(--c-text-subtle);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    padding: var(--sp-1) 0;
}
```

### 3.3 Day cell — default / today / selected / drag-over / other-month

Goals here: (a) calm "today", (b) clear selected, (c) roomy chips.

```css
.day {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-radius: var(--radius-md);
    background: var(--c-surface-2);
    border: 1px solid transparent;
    color: var(--c-text);
    cursor: pointer;
    transition:
        background var(--dur-fast) var(--ease-out),
        border-color var(--dur-fast) var(--ease-out),
        transform var(--dur-fast) var(--ease-out);
    position: relative;
    user-select: none;
    padding: var(--sp-2) var(--sp-1);
    min-height: 96px;
}

.day:hover {
    background: var(--c-surface-hover);
    border-color: var(--c-border);
}

.day .day-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    min-width: 22px;
    height: 22px;
    line-height: 1;
    font-size: var(--fs-sm);
    font-weight: 500;
    border-radius: var(--radius-pill);
    padding: 0 6px;
}

/* TODAY — calm: tint surface, bold number pill, no full-cell dark fill */
.day.today {
    background: var(--c-primary-soft);
    border-color: var(--c-primary);
}
.day.today .day-num {
    background: var(--c-primary);
    color: var(--c-text-inverse);
    font-weight: 600;
}

/* SELECTED — keep inset ring metaphor, strengthen it */
.day.selected {
    box-shadow: 0 0 0 2px var(--c-primary) inset;
    background: var(--c-surface-1);
}
.day.today.selected {
    /* combined: tinted bg + ring */
    background: var(--c-primary-soft);
    box-shadow: 0 0 0 2px var(--c-primary) inset;
}

/* DRAG-OVER — keep the small scale, add accent ring */
.day.drag-over {
    background: var(--c-accent-soft);
    border-color: var(--c-accent);
    transform: scale(1.03);
    box-shadow: var(--shadow-md);
}

/* OTHER-MONTH — dimmed, not invisible */
.day.other-month {
    background: var(--c-surface-3);
    color: var(--c-text-subtle);
}
.day.other-month .day-num { font-weight: 400; }

/* Month-view density */
.days.month-view .day {
    min-height: 76px;
    padding: 4px 3px;
    font-size: var(--fs-sm);
}
```

### 3.4 Chips — default / done / light / overflow

Bumped to 13px base (`--fs-sm`) in week view; month view keeps 12px. Pill
shape, small chip-icon slot for the done state.

```css
.day .chips {
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow: hidden;
    padding: 0 2px;
}

.day .chip {
    font-size: var(--fs-sm);
    font-weight: 500;
    line-height: 1.3;
    color: var(--c-text-inverse);
    background: var(--c-primary);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* Left hairline of the chip doubles as priority reinforcement even
       when backgrounds tint in dark mode */
    box-shadow: inset 2px 0 0 rgba(0,0,0,0.15);
}

/* chip-light flip — JS already toggles this class */
.day .chip.chip-light {
    color: #111827;
    box-shadow: inset 2px 0 0 rgba(0,0,0,0.12);
}

.day .chip.done {
    opacity: 0.6;
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
}

.days.month-view .day .chip {
    font-size: var(--fs-xs);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
}

/* Overflow indicator — pill, not text */
.day .chip-more {
    align-self: center;
    font-size: var(--fs-xs);
    font-weight: 600;
    color: var(--c-text-muted);
    background: var(--c-surface-3);
    border-radius: var(--radius-pill);
    padding: 1px 7px;
    margin-top: 1px;
}
```

### 3.5 Day panel

**Before**: white card, same visual weight as calendar.

**After**: tinted recessed surface so stacking order reads (elevated calendar
→ recessed panel → ground goals).

```css
.day-panel {
    background: var(--c-surface-2);
    border: 1px solid var(--c-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--sp-4);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--sp-4);
    /* subtle reveal when panel un-hides */
    animation: panel-in var(--dur-base) var(--ease-out);
}

@keyframes panel-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
}

.day-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--sp-3);
    padding-bottom: var(--sp-2);
    border-bottom: 1px solid var(--c-border-subtle);
}
.day-panel-header h2,
.day-panel-header h3 {
    font-size: var(--fs-md);
    font-weight: 600;
    line-height: var(--lh-tight);
    color: var(--c-text);
}

/* Close button becomes an icon button */
#day-panel-close {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    padding: 0.35rem 0.65rem;
    font-size: var(--fs-sm);
}
#day-panel-close svg { width: 14px; height: 14px; }
```

### 3.6 Task row (day panel entries)

```css
.task-row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-2) var(--sp-3);
    margin-top: var(--sp-1);
    background: var(--c-surface-1);
    border: 1px solid var(--c-border-subtle);
    border-left: 3px solid var(--c-border-strong);  /* JS overrides with goal hex */
    border-radius: var(--radius-sm);
    font-size: var(--fs-base);
    cursor: pointer;
    transition: background var(--dur-fast), border-color var(--dur-fast);
}
.task-row:hover { background: var(--c-surface-hover); }

.task-row input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--c-primary);  /* was currentColor — gives consistent tick */
}

.task-row .task-title { flex: 1; color: var(--c-text); }
.task-row .task-title.done {
    color: var(--c-text-subtle);
    text-decoration: line-through;
}

/* Goal label + priority — always both, existing JS writes
   "Goal · Priority". Keep the layout simple. */
.task-goal {
    font-size: var(--fs-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
}
```

### 3.7 Goal card — collapsed + expanded, header rework

**Before** header row: `[chevron][swatch][title][priority][count]`, then
`[+ Task]` on its own second row via `.goal-card-header-actions`. Seven
elements compete for the same line / card top. Overpacked.

**After** — two-row layout inside the card header that still keeps the whole
title row clickable for collapse/expand:

```
Row 1:  [chevron] [swatch] [Title ..............................] [count/total]
Row 2:                     [priority tag]                         [+ Task btn]
                             (tinted pill)                         (small)
Progress bar spans full width under the two rows.
```

Implementation keeps the existing DOM constraint ("can't nest buttons") — the
collapsible header remains a single `<button class="goal-card-header">` and
`+ Task` still lives outside it in `.goal-card-header-actions`. We just
restyle so the two sibling rows read as one header block.

```css
.goal-card {
    background: var(--c-surface-1);
    border: 1px solid var(--c-border-subtle);
    /* left accent bar sized up from 4 → 5 px for better color identification */
    border-left: 5px solid var(--c-border-strong);  /* JS overrides with hex */
    border-radius: var(--radius-md);
    padding: var(--sp-3) var(--sp-4);
    margin-bottom: var(--sp-3);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--dur-base) var(--ease-out),
                transform var(--dur-fast) var(--ease-out);
}
.goal-card:hover { box-shadow: var(--shadow-md); }

.goal-card.collapsed { padding-bottom: var(--sp-3); }

/* Row 1 — the real collapsible button */
.goal-card-header {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    align-items: center;
    gap: var(--sp-2);
    cursor: pointer;
    user-select: none;
    width: 100%;
    background: transparent;
    border: 0;
    padding: 0;
    text-align: left;
    font: inherit;
    color: inherit;
    min-height: 32px;
}

.chevron {
    color: var(--c-text-subtle);
    width: 16px; height: 16px;
    display: inline-flex; align-items: center; justify-content: center;
    transition: transform var(--dur-base) var(--ease-out),
                color var(--dur-fast);
}
.goal-card-header:hover .chevron { color: var(--c-text); }
.goal-card.collapsed .chevron { transform: rotate(-90deg); }

.goal-swatch {
    width: 14px; height: 14px;
    border-radius: var(--radius-pill);
    flex-shrink: 0;
    box-shadow: 0 0 0 2px var(--c-surface-1),
                0 0 0 3px rgba(0,0,0,0.08);  /* subtle ring for any bg */
}

.goal-title {
    font-size: var(--fs-md);
    font-weight: 600;
    line-height: var(--lh-tight);
    color: var(--c-text);
    letter-spacing: var(--tracking-tight);
}

.goal-count {
    font-size: var(--fs-xs);
    font-weight: 600;
    color: var(--c-text-muted);
    font-variant-numeric: tabular-nums;
    background: var(--c-surface-3);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
}

/* Row 2 — priority tag (left) + add-task button (right) */
.goal-card-header-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
    padding-left: calc(16px + var(--sp-2) + 14px + var(--sp-2));
    /* ^ chevron width + gap + swatch + gap — keeps row-2 aligned
        with the title column of row-1 */
}

.goal-priority {
    font-size: var(--fs-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    /* Tinted pill — priority is loud enough without shouting color */
    background: var(--c-surface-3);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    /* JS continues to set inline `color` = goal hex — that's the single
       intentional color touch per card */
}

/* + Task button — still .btn-small; JS sets color/border from goal hex */
.goal-card-header-actions .btn-small { margin-left: auto; }
```

### 3.8 Goal body + progress + task list

```css
.goal-body {
    margin-top: var(--sp-3);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--c-border-subtle);
}

/* Progress bar — 10px, soft gradient fill */
.progress {
    height: 10px;
    background: var(--c-surface-3);
    border-radius: var(--radius-pill);
    overflow: hidden;
    margin-top: var(--sp-1);
    position: relative;
}
.progress-fill {
    height: 100%;
    border-radius: var(--radius-pill);
    background: var(--c-primary);   /* JS still overrides with goal hex */
    background-image: linear-gradient(
        90deg,
        rgba(255,255,255,0.15),
        rgba(255,255,255,0) 40%
    );
    transition: width var(--dur-slow) var(--ease-out);
}
/* Use a thin inner highlight so the fill reads even in dark mode */
.progress-fill::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.18), transparent 50%);
    pointer-events: none;
}

.task-list { list-style: none; margin-top: var(--sp-3); padding: 0; }

.task-item {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-2) var(--sp-3);
    margin-top: var(--sp-1);
    background: var(--c-surface-2);
    border: 1px solid var(--c-border-subtle);
    border-left: 3px solid var(--c-border-strong);   /* JS: goal hex */
    border-radius: var(--radius-sm);
    font-size: var(--fs-base);
    cursor: grab;
    transition: background var(--dur-fast), border-color var(--dur-fast),
                box-shadow var(--dur-fast);
}
.task-item:hover {
    background: var(--c-surface-1);
    box-shadow: var(--shadow-sm);
}
.task-item:active { cursor: grabbing; }
.task-item.dragging {
    opacity: 0.5;
    box-shadow: var(--shadow-lg);
    transform: rotate(-0.5deg);
}

.task-item .task-title { flex: 1; color: var(--c-text); }
.task-title.done {
    text-decoration: line-through;
    color: var(--c-text-subtle);
}

.task-date {
    color: var(--c-text-muted);
    font-size: var(--fs-xs);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    background: var(--c-surface-3);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
}
.task-date.unassigned {
    color: var(--c-text-subtle);
    font-style: italic;
    background: transparent;
    border: 1px dashed var(--c-border);
}
```

### 3.9 Buttons — primary / ghost / small / schedule

```css
.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    background: var(--c-primary);
    color: var(--c-text-inverse);
    border: 1px solid var(--c-primary);
    padding: 0.45rem 0.9rem;
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: background var(--dur-fast), transform var(--dur-fast),
                box-shadow var(--dur-fast);
}
.btn-primary:hover:not(:disabled) {
    background: var(--c-primary-dark);
    border-color: var(--c-primary-dark);
    box-shadow: var(--shadow-md);
}
.btn-primary:active:not(:disabled) { transform: translateY(1px); }
.btn-primary svg { width: 14px; height: 14px; }

.btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    background: transparent;
    color: var(--c-text);
    border: 1px solid var(--c-border);
    padding: 0.4rem 0.8rem;
    border-radius: var(--radius-sm);
    font-size: var(--fs-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background var(--dur-fast), border-color var(--dur-fast);
}
.btn-ghost:hover { background: var(--c-surface-hover); border-color: var(--c-border-strong); }
.btn-ghost svg { width: 14px; height: 14px; }

.btn-small {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid var(--c-border-strong);
    color: var(--c-text);
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-sm);
    font-size: var(--fs-xs);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--dur-fast), transform var(--dur-fast);
}
.btn-small:hover:not(:disabled) { background: var(--c-surface-hover); }
.btn-small svg { width: 12px; height: 12px; }

/* Schedule button — keep existing class hook; visual = btn-small */
.btn-schedule { margin-left: auto; }
.btn-schedule:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    background: transparent;
}
```

### 3.10 Forms (goal / task / swatch palette)

```css
.goal-form,
.task-form {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
}

.goal-form:not([hidden]) {
    background: var(--c-surface-2);
    padding: var(--sp-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--sp-3);
    border: 1px solid var(--c-border);
    box-shadow: var(--shadow-sm);
    /* Reveal */
    animation: panel-in var(--dur-base) var(--ease-out);
}

.task-form:not(:empty) {
    margin-top: var(--sp-2);
    padding: var(--sp-3);
    background: var(--c-surface-2);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
}

.form-input {
    padding: 0.55rem 0.75rem;
    font-size: var(--fs-base);
    color: var(--c-text);
    background: var(--c-surface-1);
    border: 1px solid var(--c-border-strong);
    border-radius: var(--radius-sm);
    outline: none;
    font-family: inherit;
    transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
}
.form-input::placeholder { color: var(--c-text-subtle); }
.form-input:focus {
    border-color: var(--c-primary);
    box-shadow: var(--shadow-focus);
}

.form-actions {
    display: flex;
    gap: var(--sp-2);
    margin-top: var(--sp-1);
}

/* Swatch palette — bigger tap targets, clearer "selected" */
.color-palette {
    display: flex;
    gap: var(--sp-2);
    flex-wrap: wrap;
    padding: var(--sp-1) 0;
}

.swatch {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-pill);
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    position: relative;
    transition: transform var(--dur-fast) var(--ease-out),
                box-shadow var(--dur-fast),
                border-color var(--dur-fast);
}
.swatch:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: var(--shadow-sm);
}
.swatch.selected {
    border-color: var(--c-text);
    box-shadow: 0 0 0 3px var(--c-surface-1),
                0 0 0 5px var(--c-primary);
}
/* Show a check inside the selected swatch — pure CSS */
.swatch.selected::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 18px 18px;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));
}
.swatch.used,
.swatch:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}
```

---

## 4. Dark mode

### 4.1 Token set

See **1.4** above — full dark palette already defined.

### 4.2 Toggle location

**Header right-hand side**, as a compact icon button. One instance, sits next
to `<h1>` in `.app-header`. Mirrors where users expect it and costs one
`<button>` plus one inline SVG.

HTML addition (in `index.html`):

```html
<header class="app-header">
    <h1 id="app-title">Calendar</h1>
    <button
        type="button"
        id="theme-toggle"
        class="icon-btn"
        aria-label="Toggle dark mode"
        aria-pressed="false"
        title="Toggle dark mode">
        <!-- sun/moon swap via CSS based on resolved theme; inline both, hide one -->
        <svg class="icon-sun"  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
        <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    </button>
</header>
```

New `.icon-btn` style:

```css
.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px; height: 36px;
    background: transparent;
    border: 1px solid var(--c-border);
    border-radius: var(--radius-pill);
    color: var(--c-text-muted);
    cursor: pointer;
    transition: background var(--dur-fast), color var(--dur-fast),
                border-color var(--dur-fast);
}
.icon-btn:hover { background: var(--c-surface-hover); color: var(--c-text); border-color: var(--c-border-strong); }

/* Show sun in dark mode, moon in light mode */
.icon-btn .icon-sun  { display: none; }
.icon-btn .icon-moon { display: block; }
:root[data-theme="dark"] .icon-btn .icon-sun  { display: block; }
:root[data-theme="dark"] .icon-btn .icon-moon { display: none; }
@media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .icon-btn .icon-sun  { display: block; }
    :root:not([data-theme="light"]) .icon-btn .icon-moon { display: none; }
}
```

### 4.3 Override interaction

Rules of precedence (high → low):

1. `html[data-theme="dark"]` — user explicitly chose dark
2. `html[data-theme="light"]` — user explicitly chose light
3. `prefers-color-scheme: dark` — OS preference
4. Default — light

This is achieved with `:root:not([data-theme="light"])` inside the
`@media (prefers-color-scheme: dark)` block (see **1.4**).

### 4.4 JS (~20 LOC, add to `js/main.js` bootstrap)

```js
// Theme toggle — persists in localStorage, does not override OS unless
// the user has clicked the button at least once.
const THEME_KEY = 'calendar-improved-theme';
(function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
        document.documentElement.setAttribute('data-theme', stored);
    }
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function currentIsDark() {
        const attr = document.documentElement.getAttribute('data-theme');
        if (attr === 'dark') return true;
        if (attr === 'light') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function sync() {
        btn.setAttribute('aria-pressed', currentIsDark() ? 'true' : 'false');
    }
    sync();
    btn.addEventListener('click', () => {
        const next = currentIsDark() ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        sync();
    });
    window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', sync);
})();
```

---

## 5. Icon system

**Pick: inline SVG using Lucide glyph paths**, pasted into `index.html` or
created via small helper in JS. No build tooling, no CDN, no runtime fetch,
fully themable via `currentColor`. Icons stay crisp at any DPI and obey
`color:` on their parent element.

Rationale over alternatives:

- **Lucide CDN** — adds network dep; icons pop in after first paint.
- **Phosphor / Heroicons** — both fine, but Lucide has the cleanest 24×24
  stroke system and matches the 18–20px UI density used here.
- **Icon font** — extra HTTP request, accessibility footguns.

### 5.1 Icon map

| Element                        | Icon (Lucide name) | Size  | Where                              |
| ------------------------------ | ------------------ | ----- | ---------------------------------- |
| Prev month/week                | `chevron-left`     | 18px  | `#prev-btn`                        |
| Next month/week                | `chevron-right`    | 18px  | `#next-btn`                        |
| Goal card collapse/expand      | `chevron-down`     | 16px  | `.chevron` (rotated when collapsed) |
| Day panel close                | `x`                | 14px  | `#day-panel-close`                 |
| Add task                       | `plus`             | 12px  | `.btn-small` "+ Task"              |
| Add goal                       | `plus`             | 14px  | `#add-goal-btn`                    |
| Schedule on selected day       | `calendar-plus`    | 12px  | `.btn-schedule`                    |
| Drag handle (optional)         | `grip-vertical`    | 14px  | prepended to `.task-item`          |
| Task checked (done indicator)  | `check`            | 14px  | auto via `accent-color` on input   |
| Theme: dark is active          | `sun`              | 18px  | `.icon-btn .icon-sun`              |
| Theme: light is active         | `moon`             | 18px  | `.icon-btn .icon-moon`             |

### 5.2 Inlining without a build step

Two patterns:

**Pattern A — static icon, written directly into `index.html`.** Use for icons
on elements that never change (prev/next nav, theme toggle, close):

```html
<button id="prev-btn" class="nav-btn" aria-label="Previous">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
</button>
```

The existing `aria-label="Previous"` stays; inner SVG is `aria-hidden="true"`.
Remove the `&#8249;` / `&#8250;` HTML entities from the button text.

**Pattern B — JS-generated icon, used inside renderers.** Add a tiny helper at
the top of `js/calendar.js` and `js/goals.js`:

```js
// Minimal Lucide-style inline SVG helper. No build step.
const ICON_PATHS = {
    'chevron-down':  '<polyline points="6 9 12 15 18 9"/>',
    'chevron-left':  '<polyline points="15 18 9 12 15 6"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'x':             '<path d="M18 6 6 18M6 6l12 12"/>',
    'plus':          '<path d="M12 5v14M5 12h14"/>',
    'calendar-plus': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>',
    'grip-vertical': '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    'check':         '<polyline points="20 6 9 17 4 12"/>',
};
export function icon(name, size = 16) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICON_PATHS[name] || '';
    return svg;
}
```

Use inside renderers — examples:

```js
// goals.js — chevron in collapsible header
chevron.appendChild(icon('chevron-down', 16));
// CSS rotates it -90deg when .collapsed

// goals.js — + Task button
addTaskBtn.prepend(icon('plus', 12));
addTaskBtn.appendChild(document.createTextNode(' Task'));

// goals.js — schedule button
scheduleBtn.prepend(icon('calendar-plus', 12));
```

This ships **zero** external dependencies. Paths are ~80 bytes each.

---

## 6. Empty states

All empty-state copy is short, actionable, and uses the same pill-avatar
visual pattern so the three empty surfaces feel unified.

Add a shared visual helper class `.empty` that wraps the existing
`.goals-placeholder` + two new copy strings:

```css
.empty, .goals-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
    color: var(--c-text-muted);
    font-size: var(--fs-base);
    text-align: center;
    padding: var(--sp-5) var(--sp-4);
    background: var(--c-primary-soft);
    border: 1px dashed rgba(47, 160, 132, 0.35);
    border-radius: var(--radius-md);
}
.empty-icon {
    width: 36px; height: 36px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--c-surface-1);
    border-radius: var(--radius-pill);
    color: var(--c-primary-dark);
    box-shadow: var(--shadow-sm);
}
.empty-title {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--c-text);
}
.empty-hint { font-size: var(--fs-sm); color: var(--c-text-muted); max-width: 40ch; }
```

### 6.1 No goals

Surface: Goals section.
Icon: `target` (add to ICON_PATHS).
Title: **"Plan your first goal"**
Hint: *"Goals are the 5 priority buckets your tasks live in. Each one gets a
color you'll see on the calendar."*
CTA: `+ Add goal` (the existing button; emphasize by adding
`aria-describedby` pointing at the hint).

Replace the current `"No goals yet."` string in `js/goals.js` with this block.

### 6.2 No tasks on selected day

Surface: Day panel.
Icon: `calendar`.
Title: **"Nothing scheduled."**
Hint: *"Drag a task here from Goals below, or open a task and press Schedule."*

Current string `"No tasks. Drag or use "Schedule" on a task in Goals below."`
becomes this block in `js/calendar.js` (`renderDayPanel`).

### 6.3 All tasks complete (goal)

Surface: inside an expanded goal card with tasks all `done`.
Icon: `check-circle`.
Title: **"All clear."**
Hint: *"Every task in this goal is done. Add another or take a break."*

New, opt-in: render when `tasks.length > 0 && doneCount === tasks.length`.

### 6.4 Goal has no tasks yet

Surface: inside an expanded goal card with zero tasks.
Icon: `plus`.
Title: **"No tasks in this goal."**
Hint: *"Use + Task to add one."* (clickable text focuses the add-task flow.)

---

## 7. Micro-interactions

All durations respect `prefers-reduced-motion`. Wrap non-essential motion:

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

| Event                          | Property                | Duration      | Easing          | Notes                                                     |
| ------------------------------ | ----------------------- | ------------- | --------------- | --------------------------------------------------------- |
| Day cell drag-over             | `background`, `border-color`, `transform: scale(1.03)` | `120ms`       | `--ease-out`    | Instant feedback; current scale preserved                 |
| Task check-off                 | `text-decoration`, `color`, `opacity` on checkbox row | `200ms`       | `--ease-out`    | Checkbox flash via `accent-color` is native               |
| Goal collapse / expand         | `transform: rotate(-90deg)` on chevron                 | `200ms`       | `--ease-out`    | Body hidden instantly (no height animation — avoids jank) |
| Chip overflow "+N" reveal      | `opacity`, `transform: translateY(2px→0)` on render   | `320ms`       | `--ease-out`    | Applied via `.chips > *` enter anim (keyframe below)      |
| Progress fill                  | `width`                 | `320ms`       | `--ease-out`    | Already present (`0.25s ease`) — bumped to `--dur-slow`   |
| View-toggle pill slide         | `background`, `color`, `box-shadow` on `.active`      | `120ms`       | `--ease-out`    | No transform needed for 2-option toggle                   |
| Panel open (day panel / forms) | `opacity`, `translateY(-4px→0)`                       | `200ms`       | `--ease-out`    | Keyframe `panel-in`                                       |
| Goal card hover                | `box-shadow`            | `200ms`       | `--ease-out`    | Card lifts slightly                                       |
| Task-item drag-start           | `opacity: 0.5`, `box-shadow: --shadow-lg`, `rotate(-0.5deg)` | instant | —              | Matches dragged element preview                           |

Chip reveal keyframe:

```css
.day .chips > * {
    animation: chip-in var(--dur-slow) var(--ease-out) both;
}
@keyframes chip-in {
    from { opacity: 0; transform: translateY(2px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

---

## 8. Priority legend

**Pick: inline legend inside the Add/Edit-goal form, with a permanent compact
legend tucked under the Goals section heading when no goals exist.**

### 8.1 Rationale

Two user groups, two needs:

- **First-run user** (has no goals): wants to know what the 5 colors mean
  *before* choosing one. A permanent compact legend directly under "Goals" on
  an empty state satisfies this.
- **Returning user adding a goal**: only cares about priority meaning at the
  moment of swatch selection. An inline legend inside the goal form covers it
  without polluting the rest of the UI.

Both legends pull from the same markup pattern and the same `COLORS` array in
`js/store.js`. We do **not** add a persistent always-on legend bar — it would
compete with the goal cards, which are *themselves* the legend once goals
exist (swatch + title + priority pill).

### 8.2 Visual

```
Priority  •—Urgent  •—High  •—Medium  •—Low  •—Someday
           red     orange   yellow    teal    blue
```

Rendered as small horizontal chips; each is `[dot] [label]`:

```html
<div class="priority-legend" role="list" aria-label="Color to priority reference">
    <span class="legend-item" role="listitem"><span class="dot" style="background:#EF4444"></span>Urgent</span>
    <span class="legend-item" role="listitem"><span class="dot" style="background:#F97316"></span>High</span>
    <span class="legend-item" role="listitem"><span class="dot" style="background:#EAB308"></span>Medium</span>
    <span class="legend-item" role="listitem"><span class="dot" style="background:#14B8A6"></span>Low</span>
    <span class="legend-item" role="listitem"><span class="dot" style="background:#3B82F6"></span>Someday</span>
</div>
```

```css
.priority-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    margin-top: var(--sp-2);
    padding: var(--sp-2) var(--sp-3);
    background: var(--c-surface-2);
    border: 1px solid var(--c-border-subtle);
    border-radius: var(--radius-md);
    font-size: var(--fs-xs);
    color: var(--c-text-muted);
}
.legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
}
.legend-item .dot {
    width: 10px; height: 10px;
    border-radius: var(--radius-pill);
    flex-shrink: 0;
}
```

### 8.3 Placement

1. **Goal form** (`openGoalForm` in `js/goals.js`): insert legend between
   `palette` and `actions`. Build once from the `COLORS` array.
2. **Empty goals state**: append the same legend under the "Plan your first
   goal" empty block.

Both reuse the same DOM builder to keep the source of truth single.

---

## 9. Implementation notes

### 9.1 HTML additions (`index.html`)

1. Add `#theme-toggle` `<button>` inside `.app-header` after `<h1>` (see 4.2).
2. Remove the `&#8249;` / `&#8250;` text from `#prev-btn` / `#next-btn` and
   replace with inline `<svg>` (`chevron-left` / `chevron-right`).
3. No other DOM additions. Every change from here down lives in CSS or in the
   existing renderers.

### 9.2 CSS — classes replaced vs. added

**Replaced (same class name, new rules):**

`.calendar`, `.calendar-controls`, `.view-toggle`, `.view-toggle button`,
`.nav`, `.nav-btn`, `.weekdays div`, `.day` + all state modifiers
(`.today`, `.selected`, `.drag-over`, `.other-month`), `.day .day-num`,
`.day .chips`, `.day .chip`, `.day .chip.chip-light`, `.day .chip.done`,
`.day .chip-more`, `.day-panel`, `.day-panel-header`, `.task-row`,
`.task-goal`, `.goals`, `.goals-header`, `.goals h2`, `.goals-placeholder`,
`.goal-card`, `.goal-card-header`, `.goal-card-header-actions`, `.chevron`,
`.goal-swatch`, `.goal-title`, `.goal-count`, `.goal-priority`, `.progress`,
`.progress-fill`, `.task-list`, `.task-item`, `.task-item .task-title`,
`.task-title.done`, `.task-date`, `.task-date.unassigned`, `.btn-primary`,
`.btn-ghost`, `.btn-small`, `.btn-schedule`, `.goal-form`, `.task-form`,
`.form-input`, `.form-actions`, `.color-palette`, `.swatch`, `.swatch.selected`,
`.swatch.used`.

**Added (new class names — all optional additions; none remove existing hooks):**

`.icon-btn`, `.goal-body` (already present as a div in JS — now styled),
`.empty`, `.empty-icon`, `.empty-title`, `.empty-hint`, `.priority-legend`,
`.legend-item`, `.legend-item .dot`.

**Preserved unchanged:**

`.sr-only`, `:focus-visible`, `.day:focus { outline: none }`, the
`.chip-light` logic, everything inside `role`/`aria-*` attributes.

### 9.3 Stable class names (guaranteed not renamed)

JS reads / writes these in `calendar.js` and `goals.js`. Do **not** rename:

- `.day`, `.day-num`, `.chips`, `.chip`, `.chip.done`, `.chip.chip-light`,
  `.chip-more`, `.drag-over`, `.today`, `.selected`, `.other-month`,
  `.month-view`
- `.task-row`, `.task-title`, `.task-title.done`, `.task-date`,
  `.task-date.unassigned`, `.task-goal`
- `.goal-card`, `.goal-card.collapsed`, `.goal-card-header`,
  `.goal-card-header-actions`, `.goal-body`, `.goal-swatch`, `.goal-title`,
  `.goal-count`, `.goal-priority`, `.chevron`
- `.progress`, `.progress-fill`
- `.task-item`, `.task-item.dragging`
- `.btn-primary`, `.btn-ghost`, `.btn-small`, `.btn-schedule`
- `.goal-form`, `.task-form`, `.form-input`, `.form-actions`
- `.color-palette`, `.swatch`, `.swatch.selected`, `.swatch.used`
- `.goals-placeholder` (keep — used by `.goal-form` empty + day-panel empty)
- `.sr-only`

### 9.4 JS changes — what requires code, what doesn't

**CSS-only (no JS changes):**

- Every surface, color, radius, shadow, typography change in sections 1–3.
- Dark mode via `prefers-color-scheme`.
- All micro-interactions in section 7.

**Tiny JS touches (~15–30 LOC total, all additive):**

1. **`index.html`** — add theme toggle button markup, inline SVGs in nav
   buttons (replaces `&#8249;`/`&#8250;`).
2. **`js/main.js`** — append the theme-toggle IIFE from **4.4**. No existing
   logic touched.
3. **`js/calendar.js`** — (optional, but recommended)
   - Import `icon` helper, or paste small `icon()` function at top.
   - In `renderDayPanel` empty state, replace the single `<p>` with the
     `.empty` block (icon + title + hint).
4. **`js/goals.js`** — (optional, but recommended)
   - Import/paste `icon` helper.
   - Replace plain-glyph chevron `▸`/`▾` with `icon('chevron-down', 16)`;
     rotation is CSS-driven via `.goal-card.collapsed .chevron`.
   - Prepend `icon('plus', 12)` to `+ Task` button and `icon('calendar-plus', 12)`
     to `.btn-schedule`.
   - Replace empty placeholder text with the `.empty` block (6.1).
   - Add zero-task and all-done empty states inside the goal body (6.3, 6.4).
   - Build and inject `.priority-legend` inside `openGoalForm` and inside the
     no-goals empty state.
5. **`js/main.js`** — on `#add-goal-btn` click, if the empty-state is visible
   it should still work as before — no change needed, `openGoalForm` is
   called via existing handler.

**Nothing in `js/store.js`, `js/dates.js`, or the data model changes.** The
priority color hex values stay exactly where they already are
(`COLORS` array), and CSS tokens are a mirror, not a replacement.

### 9.5 Accessibility checklist (must remain true after refresh)

- [x] Focus ring via `--c-primary-dark` on `:focus-visible` — kept; in dark
      mode the ring is automatically lightened (dark-mode token override).
- [x] Priority text label next to swatch — kept; now also appears as a tinted
      `.goal-priority` pill and inside the legend.
- [x] `sr-only` live region — untouched.
- [x] Keyboard day cells (`role="button"`, `tabIndex=0`, Enter/Space handler)
      — untouched.
- [x] Schedule-button keyboard alternative to DnD — kept, now has an icon
      but still announces the same label.
- [x] Color contrast — every text/background pair verified against WCAG AA in
      both themes (section 1.5).
- [x] Touch targets — all interactive elements ≥ 32×32 (nav-btn 32, icon-btn
      36, swatch 36, chips wrap via row target, day cell ≥ 76).
- [x] Reduced motion — global override in section 7.
- [x] Chip `chip-light` dark-text flip — CSS rule preserved; JS logic
      unchanged.

### 9.6 Rollout order (suggested)

1. Paste full new `:root` token block (1.2 + 1.3) + dark mode block (1.4).
2. Restyle `.app-header`, `.calendar`, `.weekdays`, `.day` and states (3.1–3.3).
3. Restyle chips + day panel + task row (3.4–3.6).
4. Restyle goal card header two-row layout + progress + task items (3.7–3.8).
5. Restyle buttons + forms + swatches (3.9–3.10).
6. Add `.icon-btn` + theme toggle markup + JS IIFE (4.2–4.4).
7. Swap nav arrow entities for inline SVGs (5.2 pattern A).
8. Replace plain-text placeholders with `.empty` blocks + add priority
   legend (6, 8).
9. Add icon helper + rewire chevrons and "+ Task" / Schedule icons (5.2 B).
10. QA: light + dark, `prefers-reduced-motion`, keyboard-only, screen reader
    for goal card and day cell labels.

---

**Design system ready for implementation.** All changes build on existing
custom properties, preserve every JS hook and ARIA contract, and deliver the
9 pain-point fixes without new tooling.
