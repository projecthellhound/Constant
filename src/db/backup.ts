import { db } from './schema';
import { convertLegacy } from './legacy';

export const BACKUP_VERSION = 3;

/** Tables that existed in older backups but were merged into others; still accepted on import. */
const LEGACY_KEYS = ['subtasks', 'todoLists', 'todoItems', 'wishlistItems', 'checklists', 'checklistItems', 'topics', 'entityLinks'];

/** Every table in the database, so new tables can never be silently left out of a backup. */
export async function exportAllTables(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { version: BACKUP_VERSION, app: 'Constant', exportedAt: new Date().toISOString() };
  for (const table of db.tables) {
    out[table.name] = await table.toArray();
  }
  return out;
}

export function hasRecognizedTable(data: Record<string, unknown>): boolean {
  return db.tables.some((t) => Array.isArray(data[t.name])) || LEGACY_KEYS.some((k) => Array.isArray(data[k]));
}

/**
 * Replace every table present in `data` (tables missing from the file are left untouched, so
 * backups from older versions restore cleanly).
 * Older files are upgraded on the way in:
 *  - Task.startDate/startTime are dropped
 *  - subtasks + to-do items become Do-List items
 *  - plain-text notes become rich text; wishlist items and checklists become notes
 */
export async function importTables(data: Record<string, unknown>): Promise<void> {
  const arr = (k: string) => (Array.isArray(data[k]) ? (data[k] as any[]) : undefined);

  const tasks = arr('tasks')?.map((r: any) => {
    const { startDate: _s, startTime: _t, ...rest } = r ?? {};
    return rest;
  });

  const legacy = convertLegacy({
    tasks: tasks ?? [],
    subtasks: arr('subtasks'),
    todoLists: arr('todoLists'),
    todoItems: arr('todoItems'),
    notes: arr('notes'),
    wishlistItems: arr('wishlistItems'),
    checklists: arr('checklists'),
    checklistItems: arr('checklistItems'),
  });

  // Rows to write per current table (legacy conversions override/extend the raw arrays)
  const rowsFor = (name: string): any[] | undefined => {
    if (name === 'tasks') return tasks;
    if (name === 'notes') return legacy.notes ?? arr('notes');
    if (name === 'doItems') {
      const current = arr('doItems');
      if (!legacy.doItems) return current;
      return current ? [...current, ...legacy.doItems.filter((d) => !current.some((c) => c.id === d.id))] : legacy.doItems;
    }
    return arr(name);
  };

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      const rows = rowsFor(table.name);
      if (!rows) continue;
      await table.clear();
      if (rows.length > 0) await table.bulkPut(rows);
    }
  });
}
