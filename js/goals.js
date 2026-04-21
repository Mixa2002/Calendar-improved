// ============================================================
// Goals rendering + goal/task forms. DOM only; no storage calls.
// ============================================================

import { fromDateKey, MONTHS_SHORT } from './dates.js';
import { COLORS, colorById, MAX_GOALS, usedColorIds } from './store.js';

const FALLBACK_HEX = colorById.blue.hex;

function formatTaskDate(iso) {
    const d = fromDateKey(iso);
    if (!d) return '';
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function renderGoalForm(root, data) {
    const { goalFormEl, addGoalBtn } = root;
    goalFormEl.innerHTML = '';
    goalFormEl.hidden = true;
    addGoalBtn.hidden = data.goals.length >= MAX_GOALS;
}

export function openGoalForm(root, data, handlers) {
    const { goalFormEl, addGoalBtn } = root;
    const used = usedColorIds(data);
    goalFormEl.innerHTML = '';
    goalFormEl.hidden = false;
    addGoalBtn.hidden = true;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Goal title';
    input.className = 'form-input';
    input.maxLength = 60;
    input.setAttribute('aria-label', 'Goal title');

    const palette = document.createElement('div');
    palette.className = 'color-palette';
    palette.setAttribute('role', 'radiogroup');
    palette.setAttribute('aria-label', 'Priority');

    let selectedColor = COLORS.find(c => !used.has(c.id))?.id;

    function updateSwatches() {
        palette.querySelectorAll('.swatch').forEach(sw => {
            const isSelected = sw.dataset.color === selectedColor;
            sw.classList.toggle('selected', isSelected);
            if (!sw.disabled) sw.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
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
            sw.setAttribute('aria-label', `${c.label} (already used)`);
        } else {
            sw.setAttribute('aria-label', c.label);
            sw.setAttribute('aria-pressed', 'false');
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
        handlers.onSaveGoal({ title, colorId: selectedColor });
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
    cancelBtn.addEventListener('click', () => handlers.onCancel());

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveGoal(); }
        else if (e.key === 'Escape') { e.preventDefault(); handlers.onCancel(); }
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    goalFormEl.appendChild(input);
    goalFormEl.appendChild(palette);
    goalFormEl.appendChild(actions);
    input.focus();
}

export function openTaskForm(container, goal, handlers) {
    container.innerHTML = '';
    const hex = colorById[goal.colorId]?.hex || FALLBACK_HEX;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Task title (drag or use Schedule to assign a day)';
    input.className = 'form-input';
    input.maxLength = 80;
    input.setAttribute('aria-label', 'Task title');

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    function saveTask() {
        const title = input.value.trim();
        if (!title) return;
        handlers.onSaveTask(goal.id, { title });
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
    cancelBtn.addEventListener('click', () => handlers.onCancel());

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveTask(); }
        else if (e.key === 'Escape') { e.preventDefault(); handlers.onCancel(); }
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    container.appendChild(input);
    container.appendChild(actions);
    input.focus();
}

export function renderGoals(root, data, state, handlers) {
    const { goalsListEl } = root;
    goalsListEl.innerHTML = '';

    if (data.goals.length === 0) {
        const p = document.createElement('p');
        p.className = 'goals-placeholder';
        p.textContent = 'No goals yet.';
        goalsListEl.appendChild(p);
        return;
    }

    for (const goal of data.goals) {
        const color = colorById[goal.colorId] || colorById.blue;
        const hex = color.hex;
        const priorityLabel = color.label;
        const tasks = goal.tasks || [];
        const doneCount = tasks.filter(t => t.done).length;
        const pct = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
        const collapsed = !!goal.collapsed;

        const card = document.createElement('div');
        card.className = 'goal-card';
        if (collapsed) card.classList.add('collapsed');
        card.style.borderLeftColor = hex;

        const bodyId = `goal-body-${goal.id}`;

        // Use a real <button> for the header so keyboard + screen readers work.
        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'goal-card-header';
        header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        header.setAttribute('aria-controls', bodyId);

        const chevron = document.createElement('span');
        chevron.className = 'chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.textContent = collapsed ? '▸' : '▾';

        const swatch = document.createElement('span');
        swatch.className = 'goal-swatch';
        swatch.style.background = hex;
        swatch.setAttribute('aria-hidden', 'true');

        const title = document.createElement('span');
        title.className = 'goal-title';
        title.textContent = goal.title;

        const priority = document.createElement('span');
        priority.className = 'goal-priority';
        priority.textContent = priorityLabel;
        priority.style.color = hex;

        const count = document.createElement('span');
        count.className = 'goal-count';
        count.textContent = `${doneCount}/${tasks.length}`;

        header.appendChild(chevron);
        header.appendChild(swatch);
        header.appendChild(title);
        header.appendChild(priority);
        header.appendChild(count);
        card.appendChild(header);

        // "+ Task" button lives outside the header button (can't nest buttons).
        const headerActions = document.createElement('div');
        headerActions.className = 'goal-card-header-actions';

        const addTaskBtn = document.createElement('button');
        addTaskBtn.type = 'button';
        addTaskBtn.className = 'btn-small';
        addTaskBtn.style.color = hex;
        addTaskBtn.style.borderColor = hex;
        addTaskBtn.textContent = '+ Task';
        addTaskBtn.setAttribute('aria-label', `Add task to ${goal.title}`);
        headerActions.appendChild(addTaskBtn);
        card.appendChild(headerActions);

        header.addEventListener('click', () => handlers.onToggleCollapsed(goal.id));

        const body = document.createElement('div');
        body.className = 'goal-body';
        body.id = bodyId;
        if (collapsed) body.hidden = true;
        card.appendChild(body);

        // Progress bar
        const progress = document.createElement('div');
        progress.className = 'progress';
        progress.setAttribute('role', 'progressbar');
        progress.setAttribute('aria-valuemin', '0');
        progress.setAttribute('aria-valuemax', '100');
        progress.setAttribute('aria-valuenow', String(pct));
        progress.setAttribute('aria-label', `${goal.title} progress`);
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${pct}%`;
        fill.style.background = hex;
        progress.appendChild(fill);
        body.appendChild(progress);

        const taskForm = document.createElement('div');
        taskForm.className = 'task-form';
        body.appendChild(taskForm);
        addTaskBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handlers.onRequestAddTask(goal.id, taskForm);
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
                checkbox.setAttribute('aria-label', `Mark “${t.title}” ${t.done ? 'not done' : 'done'}`);
                checkbox.addEventListener('change', () => handlers.onToggleDone(t.id, checkbox.checked, t.title));
                checkbox.addEventListener('click', (e) => e.stopPropagation());

                const tTitle = document.createElement('span');
                tTitle.className = 'task-title';
                if (t.done) tTitle.classList.add('done');
                tTitle.textContent = t.title;

                const tMeta = document.createElement('span');
                tMeta.className = 'task-date';
                tMeta.textContent = t.date ? formatTaskDate(t.date) : 'unassigned';
                if (!t.date) tMeta.classList.add('unassigned');

                // Keyboard alternative to drag-and-drop: "Schedule" button.
                const scheduleBtn = document.createElement('button');
                scheduleBtn.type = 'button';
                scheduleBtn.className = 'btn-small btn-schedule';
                if (state.selectedDate) {
                    scheduleBtn.textContent = 'Schedule';
                    scheduleBtn.setAttribute('aria-label', `Schedule “${t.title}” on selected day`);
                    scheduleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handlers.onScheduleTask(t.id, state.selectedDate, t.title);
                    });
                } else {
                    scheduleBtn.textContent = 'Pick a day first';
                    scheduleBtn.disabled = true;
                    scheduleBtn.setAttribute(
                        'aria-label',
                        `Pick a day in the calendar first, then use this button to schedule “${t.title}”`,
                    );
                }

                li.appendChild(checkbox);
                li.appendChild(tTitle);
                li.appendChild(tMeta);
                li.appendChild(scheduleBtn);
                list.appendChild(li);
            }
            body.appendChild(list);
        }

        goalsListEl.appendChild(card);
    }
}
