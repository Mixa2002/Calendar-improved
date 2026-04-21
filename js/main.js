import { stripTime, toDateKey, fromDateKey, mondayOf, addDays, sameDay, monthCellCount, MONTHS, MONTHS_SHORT, uid } from './dates.js';

// ============================================================
// State & constants
// ============================================================

const STORAGE_KEY = 'calendar-improved-data';
const VIEW_KEY = 'calendar-improved-view';
const MAX_GOALS = 5;

const COLORS = [
    { id: 'red',    label: 'Urgent',  hex: '#ef4444' },
    { id: 'orange', label: 'High',    hex: '#f97316' },
    { id: 'yellow', label: 'Medium',  hex: '#eab308' },
    { id: 'teal',   label: 'Low',     hex: '#14b8a6' },
    { id: 'blue',   label: 'Someday', hex: '#3b82f6' },
];
const colorById = Object.fromEntries(COLORS.map(c => [c.id, c]));

const state = {
    viewMode: 'week', // 'week' | 'month'
    anchor: stripTime(new Date()),
    selectedDate: toDateKey(new Date()),
};

// ============================================================
// DOM refs
// ============================================================

const daysEl = document.getElementById('days');
const titleEl = document.getElementById('calendar-title');
const goalsListEl = document.getElementById('goals-list');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalFormEl = document.getElementById('goal-form');
const viewToggleEl = document.getElementById('view-toggle');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dayPanelEl = document.getElementById('day-panel');
const dayPanelTitle = document.getElementById('day-panel-title');
const dayPanelTasks = document.getElementById('day-panel-tasks');
const dayPanelClose = document.getElementById('day-panel-close');

