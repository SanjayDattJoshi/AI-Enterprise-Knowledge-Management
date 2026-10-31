// Client: Utility functions
/**
 * Format a date string or Date object into a readable date string
 */
export function formatDate(date) {
    if (!date)
        return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime()))
        return '-';
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
/**
 * Format date with time
 */
export function formatDateTime(date) {
    if (!date)
        return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime()))
        return '-';
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
