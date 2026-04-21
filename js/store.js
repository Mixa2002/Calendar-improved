// ============================================================
// Data layer: load/save/validate/migrate + view prefs. No DOM.
// ============================================================

const STORAGE_KEY = 'calendar-improved-data';
const VIEW_KEY = 'calendar-improved-view';

export const MAX_GOALS = 5;

export const COLORS = [
    { id: 'red',    label: 'Urgent',  hex: '#ef4444' },
    { id: 'orange', label: 'High',    hex: '#f97316' },
    { id: 'yellow', label: 'Medium',  hex: '#eab308' },
    { id: 'teal',   label: 'Low',     hex: '#14b8a6' },
    { id: 'blue',   label: 'Someday', hex: '#3b82f6' },
];
export const colorById = Object.fromEntries(COLORS.map(c => [c.id, c]));
const FALLBACK_COLOR_ID = 'blue';

function isValidDateKey(key) {
    if (typeof key !== 'string') return false;
    const parts = key.split('-');
    if (parts.length !== 3) return false;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function sanitizeTask(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (typeof raw.id !== 'string' || !raw.id) return null;
    if (typeof raw.title !== 'string' || !raw.title) return null;
    let date = null;
    if (raw.date !== null && raw.date !== undefined) {
        if (isValidDateKey(raw.date)) {
            date = raw.date;
        } else {
            // Invalid date key — drop scheduling but keep the task.
            date = null;
        }
    }
    return {
        id: raw.id,
        title: raw.title,
        date,
        done: !!raw.done,
    };
}

function sanitizeGoal(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (typeof raw.id !== 'string' || !raw.id) return null;
    if (typeof raw.title !== 'string' || !raw.title) return null;
    // Normalize unknown colorId to fallback so the goal still renders.
    const colorId = colorById[raw.colorId] ? raw.colorId : FALLBACK_COLOR_ID;
    const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : [];
    const tasks = rawTasks.map(sanitizeTask).filter(Boolean);
    return {
        id: raw.id,
        title: raw.title,
        colorId,
        collapsed: !!raw.collapsed,
        tasks,
    };
}

export function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { goals: [] };
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.goals)) return { goals: [] };
        const goals = parsed.goals.map(sanitizeGoal).filter(Boolean);
        return { goals };
    } catch (err) {
        console.warn('[calendar] loadData: falling back to empty state', err);
        return { goals: [] };
    }
}

export function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return { ok: true };
    } catch (err) {
        console.warn('[calendar] saveData failed (quota or storage error)', err);
        return { ok: false, error: err };
    }
}

export function loadView() {
    try {
        const raw = localStorage.getItem(VIEW_KEY);
        if (!raw) return {};
        const v = JSON.parse(raw);
        if (v && (v.viewMode === 'week' || v.viewMode === 'month')) {
            return { viewMode: v.viewMode };
        }
        return {};
    } catch {
        return {};
    }
}

export function saveView(view) {
    try {
        localStorage.setItem(VIEW_KEY, JSON.stringify(view));
        return { ok: true };
    } catch (err) {
        console.warn('[calendar] saveView failed', err);
        return { ok: false, error: err };
    }
}

export function usedColorIds(data) {
    return new Set(data.goals.map(g => g.colorId));
}

export function findTask(data, taskId) {
    for (const goal of data.goals) {
        const task = (goal.tasks || []).find(t => t.id === taskId);
        if (task) return { goal, task };
    }
    return null;
}

export function tasksByDate(data) {
    const map = new Map();
    for (const goal of data.goals) {
        const hex = colorById[goal.colorId]?.hex || colorById[FALLBACK_COLOR_ID].hex;
        const colorLabel = colorById[goal.colorId]?.label || colorById[FALLBACK_COLOR_ID].label;
        for (const task of goal.tasks || []) {
            if (!task.date) continue;
            if (!map.has(task.date)) map.set(task.date, []);
            map.get(task.date).push({
                ...task,
                goalColor: hex,
                goalColorId: goal.colorId,
                goalColorLabel: colorLabel,
                goalTitle: goal.title,
                goalId: goal.id,
            });
        }
    }
    return map;
}

// --- Atomic mutators: load → mutate by id → save, in a single operation. --

function findGoalById(data, goalId) {
    return data.goals.find(g => g.id === goalId) || null;
}

export function addGoal({ title, colorId }) {
    const data = loadData();
    if (data.goals.length >= MAX_GOALS) return { ok: false, error: 'max-goals' };
    const finalColorId = colorById[colorId] ? colorId : FALLBACK_COLOR_ID;
    const goal = {
        id: cryptoId(),
        title: String(title || '').slice(0, 200),
        colorId: finalColorId,
        collapsed: false,
        tasks: [],
    };
    data.goals.push(goal);
    const result = saveData(data);
    return { ok: result.ok, goal, error: result.error };
}

export function addTask(goalId, { title }) {
    const data = loadData();
    const goal = findGoalById(data, goalId);
    if (!goal) return { ok: false, error: 'goal-not-found' };
    goal.tasks = goal.tasks || [];
    const task = {
        id: cryptoId(),
        title: String(title || '').slice(0, 300),
        date: null,
        done: false,
    };
    goal.tasks.push(task);
    const result = saveData(data);
    return { ok: result.ok, task, error: result.error };
}

export function toggleTaskDone(taskId, done) {
    const data = loadData();
    const found = findTask(data, taskId);
    if (!found) return { ok: false, error: 'task-not-found' };
    found.task.done = !!done;
    return saveData(data);
}

export function setTaskDate(taskId, dateKey) {
    const data = loadData();
    const found = findTask(data, taskId);
    if (!found) return { ok: false, error: 'task-not-found' };
    if (dateKey !== null && !isValidDateKey(dateKey)) {
        return { ok: false, error: 'invalid-date-key' };
    }
    found.task.date = dateKey;
    return saveData(data);
}

export function toggleGoalCollapsed(goalId) {
    const data = loadData();
    const goal = findGoalById(data, goalId);
    if (!goal) return { ok: false, error: 'goal-not-found' };
    goal.collapsed = !goal.collapsed;
    const result = saveData(data);
    return { ok: result.ok, collapsed: goal.collapsed, error: result.error };
}

function cryptoId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
