const daysEl = document.getElementById('days');
const titleEl = document.getElementById('calendar-title');
const goalsListEl = document.getElementById('goals-list');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalFormEl = document.getElementById('goal-form');

const STORAGE_KEY = 'calendar-improved-data';
const MAX_GOALS = 5;

// Urgency palette: most urgent -> least urgent
const COLORS = [
    { id: 'red',    label: 'Urgent',     hex: '#ef4444' },
    { id: 'orange', label: 'High',       hex: '#f97316' },
    { id: 'yellow', label: 'Medium',     hex: '#eab308' },
    { id: 'teal',   label: 'Low',        hex: '#14b8a6' },
    { id: 'blue',   label: 'Someday',    hex: '#3b82f6' },
];

const colorById = Object.fromEntries(COLORS.map(c => [c.id, c]));

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

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function todayKey() {
    return toDateKey(new Date());
}

function usedColorIds(data) {
    return new Set(data.goals.map(g => g.colorId));
}

function tasksByDate(data) {
    const map = new Map();
    for (const goal of data.goals) {
        const hex = colorById[goal.colorId]?.hex || '#4f46e5';
        for (const task of goal.tasks || []) {
            if (!map.has(task.date)) map.set(task.date, []);
            map.get(task.date).push({ ...task, goalColor: hex, goalTitle: goal.title });
        }
    }
    return map;
}

function renderCalendar(data) {
    daysEl.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    titleEl.textContent = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const taskMap = tasksByDate(data);

    for (let i = 0; i < 21; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const cell = document.createElement('div');
        cell.className = 'day';

        const num = document.createElement('span');
        num.className = 'day-num';
        num.textContent = date.getDate();
        cell.appendChild(num);

        if (date.getMonth() !== today.getMonth()) cell.classList.add('other-month');
        if (date.getTime() === today.getTime()) cell.classList.add('today');

        const key = toDateKey(date);
        const dayTasks = taskMap.get(key) || [];
        if (dayTasks.length > 0) {
            const dots = document.createElement('div');
            dots.className = 'dots';
            for (const t of dayTasks.slice(0, 3)) {
                const dot = document.createElement('span');
                dot.className = 'dot';
                dot.style.background = t.goalColor;
                dot.title = `${t.goalTitle}: ${t.title}`;
                dots.appendChild(dot);
            }
            cell.appendChild(dots);
        }

        daysEl.appendChild(cell);
    }
}

function renderGoalForm(data) {
    goalFormEl.innerHTML = '';
    goalFormEl.hidden = true;
    addGoalBtn.hidden = false;

    if (data.goals.length >= MAX_GOALS) {
        addGoalBtn.hidden = true;
    }
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
            sw.addEventListener('click', () => {
                selectedColor = c.id;
                updateSwatches();
            });
        }
        palette.appendChild(sw);
    }
    updateSwatches();

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = 'Save goal';
    saveBtn.addEventListener('click', () => {
        const title = input.value.trim();
        if (!title || !selectedColor) return;
        data.goals.push({ id: uid(), title, colorId: selectedColor, tasks: [] });
        saveData(data);
        render();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => render());

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
    input.placeholder = 'Task title';
    input.className = 'form-input';
    input.maxLength = 80;

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'form-input';
    dateInput.value = todayKey();

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-primary';
    saveBtn.style.background = hex;
    saveBtn.textContent = 'Add task';
    saveBtn.addEventListener('click', () => {
        const title = input.value.trim();
        const date = dateInput.value;
        if (!title || !date) return;
        goal.tasks = goal.tasks || [];
        goal.tasks.push({ id: uid(), title, date, done: false });
        saveData(data);
        render();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => render());

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    container.appendChild(input);
    container.appendChild(dateInput);
    container.appendChild(actions);
    input.focus();
}

function formatTaskDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

        const card = document.createElement('div');
        card.className = 'goal-card';
        card.style.borderLeftColor = hex;

        const header = document.createElement('div');
        header.className = 'goal-card-header';

        const swatch = document.createElement('span');
        swatch.className = 'goal-swatch';
        swatch.style.background = hex;

        const title = document.createElement('span');
        title.className = 'goal-title';
        title.textContent = goal.title;

        const count = document.createElement('span');
        count.className = 'goal-count';
        const n = (goal.tasks || []).length;
        count.textContent = `${n} task${n === 1 ? '' : 's'}`;

        const addTaskBtn = document.createElement('button');
        addTaskBtn.type = 'button';
        addTaskBtn.className = 'btn-small';
        addTaskBtn.style.color = hex;
        addTaskBtn.style.borderColor = hex;
        addTaskBtn.textContent = '+ Task';

        header.appendChild(swatch);
        header.appendChild(title);
        header.appendChild(count);
        header.appendChild(addTaskBtn);
        card.appendChild(header);

        const taskForm = document.createElement('div');
        taskForm.className = 'task-form';
        card.appendChild(taskForm);

        addTaskBtn.addEventListener('click', () => openTaskForm(data, goal, taskForm));

        const tasks = (goal.tasks || []).slice().sort((a, b) => a.date.localeCompare(b.date));
        if (tasks.length > 0) {
            const list = document.createElement('ul');
            list.className = 'task-list';
            for (const t of tasks) {
                const li = document.createElement('li');
                li.className = 'task-item';
                li.style.borderLeftColor = hex;

                const tTitle = document.createElement('span');
                tTitle.className = 'task-title';
                tTitle.textContent = t.title;

                const tDate = document.createElement('span');
                tDate.className = 'task-date';
                tDate.textContent = formatTaskDate(t.date);

                li.appendChild(tTitle);
                li.appendChild(tDate);
                list.appendChild(li);
            }
            card.appendChild(list);
        }

        goalsListEl.appendChild(card);
    }
}

function render() {
    const data = loadData();
    renderCalendar(data);
    renderGoals(data);
    renderGoalForm(data);
}

addGoalBtn.addEventListener('click', () => openGoalForm(loadData()));

render();
