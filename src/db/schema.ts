import { normalizeHabitCategory } from '../engine/habitCategories';
import { convertLegacy } from './legacy';
import Dexie, { Table } from 'dexie';

/**
 * A granular, trackable component of a primary habit.
 * Example: habit "Study Cybersecurity" -> sub-habits grouped by `topic`
 * ("Networking") with a precise `activity` ("Trace a TCP 3-way handshake in Wireshark").
 * Daily state lives in HabitLog.subHabitsState keyed by SubHabit.id.
 */
export interface SubHabit {
  id: string;
  title: string;
  /** Sub-topic this activity belongs to (e.g. "Networking"). Used for grouping. */
  topic?: string;
  /** The precise activity to perform. */
  activity?: string;
  /** Optional measurable target for this sub-habit (e.g. 30 minutes, 2 chapters). */
  targetValue?: number;
  unit?: string;
  estimatedMinutes?: number;
  order?: number;
  completed: boolean;
  status?: 'completed' | 'failed' | 'pending';
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: 'Fitness & Health' | 'Learning & Growth' | 'Work & Projects' | string;
  icon?: string;
  frequency?: 'daily' | 'weekly' | 'custom_days';
  frequencyMode?: 'everyday' | 'custom';
  selectedDays?: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  frequencyType?: string;
  frequencyConfig?: any;
  targetDaysPerWeek?: number;
  customDays?: number[];
  targetValue?: number;
  unit?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  /** Reminder times ("HH:mm", 24h) at which a pop-up / push notification is shown on days the habit is scheduled. */
  reminderTimes?: string[];
  startTime?: string; // e.g. "08:00"
  endTime?: string;   // e.g. "09:00"
  amPm?: 'AM' | 'PM';
  color: string;
  difficulty?: string;
  priority?: string;
  notes?: string;
  subHabits?: SubHabit[];
  startDate?: string;
  endDate?: string;   // Defined completion timeline (deprecated/optional)
  archived: number | boolean;
  /** Paused habits stay in the list but are excluded from daily targets and stats. */
  paused?: boolean;
  /** Manual ordering from drag-and-drop (ascending). */
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: 'completed' | 'partial' | 'skipped' | 'failed';
  value: number;
  notes?: string;
  subHabitsState?: Record<string, 'completed' | 'failed' | 'pending'>;
  loggedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'completed' | 'remaining' | 'overdue' | 'cancelled' | 'deferred' | 'todo' | 'in_progress' | 'backlog';
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency?: 'once_a_week' | 'daily' | 'custom';
  customDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  // NOTE: Task intentionally has NO startDate/startTime. Scheduling of the
  // actual work lives in TodoItem.scheduledDate/scheduledTime (Task-Level To-Do Lists).
  endDate?: string;
  endTime?: string;
  dueDate?: string;
  dueTime?: string | null;
  /** Free-form grouping such as Learning, Work, Health, Personal. */
  category?: string;
  /** When false the parent is NOT auto-completed/re-opened from its steps. Missing = true. */
  autoComplete?: boolean;
  dailyTimeLimitMinutes?: number;
  completionTimeMinutes?: number;
  projectId?: string | null;
  goalId?: string | null;
  tags?: string[];
  notes?: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * One actionable step inside a Task's Do-List. This single model replaces both the former
 * "subtasks" and the former "to-do list items": it is a checklist step that can OPTIONALLY be scheduled.
 */
export interface DoItem {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
  scheduledDate?: string;  // yyyy-MM-dd — the only place task work is scheduled
  scheduledTime?: string;  // HH:mm
  durationMinutes?: number;
  notes?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  startDate?: string;
  deadline?: string | null;
  targetDeadline?: string;
  goalId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title?: string;
  name?: string;
  description: string;
  category: string;
  timeframe?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  targetMetric?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  color?: string;
  startDate?: string;
  deadline?: string | null;
  status?: 'active' | 'achieved' | 'paused' | 'failed';
  relatedHabitIds?: string[];
  relatedProjectIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type WishlistStatus = 'saved' | 'in_progress' | 'acquired' | 'archived';

/** Extra fields carried by notes of kind "wishlist". */
export interface WishlistMeta {
  status: WishlistStatus;
  priority: 'low' | 'medium' | 'high';
  estimatedCost?: number;
  url?: string;
}

/** The Notepad stores BOTH notes and wishlist items; `kind` tells them apart. */
export interface NoteItem {
  id: string;
  title: string;
  /** Rich text (HTML generated by the editor). Rows without `format` are legacy plain text. */
  content: string;
  format?: 'html';
  kind?: 'note' | 'wishlist';
  category?: string;
  tags?: string[];
  color?: string;
  relatedType?: 'habit' | 'task' | 'project' | 'goal' | 'finance' | 'general';
  relatedId?: string;
  wishlist?: WishlistMeta;
  pinned?: boolean;
  favorite?: boolean;
  /** Locked notes are read-only in the editor until unlocked. */
  locked?: boolean;
  /** Links to related external resources (validated http/https only). */
  related?: { id: string; title: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'upi' | 'credit_card' | 'savings' | 'investment';
  balance: number;
  currency: string;
  color?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'refund' | 'adjustment';
  amount: number;
  accountId: string;
  toAccountId?: string;
  category: string;
  date: string;
  time?: string;
  merchant?: string;
  /** Informational label (ISO code). Amounts are not converted between currencies. */
  currency?: string;
  paymentMethod?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
}

export interface FinanceBudget {
  id: string;
  category: string;
  amountLimit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate?: string;
}

export interface FinanceSavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  content?: string;
  notes?: string;
  wins: string[];
  blockers?: string[];
  challenges?: string[];
  gratitude?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt: string;
}

export interface DailySnapshotData {
  productivityScore: string;     // e.g. "82/100"
  habitCompletion: string;       // e.g. "8/10"
  taskCompletion: string;        // e.g. "7/9"
  timeLogged: string;            // e.g. "5h 24m"
  focusEfficiency: string;       // e.g. "87%"
  goalsProgress: string;         // e.g. "3/4"
  overdueTasks: number;          // e.g. 2
  currentStreak: string;         // e.g. "14 days"
  dailyCompletionRate: string;   // e.g. "80%"
  taskReviewStats: {
    planned: number;
    completed: number;
    remaining: number;
    overdue: number;
    cancelled: number;
    deferred: number;
  };
}

export interface DailyReview {
  id: string;
  date: string;
  productivityScore?: number;
  habitCompletionPct?: number;
  taskCompletionPct?: number;
  unifiedReviewNotes?: string;
  accomplished?: string;
  missed?: string;
  whyMissed?: string;
  carryForwardNotes?: string;
  mood?: number;
  energy?: number;
  reflection?: string;
  rating?: number;
  snapshotData?: DailySnapshotData;
  /** Timestamped reflections appended to this date. Newest last. */
  entries?: DailyReviewEntry[];
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface DailyReviewEntry {
  id: string;
  text: string;
  rating?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}


/** Credentials/config for ONE provider mode. Local and Cloud are stored independently. */
export interface AIProviderProfile {
  model: string;
  endpoint: string;
  apiKey: string;
}

export interface AppSettings {
  id: string;
  userName: string;
  /** Legacy plain-text password from older versions; converted to a hash on first successful login. */
  appPassword?: string;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  /** Registered theme id (see src/theme/themes.ts). Missing on pre-v7 rows; migrated on upgrade. */
  themeId?: 'sage-minimal' | 'warm-monochrome' | 'dark-mode';
  fontId?: 'inter' | 'plex' | 'manrope' | 'editorial' | 'serif';
  backgroundId?: string;
  /** Profile */
  gender?: string;
  email?: string;
  dob?: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  occupation?: string;
  /** Profile picture as a small (≤256px) JPEG data URL, stored on this device only. */
  avatar?: string;
  /** Salted PBKDF2 hash of the account password (see src/auth). Never stored in plain text. */
  passwordHash?: string;
  passwordSalt?: string;
  accountCreatedAt?: string;
  /** Currency used for every finance entry until the user changes it (ISO code). */
  financeCurrency?: string;
  weekStartDay: number;
  productivityWeights: {
    habitWeight: number;
    taskWeight: number;
    focusWeight: number;
    goalWeight: number;
  };
  streakSkipRule: 'pause' | 'reset' | 'forgive' | 'break';
  streakFreezeEarned: number;
  streakFreezeActiveUntil?: string | null;
  consecutiveDays100Pct: number;
  lastLoginDate?: string;
  /** Master switch for habit reminders (default on). */
  habitRemindersEnabled?: boolean;
  /** Daily task progress summary: once, twice daily, or custom times. */
  taskSummary?: { enabled: boolean; mode: 'once' | 'twice' | 'custom'; times: string[] };
}

export interface AIConversation {
  id: string;
  title: string;
  entityType?: 'habit' | 'task' | 'project' | 'goal' | 'general';
  entityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metadata?: {
    suggestedPrompts?: string[];
    actionCards?: {
      id: string;
      type: 'create_task' | 'create_habit' | 'create_goal';
      title: string;
      payload: any;
      executed?: boolean;
    }[];
    metricsUsed?: string[];
  };
}

export interface AISettings {
  id: string;
  /** Which profile is ACTIVE. The user's explicit selection; never reset implicitly. */
  mode: 'local' | 'cloud';
  provider: 'ollama' | 'cloud' | string;
  // Mirrors of the active profile, kept for backward compatibility with older readers.
  model: string;
  apiKey?: string;
  endpoint?: string;
  /** Independent per-mode configuration. Switching modes never overwrites the other one. */
  profiles?: { local: AIProviderProfile; cloud: AIProviderProfile };
  temperature: number;
  tone?: 'analytical' | 'motivational' | 'concise' | 'strict' | 'coaching' | 'custom';
  behavioralFramework?: string;
  privacy: {
    allowHabitData: boolean;
    allowTaskData: boolean;
    allowProjectData: boolean;
    allowGoalData: boolean;
    allowJournalData: boolean;
    allowHistoricalData: boolean;
  };
  enableStreaming: boolean;
}

export class HabitOSDatabase extends Dexie {
  habits!: Table<Habit>;
  habitLogs!: Table<HabitLog>;
  tasks!: Table<Task>;
  projects!: Table<Project>;
  goals!: Table<Goal>;
  journalEntries!: Table<JournalEntry>;
  dailyReviews!: Table<DailyReview>;
  categories!: Table<Category>;
  tags!: Table<Tag>;
  settings!: Table<AppSettings>;
  aiConversations!: Table<AIConversation>;
  aiMessages!: Table<AIMessage>;
  aiSettings!: Table<AISettings>;
  notes!: Table<NoteItem>;
  doItems!: Table<DoItem>;
  financeAccounts!: Table<FinanceAccount>;
  financeTransactions!: Table<FinanceTransaction>;
  financeBudgets!: Table<FinanceBudget>;
  financeSavingsGoals!: Table<FinanceSavingsGoal>;

