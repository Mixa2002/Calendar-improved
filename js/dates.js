// ============================================================
// Pure date utilities + constants. No DOM, no storage.
// ============================================================

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function stripTime(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Returns null when the key is malformed. Validates that building a Date
// from the parts round-trips back to the same Y/M/D — rejects Feb 30 etc.
export function fromDateKey(key) {
    if (typeof key !== 'string') return null;
    const parts = key.split('-');
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
}

// ISO-week Monday-start: day-of-week becomes 0 (Mon) … 6 (Sun).
export function mondayOf(date) {
    const d = stripTime(date);
    const dow = (d.getDay() + 6) % 7; // 0 = Mon
    d.setDate(d.getDate() - dow);
    return d;
}

export function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

export function sameDay(a, b) {
    return stripTime(a).getTime() === stripTime(b).getTime();
}

// Month-view cell count computed by month arithmetic (DST-safe, no ms division).
// Returns the number of cells for a Mon-start calendar spanning from mondayOf(firstOfMonth)
// through the Sunday after lastOfMonth.
export function monthCellCount(anchor) {
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const start = mondayOf(firstOfMonth);
    const endMonday = mondayOf(lastOfMonth);
    // Whole weeks from start-Monday to end-Monday inclusive, plus 6 days to reach Sunday.
    // Compute whole days between by Y/M/D difference, not ms.
    const dayDiff = Math.round(
        (Date.UTC(endMonday.getFullYear(), endMonday.getMonth(), endMonday.getDate())
       - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000
    );
    return dayDiff + 7;
}

export function uid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