// ============================================================
// Data layer
// ============================================================

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { goals: [] };
        const parsed = JSON.parse(raw);
        return parsed && Array.isArray(parsed.goals) ? parsed : { goals: [] };
    } catch {
        return { goals: [] };
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadView() {
    try {
        const raw = localStorage.getItem(VIEW_KEY);
        if (!raw) return;
        const v = JSON.parse(raw);
        if (v.viewMode === 'week' || v.viewMode === 'month') state.viewMode = v.viewMode;
    } catch {}
}

function saveView() {
    localStorage.setItem(VIEW_KEY, JSON.stringify({ viewMode: state.viewMode }));
}

function usedColorIds(data) {
    return new Set(data.goals.map(g => g.colorId));
}

function findTask(data, taskId) {
    for (const goal of data.goals) {
        const task = (goal.tasks || []).find(t => t.id === taskId);
        if (task) return { goal, task };
    }
    return null;
}

function tasksByDate(data) {
    const map = new Map();
    for (const goal of data.goals) {
        const hex = colorById[goal.colorId]?.hex || '#4f46e5';
        for (const task of goal.tasks || []) {
            if (!task.date) continue;
            if (!map.has(task.date)) map.set(task.date, []);
            map.get(task.date).push({ ...task, goalColor: hex, goalTitle: goal.title, goalId: goal.id });
        }
    }
    return map;
}

// ============================================================
// Calendar rendering
// ============================================================

function renderCalendar(data) {
    daysEl.innerHTML = '';
    daysEl.classList.toggle('month-view', state.viewMode === 'month');

    const today = stripTime(new Date());
    const taskMap = tasksByDate(data);

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
        const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
        const end = addDays(mondayOf(lastOfMonth), 6);
        const total = Math.round((end - start) / 86400000) + 1;
        for (let i = 0; i < total; i++) {
            const d = addDays(start, i);
            cells.push({ date: d, inMonth: d.getMonth() === anchor.getMonth() });
        }
        titleEl.textContent = `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
    }

    for (const { date, inMonth } of cells) {
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.dataset.dateKey = toDateKey(date);
        if (!inMonth) cell.classList.add('other-month');
        if (sameDay(date, today)) cell.classList.add('today');
        if (state.selectedDate === cell.dataset.dateKey) cell.classList.add('selected');

        const num = document.createElement('span');
        num.className = 'day-num';
        num.textContent = date.getDate();
        cell.appendChild(num);

        const dayTasks = taskMap.get(cell.dataset.dateKey) || [];
        if (dayTasks.length > 0) {
            const chips = document.createElement('div');
            chips.className = 'chips';
            const maxShow = state.viewMode === 'week' ? 4 : 3;
            for (const t of dayTasks.slice(0, maxShow)) {
                const chip = document.createElement('span');
                chip.className = 'chip';
                if (t.done) chip.classList.add('done');
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
            const fresh = loadData();
            const found = findTask(fresh, taskId);
            if (!found) return;
            found.task.date = cell.dataset.dateKey;
            saveData(fresh);
            render();
        });

        cell.addEventListener('click', () => {
            state.selectedDate = state.selectedDate === cell.dataset.dateKey ? null : cell.dataset.dateKey;
            render();
        });

        daysEl.appendChild(cell);
    }

    viewToggleEl.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.view === state.viewMode);
    });
}

// ============================================================
// Day panel (tasks on selected day)
// ============================================================

function renderDayPanel(data) {
    if (!state.selectedDate) {
        dayPanelEl.hidden = true;
        return;
    }
    dayPanelEl.hidden = false;

    const date = fromDateKey(state.selectedDate);
    dayPanelTitle.textContent = `Tasks on ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
    dayPanelTasks.innerHTML = '';

    const taskMap = tasksByDate(data);
    const tasks = taskMap.get(state.selectedDate) || [];

    if (tasks.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'goals-placeholder';
        empty.textContent = 'No tasks. Drag a task here from a goal.';
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
        checkbox.addEventListener('change', () => toggleTaskDone(t.id, checkbox.checked));

        const title = document.createElement('span');
        title.className = 'task-title';
        if (t.done) title.classList.add('done');
        title.textContent = t.title;

        const goalLabel = document.createElement('span');
        goalLabel.className = 'task-goal';
        goalLabel.textContent = t.goalTitle;
        goalLabel.style.color = t.goalColor;

        row.appendChild(checkbox);
        row.appendChild(title);
        row.appendChild(goalLabel);
        dayPanelTasks.appendChild(row);
    }
}

function toggleTaskDone(taskId, done) {
    const data = loadData();
    const found = findTask(data, taskId);
    if (!found) return;
    found.task.done = !!done;
    saveData(data);
    render();
}

// ============================================================
// Goals rendering
// ============================================================

function renderGoalForm(data) {
    goalFormEl.innerHTML = '';
    goalFormEl.hidden = true;
    addGoalBtn.hidden = data.goals.length >= MAX_GOALS;
}

function openGoalForm(data) {
    const used = usedColorIds(data);
    goalFormEl.innerHTML = '';
    goalFormEl.hidden = false;
    addGoalBtn.hidden = true;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Goal title';
    input.className = 'form-input';
    input.maxLength = 60;

    const palette = document.createElement('div');
    palette.className = 'color-palette';

    let selectedColor = COLORS.find(c => !used.has(c.id))?.id;

    function updateSwatches() {
        palette.querySelectorAll('.swatch').forEach(sw => {
            sw.classList.toggle('selected', sw.dataset.color === selectedColor);
        });
    }

    for (const c of COLORS) {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'swatch';
        sw.dataset.color = c.id;
        sw.style.background = c.hex;
        sw.title = c.label;
        if (used.has(c.id)) {
            sw.disabled = true;
            sw.classList.add('used');
        } else {
            sw.addEventListener('click', () => { selectedColor = c.id; updateSwatches(); });
        }
        palette.appendChild(sw);
    }
    updateSwatches();

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    function saveGoal() {
        const title = input.value.trim();
        if (!title || !selectedColor) return;
        data.goals.push({ id: uid(), title, colorId: selectedColor, tasks: [] });
        saveData(data);
        render();
    }

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = 'Save goal';
    saveBtn.addEventListener('click', saveGoal);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => render());

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveGoal(); }
        else if (e.key === 'Escape') { e.preventDefault(); render(); }
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    goalFormEl.appendChild(input);
    goalFormEl.appendChild(palette);
    goalFormEl.appendChild(actions);
    input.focus();
}

function openTaskForm(data, goal, container) {
    container.innerHTML = '';
    const hex = colorById[goal.colorId]?.hex || '#4f46e5';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Task title (drag onto a day to schedule)';
    input.className = 'form-input';
    input.maxLength = 80;

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    function saveTask() {
        const title = input.value.trim();
        if (!title) return;
        goal.tasks = goal.tasks || [];
        goal.tasks.push({ id: uid(), title, date: null, done: false });
        saveData(data);
        render();
    }

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-primary';
    saveBtn.style.background = hex;
    saveBtn.textContent = 'Add task';
    saveBtn.addEventListener('click', saveTask);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => render());

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveTask(); }
        else if (e.key === 'Escape') { e.preventDefault(); render(); }
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    container.appendChild(input);
    container.appendChild(actions);
    input.focus();
}

