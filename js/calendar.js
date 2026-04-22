// ============================================================
// Calendar + day panel rendering. DOM only; no storage calls.
// ============================================================

import {
    stripTime,
    toDateKey,
    fromDateKey,
    mondayOf,
    addDays,
    sameDay,
    monthCellCount,
    MONTHS,
    MONTHS_SHORT,
} from './dates.js';

// Colors that need dark text on top for contrast (yellow, teal, orange chips).
const LIGHT_CHIP_COLOR_IDS = new Set(['yellow', 'teal', 'orange']);

// ------------------------------------------------------------------
// Minimal Lucide-style inline SVG helper. No build step, no CDN.
// Exported so goals.js can reuse the same glyph set.
// ------------------------------------------------------------------
export const ICON_PATHS = {
    'chevron-down':  '<polyline points="6 9 12 15 18 9"/>',
    'chevron-left':  '<polyline points="15 18 9 12 15 6"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'x':             '<path d="M18 6 6 18M6 6l12 12"/>',
    'plus':          '<path d="M12 5v14M5 12h14"/>',
    'calendar-plus': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>',
    'grip-vertical': '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    'check':         '<polyline points="20 6 9 17 4 12"/>',
    'check-circle':  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'calendar':      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'target':        '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
};

export function icon(name, size = 16) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
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

// Build a shared .empty block (icon + title + hint). Used for all 4 empty-state
// scenarios across the app.
export function buildEmptyBlock({ iconName, title, hint, iconSize = 18 }) {
    const wrap = document.createElement('div');
    wrap.className = 'empty';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'empty-icon';
    iconWrap.appendChild(icon(iconName, iconSize));
    wrap.appendChild(iconWrap);

    const titleEl = document.createElement('div');
    titleEl.className = 'empty-title';
    titleEl.textContent = title;
    wrap.appendChild(titleEl);

    if (hint) {
        const hintEl = document.createElement('div');
        hintEl.className = 'empty-hint';
        hintEl.textContent = hint;
        wrap.appendChild(hintEl);
    }
    return wrap;
}

export function renderCalendar(root, data, state, handlers, taskMap) {
    const { daysEl, titleEl, viewToggleEl } = root;
    daysEl.innerHTML = '';
    daysEl.classList.toggle('month-view', state.viewMode === 'month');

    const today = stripTime(new Date());

    let cells = [];
    if (state.viewMode === 'week') {
        const start = mondayOf(state.anchor);
        for (let i = 0; i < 7; i++) cells.push({ date: addDays(start, i), inMonth: true });

        const end = addDays(start, 6);
        const sameMonth = start.getMonth() === end.getMonth();
        titleEl.textContent = sameMonth
            ? `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
            : `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    } else {
        const anchor = state.anchor;
        const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const start = mondayOf(firstOfMonth);
        const total = monthCellCount(anchor);
        for (let i = 0; i < total; i++) {
            const d = addDays(start, i);
            cells.push({ date: d, inMonth: d.getMonth() === anchor.getMonth() });
        }
        titleEl.textContent = `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
    }

    for (const { date, inMonth } of cells) {
        const dateKey = toDateKey(date);
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.dataset.dateKey = dateKey;
        if (!inMonth) cell.classList.add('other-month');
        const isToday = sameDay(date, today);
        if (isToday) cell.classList.add('today');
        const isSelected = state.selectedDate === dateKey;
        if (isSelected) cell.classList.add('selected');

        // A11y: make each day cell a keyboard-operable button.
        cell.setAttribute('role', 'button');
        cell.tabIndex = 0;
        cell.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

        const num = document.createElement('span');
        num.className = 'day-num';
        num.textContent = date.getDate();
        cell.appendChild(num);

        const dayTasks = taskMap.get(dateKey) || [];
        if (dayTasks.length > 0) {
            const chips = document.createElement('div');
            chips.className = 'chips';
            const maxShow = state.viewMode === 'week' ? 4 : 3;
            for (const t of dayTasks.slice(0, maxShow)) {
                const chip = document.createElement('span');
                chip.className = 'chip';
                if (t.done) chip.classList.add('done');
                // Light-chip class for colors where dark text improves contrast.
                if (LIGHT_CHIP_COLOR_IDS.has(t.goalColorId)) chip.classList.add('chip-light');
                chip.style.background = t.goalColor;
                chip.textContent = t.title;
                chip.title = `${t.goalTitle}: ${t.title}`;
                chips.appendChild(chip);
            }
            if (dayTasks.length > maxShow) {
                const more = document.createElement('span');
                more.className = 'chip-more';
                more.textContent = `+${dayTasks.length - maxShow}`;
                chips.appendChild(more);
            }
            cell.appendChild(chips);
        }

        // A11y aria-label: full date + task count (+today marker).
        const fullDate = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        const taskCountLabel =
            dayTasks.length === 0
                ? 'no tasks'
                : `${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}`;
        const todayLabel = isToday ? ', today' : '';
        cell.setAttribute('aria-label', `${fullDate}${todayLabel}, ${taskCountLabel}`);

        // Drag-and-drop target
        cell.addEventListener('dragover', (e) => {
            if (!e.dataTransfer.types.includes('text/task-id')) return;
            e.preventDefault();
            cell.classList.add('drag-over');
        });
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/task-id');
            if (!taskId) return;
            handlers.onDropTask(taskId, dateKey);
        });

        cell.addEventListener('click', () => handlers.onSelectDate(dateKey));
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlers.onSelectDate(dateKey);
            }
        });

        daysEl.appendChild(cell);
    }

    viewToggleEl.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.view === state.viewMode);
    });
}

export function renderDayPanel(root, data, state, handlers, taskMap) {
    const { dayPanelEl, dayPanelTitle, dayPanelTasks } = root;
    if (!state.selectedDate) {
        dayPanelEl.hidden = true;
        return;
    }
    dayPanelEl.hidden = false;

    const date = fromDateKey(state.selectedDate);
    if (!date) {
        // Corrupt selectedDate — hide panel and bail safely.
        dayPanelEl.hidden = true;
        return;
    }
    dayPanelTitle.textContent = `Tasks on ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
    dayPanelTasks.innerHTML = '';

    const tasks = taskMap.get(state.selectedDate) || [];

    if (tasks.length === 0) {
        dayPanelTasks.appendChild(buildEmptyBlock({
            iconName: 'calendar',
            title: 'Nothing scheduled.',
            hint: 'Drag a task here from Goals below, or open a task and press Schedule.',
        }));
        return;
    }

    for (const t of tasks) {
        const row = document.createElement('label');
        row.className = 'task-row';
        row.style.borderLeftColor = t.goalColor;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!t.done;
        checkbox.setAttribute('aria-label', `Mark “${t.title}” ${t.done ? 'not done' : 'done'}`);
        checkbox.addEventListener('change', () => handlers.onToggleDone(t.id, checkbox.checked, t.title));

        const title = document.createElement('span');
        title.className = 'task-title';
        if (t.done) title.classList.add('done');
        title.textContent = t.title;

        const goalLabel = document.createElement('span');
        goalLabel.className = 'task-goal';
        // Include priority label alongside the goal title so color isn't the only cue.
        goalLabel.textContent = `${t.goalTitle} · ${t.goalColorLabel}`;
        goalLabel.style.color = t.goalColor;

        row.appendChild(checkbox);
        row.appendChild(title);
        row.appendChild(goalLabel);
        dayPanelTasks.appendChild(row);
    }
}
