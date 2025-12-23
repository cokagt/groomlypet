// Zona horaria de Guatemala (UTC-6)
export const GUATEMALA_TIMEZONE = 'America/Guatemala';

// Función para obtener la fecha actual en zona horaria de Guatemala
export function getGuatemalaDate() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
}

// Función para formatear una fecha a zona horaria de Guatemala
export function toGuatemalaTime(date) {
    if (!date) return null;
    const d = new Date(date);
    return new Date(d.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
}

// Función para crear una fecha ISO en zona horaria de Guatemala
export function createGuatemalaDateTime(dateStr, timeStr) {
    // dateStr: 'YYYY-MM-DD', timeStr: 'HH:mm'
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Crear fecha en UTC y ajustar a Guatemala (UTC-6)
    const date = new Date(Date.UTC(year, month - 1, day, hours + 6, minutes, 0));
    return date.toISOString();
}

// Obtener offset de Guatemala en horas
export const GUATEMALA_OFFSET_HOURS = -6;