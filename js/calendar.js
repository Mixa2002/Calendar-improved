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
        const empty = document.createElement('p');
        empty.className = 'goals-placeholder';
        empty.textContent = 'No tasks. Drag or use “Schedule” on a task in Goals below.';
        dayPanelTasks.appendChild(empty);
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