function formatTaskDate(iso) {
    const d = fromDateKey(iso);
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function renderGoals(data) {
    goalsListEl.innerHTML = '';

    if (data.goals.length === 0) {
        const p = document.createElement('p');
        p.className = 'goals-placeholder';
        p.textContent = 'No goals yet.';
        goalsListEl.appendChild(p);
        return;
    }

    for (const goal of data.goals) {
        const hex = colorById[goal.colorId]?.hex || '#4f46e5';
        const tasks = goal.tasks || [];
        const doneCount = tasks.filter(t => t.done).length;
        const pct = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
        const collapsed = !!goal.collapsed;

        const card = document.createElement('div');
        card.className = 'goal-card';
        if (collapsed) card.classList.add('collapsed');
        card.style.borderLeftColor = hex;

        const header = document.createElement('div');
        header.className = 'goal-card-header';

        const chevron = document.createElement('span');
        chevron.className = 'chevron';
        chevron.textContent = collapsed ? '▸' : '▾';

        const swatch = document.createElement('span');
        swatch.className = 'goal-swatch';
        swatch.style.background = hex;

        const title = document.createElement('span');
        title.className = 'goal-title';
        title.textContent = goal.title;

        const count = document.createElement('span');
        count.className = 'goal-count';
        count.textContent = `${doneCount}/${tasks.length}`;

        const addTaskBtn = document.createElement('button');
        addTaskBtn.type = 'button';
        addTaskBtn.className = 'btn-small';
        addTaskBtn.style.color = hex;
        addTaskBtn.style.borderColor = hex;
        addTaskBtn.textContent = '+ Task';
        addTaskBtn.addEventListener('click', (e) => e.stopPropagation());

        header.appendChild(chevron);
        header.appendChild(swatch);
        header.appendChild(title);
        header.appendChild(count);
        header.appendChild(addTaskBtn);
        card.appendChild(header);

        header.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            goal.collapsed = !goal.collapsed;
            saveData(data);
            render();
        });

        const body = document.createElement('div');
        body.className = 'goal-body';
        if (collapsed) body.hidden = true;
        card.appendChild(body);

        // Progress bar
        const progress = document.createElement('div');
        progress.className = 'progress';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${pct}%`;
        fill.style.background = hex;
        progress.appendChild(fill);
        body.appendChild(progress);

        const taskForm = document.createElement('div');
        taskForm.className = 'task-form';
        body.appendChild(taskForm);
        addTaskBtn.addEventListener('click', () => {
            if (goal.collapsed) {
                goal.collapsed = false;
                saveData(data);
                render();
                // Re-query the fresh task form and open it
                const cards = goalsListEl.querySelectorAll('.goal-card');
                const idx = data.goals.indexOf(goal);
                const form = cards[idx]?.querySelector('.task-form');
                if (form) openTaskForm(data, goal, form);
                return;
            }
            openTaskForm(data, goal, taskForm);
        });

        if (tasks.length > 0) {
            const list = document.createElement('ul');
            list.className = 'task-list';

            const sorted = tasks.slice().sort((a, b) => {
                if (!a.date && b.date) return -1;
                if (a.date && !b.date) return 1;
                if (!a.date && !b.date) return 0;
                return a.date.localeCompare(b.date);
            });

            for (const t of sorted) {
                const li = document.createElement('li');
                li.className = 'task-item';
                li.style.borderLeftColor = hex;
                li.draggable = true;

                li.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/task-id', t.id);
                    e.dataTransfer.setData('text/plain', t.title);
                    li.classList.add('dragging');
                });
                li.addEventListener('dragend', () => li.classList.remove('dragging'));

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = !!t.done;
                checkbox.addEventListener('change', () => toggleTaskDone(t.id, checkbox.checked));
                checkbox.addEventListener('click', (e) => e.stopPropagation());

                const tTitle = document.createElement('span');
                tTitle.className = 'task-title';
                if (t.done) tTitle.classList.add('done');
                tTitle.textContent = t.title;

                const tMeta = document.createElement('span');
                tMeta.className = 'task-date';
                tMeta.textContent = t.date ? formatTaskDate(t.date) : 'unassigned';
                if (!t.date) tMeta.classList.add('unassigned');

                li.appendChild(checkbox);
                li.appendChild(tTitle);
                li.appendChild(tMeta);
                list.appendChild(li);
            }
            body.appendChild(list);
        }

        goalsListEl.appendChild(card);
    }
}

// ============================================================
// Controls
// ============================================================

function setupControls() {
    viewToggleEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-view]');
        if (!btn) return;
        state.viewMode = btn.dataset.view;
        state.anchor = stripTime(new Date());
        saveView();
        render();
    });

    prevBtn.addEventListener('click', () => {
        if (state.viewMode === 'week') {
            state.anchor = addDays(state.anchor, -7);
        } else {
            state.anchor = new Date(state.anchor.getFullYear(), state.anchor.getMonth() - 1, 1);
        }
        render();
    });

    nextBtn.addEventListener('click', () => {
        if (state.viewMode === 'week') {
            state.anchor = addDays(state.anchor, 7);
        } else {
            state.anchor = new Date(state.anchor.getFullYear(), state.anchor.getMonth() + 1, 1);
        }
        render();
    });

    addGoalBtn.addEventListener('click', () => openGoalForm(loadData()));

    dayPanelClose.addEventListener('click', () => {
        state.selectedDate = null;
        render();
    });
}

// ============================================================
// Boot
// ============================================================

function render() {
    const data = loadData();
    renderCalendar(data);
    renderDayPanel(data);
    renderGoals(data);
    renderGoalForm(data);
}

loadView();
setupControls();
render();
