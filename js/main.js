// ============================================================
// Boot + render orchestrator + controller glue.
// ============================================================

import { stripTime, toDateKey, addDays } from './dates.js';
import {
    loadData,
    loadView,
    saveView,
    tasksByDate,
    addGoal as storeAddGoal,
    addTask as storeAddTask,
    toggleTaskDone as storeToggleTaskDone,
    setTaskDate as storeSetTaskDate,
    toggleGoalCollapsed as storeToggleGoalCollapsed,
} from './store.js';
import { renderCalendar, renderDayPanel } from './calendar.js';
import { renderGoals, renderGoalForm, openGoalForm, openTaskForm } from './goals.js';

// state.anchor invariant: always the result of stripTime() (midnight local).
// In month view, navigation sets anchor to the 1st of the month.
const state = {
    viewMode: 'week', // 'week' | 'month'
    anchor: stripTime(new Date()),
    selectedDate: toDateKey(new Date()),
    // Remembered to restore focus when day panel closes.
    lastDayCellKey: null,
};

function boot() {
    const root = {
        daysEl: document.getElementById('days'),
        titleEl: document.getElementById('calendar-title'),
        goalsListEl: document.getElementById('goals-list'),
        addGoalBtn: document.getElementById('add-goal-btn'),
        goalFormEl: document.getElementById('goal-form'),
        viewToggleEl: document.getElementById('view-toggle'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn'),
        dayPanelEl: document.getElementById('day-panel'),
        dayPanelTitle: document.getElementById('day-panel-title'),
        dayPanelTasks: document.getElementById('day-panel-tasks'),
        dayPanelClose: document.getElementById('day-panel-close'),
        srStatus: document.getElementById('sr-status'),
    };

    function announce(message) {
        if (!root.srStatus) return;
        // Reset then set so repeated identical messages still get announced.
        root.srStatus.textContent = '';
        // Microtask hop is enough for most ATs; a rAF is safer.
        requestAnimationFrame(() => {
            root.srStatus.textContent = message;
        });
    }

    function renderAll() {
        // Load data exactly once per render, then fan out.
        const data = loadData();
        const taskMap = tasksByDate(data);

        renderCalendar(root, data, state, {
            onSelectDate: (dateKey) => {
                state.selectedDate = state.selectedDate === dateKey ? null : dateKey;
                state.lastDayCellKey = state.selectedDate ? dateKey : state.lastDayCellKey;
                renderAll();
            },
            onDropTask: (taskId, dateKey) => {
                const res = storeSetTaskDate(taskId, dateKey);
                if (res.ok) announce('Task scheduled.');
                renderAll();
            },
        }, taskMap);

        renderDayPanel(root, data, state, {
            onToggleDone: (taskId, done, title) => {
                storeToggleTaskDone(taskId, done);
                announce(`${title} marked ${done ? 'done' : 'not done'}.`);
                renderAll();
            },
        }, taskMap);

        renderGoals(root, data, state, {
            onToggleCollapsed: (goalId) => {
                storeToggleGoalCollapsed(goalId);
                renderAll();
            },
            onToggleDone: (taskId, done, title) => {
                storeToggleTaskDone(taskId, done);
                announce(`${title} marked ${done ? 'done' : 'not done'}.`);
                renderAll();
            },
            onRequestAddTask: (goalId, taskFormEl) => {
                const data2 = loadData();
                const goal = data2.goals.find(g => g.id === goalId);
                if (!goal) return;
                if (goal.collapsed) {
                    // Expand first, then re-query the fresh form node.
                    storeToggleGoalCollapsed(goalId);
                    renderAll();
                    const cards = root.goalsListEl.querySelectorAll('.goal-card');
                    const data3 = loadData();
                    const idx = data3.goals.findIndex(g => g.id === goalId);
                    const form = cards[idx]?.querySelector('.task-form');
                    if (form) openTaskForm(form, { id: goalId, colorId: goal.colorId }, taskFormHandlers);
                    return;
                }
                openTaskForm(taskFormEl, goal, taskFormHandlers);
            },
            onScheduleTask: (taskId, dateKey, title) => {
                const res = storeSetTaskDate(taskId, dateKey);
                if (res.ok) announce(`${title} scheduled.`);
                renderAll();
            },
        });

        renderGoalForm(root, data);
    }

    const taskFormHandlers = {
        onSaveTask: (goalId, payload) => {
            const res = storeAddTask(goalId, payload);
            if (res.ok) announce('Task added.');
            renderAll();
        },
        onCancel: () => renderAll(),
    };

    function setupControls() {
        root.viewToggleEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-view]');
            if (!btn) return;
            state.viewMode = btn.dataset.view;
            state.anchor = stripTime(new Date());
            saveView({ viewMode: state.viewMode });
            renderAll();
        });

        root.prevBtn.addEventListener('click', () => {
            if (state.viewMode === 'week') {
                state.anchor = addDays(state.anchor, -7);
            } else {
                state.anchor = new Date(state.anchor.getFullYear(), state.anchor.getMonth() - 1, 1);
            }
            renderAll();
        });

        root.nextBtn.addEventListener('click', () => {
            if (state.viewMode === 'week') {
                state.anchor = addDays(state.anchor, 7);
            } else {
                state.anchor = new Date(state.anchor.getFullYear(), state.anchor.getMonth() + 1, 1);
            }
            renderAll();
        });

        root.addGoalBtn.addEventListener('click', () => {
            const data = loadData();
            openGoalForm(root, data, {
                onSaveGoal: (payload) => {
                    const res = storeAddGoal(payload);
                    if (res.ok) announce('Goal saved.');
                    renderAll();
                },
                onCancel: () => renderAll(),
            });
        });

        root.dayPanelClose.addEventListener('click', () => {
            const lastKey = state.lastDayCellKey;
            state.selectedDate = null;
            renderAll();
            // Restore focus to the day cell that opened the panel.
            if (lastKey) {
                const cell = root.daysEl.querySelector(`[data-date-key="${lastKey}"]`);
                if (cell) cell.focus();
            }
        });
    }

    // Initial view pref
    const savedView = loadView();
    if (savedView.viewMode) state.viewMode = savedView.viewMode;
    // If a selectedDate exists, remember which cell to focus on panel close.
    state.lastDayCellKey = state.selectedDate;
    setupControls();
    renderAll();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
