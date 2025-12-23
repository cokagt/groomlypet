// Este es el Mock para que GroomlyPet funcione fuera de Base44
export const base44 = {
    table: (tableName) => ({
        select: () => {
            console.log(`Simulando selección de tabla: ${tableName}`);
            return Promise.resolve({ data: [], error: null });
        },
        insert: (obj) => {
            console.log(`Simulando inserción en ${tableName}:`, obj);
            return Promise.resolve({ data: obj, error: null });
        },
        update: (obj) => Promise.resolve({ data: obj, error: null }),
        delete: () => Promise.resolve({ error: null }),
    }),
    auth: {
        user: () => ({ id: "123", email: "admin@groomlypet.com" }),
        signOut: () => Promise.resolve(),
    }
};