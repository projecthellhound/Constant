// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import { db } from '../db/schema';
import { DashboardView } from '../views/DashboardView';
import { InsightsView } from '../views/InsightsView';

const today = format(new Date(), 'yyyy-MM-dd');
const now = new Date().toISOString();
configure({ asyncUtilTimeout: 5000 }); // slower CI machines: PBKDF2 / IndexedDB waits
beforeEach(async () => {
  localStorage.clear();
  await Promise.all(db.tables.map((t) => t.clear()));
  await db.settings.add({ id: 'default', userName: 'Rithish' } as any);
  await db.habits.add({ id: 'h1', name: 'Morning Workout', category: 'Health', description: '', frequencyMode: 'daily', startTime: '06:30', amPm: 'AM', archived: 0, createdAt: now } as any);
  await db.tasks.bulkAdd([
    { id: 't1', title: 'Review DNS Lab Notes', status: 'planned', priority: 'high', dueDate: today, createdAt: now, updatedAt: now },
    { id: 't2', title: 'Ship tool', status: 'completed', priority: 'critical', dueDate: today, completedAt: now, createdAt: now, updatedAt: now },
  ] as any);
  await db.financeTransactions.bulkAdd([{ id: 'x1', type: 'income', amount: 2480, accountId: 'a', category: 'Salary', date: today, createdAt: now }, { id: 'x2', type: 'expense', amount: 1120, accountId: 'a', category: 'Food', date: today, createdAt: now }] as any);
  await db.notes.add({ id: 'n1', title: 'Productivity tips for deep work and focus.', content: '<p>x</p>', format: 'html', tags: ['learning'], createdAt: now, updatedAt: now });
});
afterEach(cleanup);

describe('Dashboard', () => {
  it('renders greeting, four overview cards and every panel from the spec', async () => {
    render(<DashboardView setActiveTab={() => {}} />);
    expect(await screen.findByText(/Rithish!/)).toBeTruthy();
    expect(screen.getByText(/complete overview/)).toBeTruthy();
    for (const t of [/Today's Progress/, /^Habits$/, /^Tasks$/, /Focus Time/, /Next Up/, /Habit Consistency/, /Task Overview/, /Financial Snapshot/, /Today's Schedule/, /^Calendar$/, /Workspace \/ Projects/, /Smart Insights/]) expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Add Task/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add Habit/ })).toBeTruthy();
    expect((await screen.findAllByText('$2,480.00')).length).toBeGreaterThan(0);   // income
    expect(screen.getAllByText('$1,120.00').length).toBeGreaterThan(0);          // expenses
    expect(screen.getByText('$1,360.00')).toBeTruthy();                           // current balance
    expect(screen.getByText(/Productivity tips for deep work/)).toBeTruthy(); // latest note in Workspace panel
    expect(document.querySelector('.dash')).toBeTruthy(); // single-screen Home grid
  });

  it('completing a schedule row writes a timestamped habit log', async () => {
    render(<DashboardView setActiveTab={() => {}} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Mark complete: Morning Workout' }));
    await waitFor(async () => { const l = (await db.habitLogs.toArray())[0]; expect(l?.status).toBe('completed'); expect(l?.loggedAt).toBeTruthy(); });
  });

  it('focus card starts a session and navigation actions fire', async () => {
    const go = vi.fn();
    render(<DashboardView setActiveTab={go} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Start focus session' }));
    expect(await screen.findByRole('button', { name: 'Pause focus session' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /^Calendar →/ })[0]);
    expect(go).toHaveBeenCalledWith('calendar');
  });
});

describe('Smart Insights', () => {
  it('shows 11 categories, 9 suggestion cards, context and quick insights (no suggested tags)', async () => {
    render(<InsightsView />);
    expect((await screen.findAllByRole('tab')).length).toBe(11);
    expect(screen.getByRole('tab', { name: 'General' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText('Suggested questions').querySelectorAll('button').length).toBe(9);
    expect(screen.getByText(/Rithish! 👋/)).toBeTruthy();
    for (const l of ['Current Context', 'Quick Insights']) expect(screen.getByText(l)).toBeTruthy();
    expect(screen.queryByText('Suggested Tags')).toBeNull();
    expect(screen.getByText(/Press Enter to send/)).toBeTruthy();
  });

  it('keeps the layout fixed: only the chat feed scrolls, composer stays outside it', async () => {
    render(<InsightsView />);
    const feed = await screen.findByRole('log', { name: 'Chat history' });
    expect(feed.style.overflowY).toBe('auto');
    const composer = screen.getByRole('form', { name: 'Message composer' });
    expect(feed.contains(composer)).toBe(false);
    expect(composer.style.overflow).not.toBe('auto');
    const page = feed.closest('.view-container') as HTMLElement;
    expect(page.style.overflow).toBe('hidden');
  });

  it('rejects unsupported attachment types', async () => {
    render(<InsightsView />);
    const input = await screen.findByLabelText('Attachment file');
    fireEvent.change(input, { target: { files: [new File(['x'], 'evil.exe')] } });
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
