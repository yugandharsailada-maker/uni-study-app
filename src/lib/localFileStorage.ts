import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SyllabusDB extends DBSchema {
    handles: {
        key: string; // subjectId
        value: {
            subjectId: string;
            handle: FileSystemFileHandle;
            updatedAt: Date;
        };
    };
}

const DB_NAME = 'uni-study-local-files';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SyllabusDB>>;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<SyllabusDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles', { keyPath: 'subjectId' });
                }
            },
        });
    }
    return dbPromise;
};

export const saveFileHandle = async (subjectId: string, handle: FileSystemFileHandle) => {
    const db = await getDB();
    await db.put('handles', {
        subjectId,
        handle,
        updatedAt: new Date(),
    });
};

export const getFileHandle = async (subjectId: string): Promise<FileSystemFileHandle | undefined> => {
    const db = await getDB();
    const result = await db.get('handles', subjectId);
    return result?.handle;
};

export const deleteFileHandle = async (subjectId: string) => {
    const db = await getDB();
    await db.delete('handles', subjectId);
};