  constructor() {
    super('HabitOSDB');
    this.version(4).stores({
      habits: 'id, name, category, archived',
      habitLogs: 'id, habitId, date, status, [habitId+date]',
      tasks: 'id, title, status, priority, dueDate, startDate, endDate, projectId, goalId',
      subtasks: 'id, taskId, completed',
      projects: 'id, name, category, status, goalId',
      goals: 'id, title, category, status',
      journalEntries: 'id, date, mood, energy',
      dailyReviews: 'id, date',
      categories: 'id, name',
      tags: 'id, name',
      settings: 'id',
      aiConversations: 'id, entityType, entityId, updatedAt',
      aiMessages: 'id, conversationId, timestamp',
      aiSettings: 'id',
      wishlistItems: 'id, title, category, status, priority',
      notes: 'id, title, category, relatedType, relatedId, pinned',
      financeAccounts: 'id, name, type',
      financeTransactions: 'id, type, accountId, category, date',
      financeBudgets: 'id, category, period',
      financeSavingsGoals: 'id, title, category'
    });

    // v5: Workspace layer, Task.startDate removal, per-mode AI profiles.
    this.version(5)
      .stores({
        tasks: 'id, title, status, priority, dueDate, endDate, projectId, goalId',
        notes: 'id, title, category, relatedType, relatedId, pinned, topicId',
        wishlistItems: 'id, title, category, status, priority, topicId',
        topics: 'id, parentId, name, [ownerType+ownerId]',
        todoLists: 'id, taskId',
        todoItems: 'id, listId, taskId, scheduledDate, completed, topicId',
        checklists: 'id, ownerType, ownerId, topicId',
        checklistItems: 'id, checklistId',
        entityLinks: 'id, [fromType+fromId], [toType+toId]',
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();

        // (a) Task.startDate/startTime are removed. Preserve any scheduling the user
        //     already had by moving it into the Task-Level To-Do List (its new home).
        const tasksTable = tx.table('tasks');
        const listsTable = tx.table('todoLists');
        const itemsTable = tx.table('todoItems');
        const tasks = await tasksTable.toArray();
        for (const t of tasks) {
          if (t.startDate) {
            const listId = `todo-list-${t.id}`;
            await listsTable.put({ id: listId, taskId: t.id, title: 'Schedule', order: 0, createdAt: now, updatedAt: now });
            await itemsTable.put({
              id: `todo-${t.id}-migrated`,
              listId,
              taskId: t.id,
              title: t.title,
              completed: t.status === 'completed',
              completedAt: t.status === 'completed' ? (t.completedAt || now) : null,
              scheduledDate: t.startDate,
              scheduledTime: t.startTime || undefined,
              order: 0,
              notes: 'Migrated from the task start date.',
              createdAt: now,
              updatedAt: now,
            });
          }
          delete t.startDate;
          delete t.startTime;
          await tasksTable.put(t);
        }

        // (b) AI settings: split the single shared model/endpoint/apiKey slot into
        //     independent local + cloud profiles so neither can clobber the other.
        const aiTable = tx.table('aiSettings');
        const ai = await aiTable.get('default');
        if (ai && !ai.profiles) {
          const localDefault = { model: 'llama3.1', endpoint: 'http://localhost:11434/v1/chat/completions', apiKey: '' };
          const cloudDefault = { model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1', apiKey: '' };
          const active = { model: ai.model || '', endpoint: ai.endpoint || '', apiKey: ai.apiKey || '' };
          await aiTable.put({
            ...ai,
            profiles: {
              local: ai.mode === 'local' ? { ...localDefault, ...active } : localDefault,
              cloud: ai.mode === 'cloud' ? { ...cloudDefault, ...active } : cloudDefault,
            },
          });
        }
      });

    // v6: Do-List consolidation (subtasks + to-do items -> doItems), Notepad consolidation
    //     (notes + wishlist + checklists -> notes), and removal of the Topics/links feature.
    this.version(6)
      .stores({
        doItems: 'id, taskId, scheduledDate, completed',
        notes: 'id, title, kind, pinned, updatedAt',
        subtasks: null,
        todoLists: null,
        todoItems: null,
        wishlistItems: null,
        checklists: null,
        checklistItems: null,
        topics: null,
        entityLinks: null,
      })
      .upgrade(async (tx) => {
        const read = (name: string) => tx.table(name).toArray().catch(() => [] as any[]);
        const legacy = convertLegacy({
          tasks: await read('tasks'),
          subtasks: await read('subtasks'),
          todoLists: await read('todoLists'),
          todoItems: await read('todoItems'),
          notes: await read('notes'),
          wishlistItems: await read('wishlistItems'),
          checklists: await read('checklists'),
          checklistItems: await read('checklistItems'),
        });
        if (legacy.doItems) await tx.table('doItems').bulkPut(legacy.doItems);
        if (legacy.notes) {
          await tx.table('notes').clear();
          await tx.table('notes').bulkPut(legacy.notes);
        }
      });

    // v7: Theme engine. The Rain Forest / Foggy Mist environments were removed. Existing users keep a
    //     calm green look (Sage Minimal); the obsolete environment fields are dropped.
    this.version(7)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table('settings');
        const rows = await table.toArray();
        for (const row of rows) {
          const next: any = { ...row };
          if (!next.themeId) next.themeId = next.environmentTheme === 'rain_forest' || next.environmentTheme === 'foggy_mist' ? 'sage-minimal' : 'porcelain-ink';
          if (!next.texture) next.texture = 'pure';
          if (typeof next.decorations !== 'boolean') next.decorations = true;
          next.theme = 'light';
          for (const k of ['environmentTheme', 'animationEnabled', 'ambientMotionEnabled', 'environmentIntensity', 'motionSpeed', 'mistRainDensity']) delete next[k];
          await table.put(next);
        }
      });

    // v8: habit categories were consolidated to Health, Learning, Work, Growth, WellBeing.
    this.version(8)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table('habits');
        for (const h of await table.toArray()) {
          const c = normalizeHabitCategory(h.category);
          if (c !== h.category) await table.update(h.id, { category: c });
        }
      });

    // v9: Appearance is now Theme + Font + Background. Porcelain & Ink and textures were removed.
    this.version(9)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table('settings');
        for (const row of await table.toArray()) {
          const next: any = { ...row };
          if (next.themeId === 'porcelain-ink' || !next.themeId) next.themeId = 'sage-minimal';
          if (!next.fontId) next.fontId = 'inter';
          if (!next.backgroundId) next.backgroundId = 'sage-leaves';
          delete next.texture; delete next.decorations;
          await table.put(next);
        }
      });
  }
}

export const db = new HabitOSDatabase();
