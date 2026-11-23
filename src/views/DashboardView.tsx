import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays, startOfMonth, endOfMonth, subMonths, parseISO, isSameDay } from 'date-fns';
import { Calendar, CheckSquare, Clock, Leaf, Plus, Zap, ChevronRight, FileText, Check, TrendingUp, Square, Play, Pause } from 'lucide-react';
import { db, Habit, Task } from '../db/schema';
import { ActiveTab } from '../App';
import { AddHabitModal } from '../components/AddHabitModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { ProgressRing, Delta, PanelHeader, habitIcon, formatHabitTime } from '../components/ui';
import { money, useCurrency } from '../lib/currency';
import { relativeTime } from '../notepad/noteUtils';
import { useFocus, minutesOn, formatMinutes } from '../lib/focus';

interface Props { setActiveTab: (tab: ActiveTab) => void }

type Row = { key: string; title: string; category: string; minutes: number | null; label: string | null; status: 'completed' | 'in_progress' | 'high' | 'medium' | 'low' | 'open'; done: boolean; toggle?: () => void; partial?: number };

const toMinutes = (time?: string | null, amPm?: 'AM' | 'PM'): number | null => {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  const hh = amPm ? (h % 12) + (amPm === 'PM' ? 12 : 0) : h;
  return hh * 60 + (m || 0);
};
const label12 = (mins: number) => { const h = Math.floor(mins / 60); const m = mins % 60; return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

const STATUS_CHIP: Record<Row['status'], { text: string; cls: string } | null> = {
  completed: { text: 'Completed', cls: 'chip-success' }, in_progress: { text: 'In Progress', cls: 'chip-warning' },
  high: { text: 'High', cls: 'chip-danger' }, medium: { text: 'Medium', cls: 'chip-warning' }, low: { text: 'Low', cls: 'chip-info' }, open: null,
};

const Panel: React.FC<{ go: (t: ActiveTab) => void; icon: React.ReactNode; title: string; sub?: string; action?: { label: string; to: ActiveTab }; right?: React.ReactNode; children: React.ReactNode; label: string }> = ({ go, icon, title, sub, action, right, children, label }) => (
  <section className="liquid-panel dash-panel" aria-label={label}>
    <header className="dash-panel-head">
      <div style={{ minWidth: 0 }}><h3 className="dash-panel-title">{icon}{title}</h3>{sub && <div className="subtitle dash-sub">{sub}</div>}</div>
      {right}{action && <button type="button" className="link-action" onClick={() => go(action.to)}>{action.label} →</button>}
    </header>
    <div className="dash-panel-body">{children}</div>
  </section>
);
const KPI: React.FC<{ icon: React.ReactNode; title: string; value: React.ReactNode; foot: React.ReactNode; label: string }> = ({ icon, title, value, foot, label }) => (
  <div className="liquid-panel dash-kpi" aria-label={label}>
    <span className="dash-kpi-icon">{icon}</span>
    <div style={{ minWidth: 0 }}><strong>{title}</strong><div className="num dash-kpi-value">{value}</div>{foot}</div>
  </div>
);


export const DashboardView: React.FC<Props> = ({ setActiveTab }) => {
  const habitsAll = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const logs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const doItems = useLiveQuery(() => db.doItems.toArray()) || [];
  const txs = useLiveQuery(() => db.financeTransactions.toArray()) || [];
  const notes = useLiveQuery(() => db.notes.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));
  const focus = useFocus();
  const [currency] = useCurrency();

  const [habitModal, setHabitModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [habitToEdit] = useState<Habit | null>(null);

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const habits = habitsAll.filter((h) => !h.paused);
  const userName = settings?.userName || 'there';
  const hr = now.getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  const data = useMemo(() => {
    const doneOn = (d: string) => habits.filter((h) => logs.some((l) => l.habitId === h.id && l.date === d && l.status === 'completed')).length;
    const habitsDone = doneOn(today), habitsDoneY = doneOn(yesterday);
    const dueToday = tasks.filter((t) => t.dueDate === today && t.status !== 'cancelled');
    const tasksDone = dueToday.filter((t) => t.status === 'completed').length;
    const completedOn = (d: string) => tasks.filter((t) => t.status === 'completed' && (t.completedAt || '').slice(0, 10) === d).length;
    const tasksDoneDelta = completedOn(today) - completedOn(yesterday);
    const totalItems = habits.length + dueToday.length;
    const progress = totalItems ? Math.round(((habitsDone + tasksDone) / totalItems) * 100) : 0;

    // Schedule rows
    const rows: Row[] = [];
    for (const h of habits) {
      const log = logs.find((l) => l.habitId === h.id && l.date === today);
      const done = log?.status === 'completed';
      const m = toMinutes(h.startTime, h.amPm);
      rows.push({ key: `h-${h.id}`, title: h.name, category: h.category, minutes: m, label: m !== null ? label12(m) : null,
        status: done ? 'completed' : log?.status === 'partial' ? 'in_progress' : 'open', done, partial: log?.status === 'partial' ? Math.round((log.value || 0.5) * 100) : undefined,
        toggle: async () => {
          const ex = await db.habitLogs.where('[habitId+date]').equals([h.id, today]).first();
          if (ex) await db.habitLogs.update(ex.id, { status: done ? 'failed' : 'completed', value: done ? 0 : 1, loggedAt: new Date().toISOString() });
          else await db.habitLogs.add({ id: `log-${Date.now()}`, habitId: h.id, date: today, status: 'completed', value: 1, loggedAt: new Date().toISOString() });
        } });
    }
    for (const t of dueToday) {
      const m = toMinutes(t.dueTime);
      rows.push({ key: `t-${t.id}`, title: t.title, category: t.tags?.[0] ? `#${t.tags[0]}` : 'Task', minutes: m, label: m !== null ? label12(m) : null,
        status: t.status === 'completed' ? 'completed' : (t.priority === 'critical' ? 'high' : t.priority) as Row['status'], done: t.status === 'completed',
        toggle: () => db.tasks.update(t.id, { status: t.status === 'completed' ? 'todo' : 'completed', completedAt: t.status === 'completed' ? null : new Date().toISOString(), updatedAt: new Date().toISOString() }) });
    }
    for (const it of doItems.filter((i) => i.scheduledDate === today)) {
      const parent = tasks.find((t) => t.id === it.taskId);
      const m = toMinutes(it.scheduledTime);
      rows.push({ key: `d-${it.id}`, title: it.title, category: parent?.title || 'Task step', minutes: m, label: m !== null ? label12(m) : null,
        status: it.completed ? 'completed' : 'open', done: it.completed,
        toggle: () => db.doItems.update(it.id, { completed: !it.completed, completedAt: it.completed ? null : new Date().toISOString(), updatedAt: new Date().toISOString() }) });
    }
    rows.sort((a, b) => (a.minutes ?? 9999) - (b.minutes ?? 9999));

    // Consistency: last 7 days; a day counts when at least half of active habits were completed.
    const days = Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i));
    const week = days.map((d) => { const ds = format(d, 'yyyy-MM-dd'); const n = doneOn(ds); return { d, ok: habits.length > 0 && n / habits.length >= 0.5 }; });
    const okDays = week.filter((w) => w.ok).length;

    // Task overview
    const crit = tasks.filter((t) => t.priority === 'critical' && t.status !== 'cancelled');
    const open = tasks.filter((t) => !['completed', 'cancelled'].includes(t.status));
    const openIds = new Set(open.map((t) => t.id));
    const openSteps = doItems.filter((i) => openIds.has(i.taskId));
    const allT = tasks.filter((t) => t.status !== 'cancelled');

    // Finance (this month vs last month)
    const inMonth = (d: Date) => txs.filter((x) => { const dt = parseISO(x.date); return dt >= startOfMonth(d) && dt <= endOfMonth(d); });
    const sum = (arr: typeof txs, type: string) => arr.filter((x) => x.type === type).reduce((a, x) => a + x.amount, 0);
    const cur = inMonth(now), prev = inMonth(subMonths(now, 1));
    const income = sum(cur, 'income'), spend = sum(cur, 'expense');
    const pIncome = sum(prev, 'income'), pSpend = sum(prev, 'expense');
    const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

    return {
      habitsDone, habitsDelta: habitsDone - habitsDoneY, tasksTotal: dueToday.length, tasksDone, tasksDoneDelta, progress, rows, week, okDays,
      crit: { done: crit.filter((t) => t.status === 'completed').length, total: crit.length },
      active: { done: openSteps.filter((i) => i.completed).length, total: openSteps.length },
      completed: { done: allT.filter((t) => t.status === 'completed').length, total: allT.length },
      income, spend, savings: income - spend, dIncome: pct(income, pIncome), dSpend: pct(spend, pSpend), dSave: pct(income - spend, pIncome - pSpend),
    };
  }, [habits, logs, tasks, doItems, txs, today, yesterday]); // eslint-disable-line react-hooks/exhaustive-deps

  const latestNote = [...notes].filter((n) => n.kind !== 'wishlist').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const focusToday = minutesOn(focus.sessions, today);
  const focusDelta = focusToday - minutesOn(focus.sessions, yesterday);
  const nextUp = data.rows.filter((r) => !r.done && r.minutes !== null && r.minutes >= nowMinutes).slice(0, 4);
  const sched = data.rows.filter((r) => r.key.startsWith('h-') || r.key.startsWith('t-') || r.key.startsWith('d-'));

  // ---- extra data for the Home grid ----
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const extra = useMemo(() => {
    const dayPct = (d: Date) => { const ds = format(d, 'yyyy-MM-dd'); const n = habits.filter((h) => logs.some((l) => l.habitId === h.id && l.date === ds && l.status === 'completed')).length; return habits.length ? Math.round((n / habits.length) * 100) : 0; };
    const week = Array.from({ length: 7 }, (_, i) => { const d = subDays(now, 6 - i); return { d, pct: dayPct(d) }; });
    const avg = Math.round(week.reduce((a, w) => a + w.pct, 0) / 7);
    const best = week.reduce((b, w) => (w.pct > b.pct ? w : b), week[0]);
    let streak = 0; for (let i = 0; i < 365; i++) { if (dayPct(subDays(now, i)) > 0) streak++; else if (i > 0) break; else continue; }
    const st = (f: (t: Task) => boolean) => tasks.filter((t) => t.status !== 'cancelled' && f(t)).length;
    const tstat = {
      completed: st((t) => t.status === 'completed'), progress: st((t) => t.status === 'in_progress'),
      pending: st((t) => !['completed', 'in_progress'].includes(t.status)), dueToday: st((t) => t.dueDate === today && t.status !== 'completed'),
      overdue: st((t) => !!t.dueDate && t.dueDate < today && t.status !== 'completed'),
    };
    const balance = txs.reduce((a, x) => a + (x.type === 'income' ? x.amount : x.type === 'expense' ? -x.amount : 0), 0);
    const marked = new Set<string>(); tasks.forEach((t) => t.dueDate && marked.add(t.dueDate)); doItems.forEach((i) => i.scheduledDate && marked.add(i.scheduledDate));
    const proj = projects.filter((p) => ['active', 'planning'].includes(p.status)).slice(0, 3).map((p) => {
      const pt = tasks.filter((t) => t.projectId === p.id && t.status !== 'cancelled'); const done = pt.filter((t) => t.status === 'completed').length;
      return { p, pct: pt.length ? Math.round((done / pt.length) * 100) : 0 };
    });
    const insights = [
      data.progress < 30 ? { k: 'Build Momentum', t: 'Complete 2–3 key habits to reach ≥30% today.', icon: <Zap size={16} /> } : { k: 'Great Momentum', t: `You are at ${data.progress}% today. Keep it up!`, icon: <Zap size={16} /> },
      { k: 'Maintain Consistency', t: `Your weekly average is ${avg}%. Aim for ≥60%.`, icon: <TrendingUp size={16} /> },
      focusToday === 0 ? { k: 'Focus Opportunity', t: 'No focus time logged yet. Try a 25-min session.', icon: <Clock size={16} /> } : { k: 'Focus Logged', t: `${formatMinutes(focusToday)} of focus today.`, icon: <Clock size={16} /> },
      data.tasksTotal === 0 ? { k: 'Plan Ahead', t: 'You have no tasks today. Add key tasks or goals.', icon: <Calendar size={16} /> } : { k: 'Stay on Tasks', t: `${data.tasksTotal - data.tasksDone} task(s) still open today.`, icon: <CheckSquare size={16} /> },
    ];
    return { week, avg, best, streak, tstat, balance, marked, proj, insights };
  }, [habits, logs, tasks, doItems, txs, projects, today, data.progress, data.tasksTotal, data.tasksDone, focusToday]); // eslint-disable-line react-hooks/exhaustive-deps

  const [calMonth, setCalMonth] = useState(() => startOfMonth(new Date()));
  const monthDays = useMemo(() => { const first = startOfMonth(calMonth); const lead = first.getDay(); const n = endOfMonth(calMonth).getDate(); return [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1))] as (Date | null)[]; }, [calMonth]);

  return (
    <div className="dash">
      <div className="dash-top">
        <div style={{ minWidth: 0 }}>
          <h1 className="dash-greet">{greeting}, {userName}!</h1>
          <p className="subtitle" style={{ fontSize: '0.88rem' }}>Here's your complete overview — habits, tasks, focus, finance, projects and insights in one place.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 'none' }}>
          <button className="btn btn-secondary" onClick={() => setTaskModal(true)}><Plus size={15} /> Add Task</button>
          <button className="btn btn-primary" onClick={() => setHabitModal(true)}><Leaf size={15} /> Add Habit</button>
        </div>
      </div>

      <div className="dash-grid">
        <KPI label="Today's progress" icon={<ProgressRing pct={data.progress} size={58} stroke={6} />} title="Today's Progress" value={<span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{data.progress >= 60 ? "You're on track!" : 'Keep going!'}</span>} foot={null} />
        <KPI label="Habits" icon={<Leaf size={22} />} title="Habits" value={`${data.habitsDone} / ${habits.length} completed`} foot={<Delta value={data.habitsDelta} text="from yesterday" />} />
        <KPI label="Tasks" icon={<CheckSquare size={22} />} title="Tasks" value={`${data.tasksDone} / ${data.tasksTotal} completed`} foot={<Delta value={data.tasksDoneDelta} text="from yesterday" />} />
        <KPI label="Focus time" icon={<Clock size={22} />} title="Focus Time" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{focus.active ? `${String(Math.floor(focus.elapsedMs / 60000)).padStart(2, '0')}:${String(Math.floor((focus.elapsedMs % 60000) / 1000)).padStart(2, '0')}` : formatMinutes(focusToday)}
          <button type="button" className="btn btn-secondary btn-icon btn-xs" onClick={focus.toggle} aria-label={focus.active?.running ? 'Pause focus session' : focus.active ? 'Continue focus session' : 'Start focus session'}>{focus.active?.running ? <Pause size={13} /> : <Play size={13} />}</button>
          {focus.active && <button type="button" className="btn btn-secondary btn-xs" onClick={focus.finish}>Finish</button>}</span>} foot={<Delta value={focusDelta} suffix="m" text="from yesterday" />} />

        <Panel go={setActiveTab} label="Today's schedule" icon={<Calendar size={17} />} title="Today's Schedule" sub="Your planned habits and tasks for today" right={<span className="chip chip-success num">{data.progress}% Done</span>} action={{ label: 'Calendar', to: 'calendar' }}>
          {sched.length === 0 ? <p className="subtitle">Nothing scheduled today. Add a habit or a task to get started.</p> : (
            <ul className="dash-list">
              {sched.map((r) => (
                <li key={r.key} className="dash-row">
                  <button type="button" role="checkbox" aria-checked={r.done} aria-label={`${r.done ? 'Mark incomplete' : 'Mark complete'}: ${r.title}`} className={`check-circle ${r.done ? 'is-done' : ''}`} onClick={r.toggle}>{r.done && <Check size={13} />}</button>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="dash-row-title" style={{ textDecoration: r.done ? 'line-through' : 'none', color: r.done ? 'var(--text-muted)' : undefined }}>{r.title}</div><div className="subtitle dash-sub">{r.category}</div></div>
                  <span className="num dash-time">{r.label ?? 'Anytime'}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel go={setActiveTab} label="Next up" icon={<Zap size={17} />} title="Next Up" sub="What's coming next" action={{ label: 'All', to: 'calendar' }}>
          {nextUp.length === 0 ? <p className="subtitle">No more timed items today.</p> : (
            <ol className="dash-list">
              {nextUp.map((r) => (
                <li key={r.key} className="dash-row" style={{ gap: '0.6rem' }}>
                  <span className="num dash-time" style={{ minWidth: 62 }}>{r.label}</span>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', flex: 'none' }} />
                  <div className="dash-chip-row"><div className="dash-row-title">{r.title}</div><div className="subtitle dash-sub">{r.category}</div></div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel go={setActiveTab} label="Habit consistency" icon={<TrendingUp size={17} />} title="Habit Consistency" sub="Your habit completion trend" right={<span className="subtitle dash-sub">Last 7 Days</span>}>
          <div className="dash-bars" role="img" aria-label="Habit completion for the last 7 days">
            {extra.week.map((w) => (
              <div key={w.d.toISOString()} className="dash-bar-col">
                <div className="dash-bar-track"><div className="dash-bar-fill" style={{ height: `${Math.max(w.pct, 3)}%`, opacity: w.pct ? 1 : 0.35 }} title={`${w.pct}%`} /></div>
                <span className="subtitle dash-sub">{format(w.d, 'EEE')}</span>
              </div>
            ))}
          </div>
          <div className="dash-stats">
            <div><strong className="num">{extra.avg}%</strong><span className="subtitle dash-sub">Weekly Avg.</span></div>
            <div><strong className="num">{habits.filter((h) => logs.some((l) => l.habitId === h.id && l.date === format(extra.best.d, 'yyyy-MM-dd') && l.status === 'completed')).length} / {habits.length}</strong><span className="subtitle dash-sub">Best Day</span></div>
            <div><strong className="num">🔥 {extra.streak}</strong><span className="subtitle dash-sub">Day Streak</span></div>
          </div>
        </Panel>

        <Panel go={setActiveTab} label="Task overview" icon={<CheckSquare size={17} />} title="Task Overview" sub="All tasks at a glance" action={{ label: 'All', to: 'dolist' }}>
          <div className="dash-tasklist">
            {([['Completed', extra.tstat.completed, 'var(--success)'], ['In Progress', extra.tstat.progress, 'var(--info, var(--accent-primary))'], ['Pending', extra.tstat.pending, 'var(--text-muted)'], ['Due Today', extra.tstat.dueToday, 'var(--warning)'], ['Overdue', extra.tstat.overdue, 'var(--danger)']] as const).map(([name, n, color]) => (
              <div key={name} className="dash-task-chip" style={{ borderLeft: `3px solid ${color}` }}><span>{name}</span><strong className="num">{n}</strong></div>
            ))}
          </div>
        </Panel>

        <Panel go={setActiveTab} label="Financial snapshot" icon={<Square size={17} />} title="Financial Snapshot" sub="Your financial overview" action={{ label: 'Finance', to: 'finance' }} right={<span className="subtitle dash-sub">This Month</span>}>
          <div className="dash-balance"><div className="subtitle dash-sub">Current Balance</div><div className="num dash-balance-value">{money(extra.balance, currency)}</div>{data.dSave !== null && <span className="subtitle dash-sub">{data.dSave >= 0 ? '↑' : '↓'} {Math.abs(data.dSave)}% savings vs last month</span>}</div>
          <div className="dash-two">
            <div className="dash-mini"><span className="subtitle dash-sub">Income</span><strong className="num">{money(data.income, currency)}</strong></div>
            <div className="dash-mini"><span className="subtitle dash-sub">Expenses</span><strong className="num">{money(data.spend, currency)}</strong></div>
          </div>
          <div className="progress-bar-track" style={{ height: 6, marginTop: 8 }}><div style={{ width: `${data.income ? Math.min(100, (data.spend / data.income) * 100) : 0}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 999 }} /></div>
          <div className="subtitle dash-sub" style={{ marginTop: 4 }}>Spent: {data.income ? Math.round((data.spend / data.income) * 100) : 0}% of income</div>
        </Panel>

        <Panel go={setActiveTab} label="Calendar" icon={<Calendar size={17} />} title="Calendar" right={<span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><button type="button" className="btn btn-secondary btn-icon btn-xs" aria-label="Previous month" onClick={() => setCalMonth(subMonths(calMonth, 1))}>‹</button><strong className="dash-sub num" style={{ minWidth: 78, textAlign: 'center' }}>{format(calMonth, 'MMM yyyy')}</strong><button type="button" className="btn btn-secondary btn-icon btn-xs" aria-label="Next month" onClick={() => setCalMonth(subMonths(calMonth, -1))}>›</button></span>}>
          <div className="dash-cal" role="grid" aria-label={format(calMonth, 'MMMM yyyy')}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="subtitle dash-cal-h">{d}</span>)}
            {monthDays.map((d, i) => d ? (
              <button type="button" key={i} onClick={() => setActiveTab('calendar')} className={`dash-cal-d ${isSameDay(d, now) ? 'is-today' : ''}`} aria-label={format(d, 'EEEE, MMM d')}>{d.getDate()}{extra.marked.has(format(d, 'yyyy-MM-dd')) && <i aria-hidden="true" />}</button>
            ) : <span key={i} />)}
          </div>
        </Panel>

        <Panel go={setActiveTab} label="Workspace and active projects" icon={<FileText size={17} />} title="Workspace / Projects" sub="Your ongoing work" action={{ label: 'View All', to: 'workspace' }}>
          {extra.proj.length === 0 && !latestNote ? <p className="subtitle">No active projects or notes yet. Open Workspace to start one.</p> : (
            <ul className="dash-list">
              {extra.proj.map(({ p, pct }) => (
                <li key={p.id} className="dash-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span className="dash-row-title">{p.name}</span><span className="num dash-sub">{pct}%</span></div>
                  <div className="progress-bar-track" style={{ height: 5 }}><div style={{ width: `${pct}%`, height: '100%', background: p.color || 'var(--accent-primary)', borderRadius: 999 }} /></div>
                </li>
              ))}
              {latestNote && <li className="dash-row"><FileText size={14} aria-hidden="true" /><div style={{ flex: 1, minWidth: 0 }}><div className="dash-row-title">{latestNote.title || 'Untitled'}</div><div className="subtitle dash-sub">Latest note · {relativeTime(latestNote.updatedAt)}</div></div></li>}
            </ul>
          )}
        </Panel>

        <Panel go={setActiveTab} label="Smart insights" icon={<Zap size={17} />} title="Smart Insights / AI Analyst" sub="Personalized recommendations" action={{ label: 'Analyze', to: 'insights' }}>
          <ul className="dash-list">
            {extra.insights.map((i) => (
              <li key={i.k}><button type="button" className="dash-insight" onClick={() => setActiveTab('insights')}><span className="dash-insight-icon">{i.icon}</span><span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}><strong>{i.k}</strong><span className="subtitle dash-sub" style={{ display: 'block' }}>{i.t}</span></span><ChevronRight size={15} aria-hidden="true" /></button></li>
            ))}
          </ul>
        </Panel>
      </div>

      <AddHabitModal isOpen={habitModal} onClose={() => setHabitModal(false)} habitToEdit={habitToEdit} />
      <AddTaskModal isOpen={taskModal} onClose={() => setTaskModal(false)} />
    </div>
  );
};
