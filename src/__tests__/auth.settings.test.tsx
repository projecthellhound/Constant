// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import React from 'react';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { db } from '../db/schema';
import { initializeDatabase, resetAllDataToInitialState } from '../db/seed';
import { hasAccount, createAccount, signIn, checkPassword, changePassword, isSessionActive, endSession } from '../auth/account';
import { LoginPortal } from '../components/LoginPortal';
import { SettingsView, RESET_EVENT } from '../views/SettingsView';
import { Sidebar } from '../components/Sidebar';
import { Brand } from '../components/Brand';
import { ThemeProvider } from '../theme/ThemeProvider';

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

configure({ asyncUtilTimeout: 5000 }); // slower CI machines: PBKDF2 / IndexedDB waits
beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear();
  await Promise.all(db.tables.map((t) => t.clear()));
  await initializeDatabase();
});
afterEach(cleanup);

const seedAccount = async () => { await createAccount({ name: 'Rithish', email: 'r@example.com', password: 'correct-horse' }); };

describe('account + password storage', () => {
  it('stores only a salted hash, never the plain password', async () => {
    expect(hasAccount(await db.settings.get('default'))).toBe(false);
    await seedAccount();
    const s = (await db.settings.get('default'))!;
    expect(hasAccount(s)).toBe(true);
    expect(s.passwordHash).toBeTruthy(); expect(s.passwordSalt).toBeTruthy();
    expect(JSON.stringify(s)).not.toContain('correct-horse');
    expect(isSessionActive()).toBe(true);
  });
  it('signs in only with the right email and password', async () => {
    await seedAccount(); endSession();
    expect(await signIn('r@example.com', 'wrong')).toBe('bad_credentials');
    expect(await signIn('other@example.com', 'correct-horse')).toBe('bad_credentials');
    expect(isSessionActive()).toBe(false);
    expect(await signIn('R@Example.com', 'correct-horse')).toBe('ok');
    expect(isSessionActive()).toBe(true);
  });
  it('upgrades a legacy plain-text password to a hash on first use', async () => {
    await db.settings.update('default', { appPassword: 'legacy-pass' });
    expect(hasAccount(await db.settings.get('default'))).toBe(true);
    expect(await checkPassword('nope')).toBe(false);
    expect(await checkPassword('legacy-pass')).toBe(true);
    const s = (await db.settings.get('default'))!;
    expect(s.appPassword).toBeUndefined(); expect(s.passwordHash).toBeTruthy();
    expect(await checkPassword('legacy-pass')).toBe(true);
  });
  it('changePassword needs the current password', async () => {
    await seedAccount();
    expect(await changePassword('bad', 'brand-new-pass')).toBe(false);
    expect(await changePassword('correct-horse', 'brand-new-pass')).toBe(true);
    expect(await checkPassword('brand-new-pass')).toBe(true);
    expect(await checkPassword('correct-horse')).toBe(false);
  });
});

describe('login portal', () => {
  it('create mode validates then creates the account', async () => {
    const done = vi.fn();
    render(<LoginPortal mode="create" onAuthenticated={done} />);
    expect(screen.getByText('CONSTANT')).toBeTruthy();
    expect(screen.getByText('Personalized Routine Tracker')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Rithish' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'r@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/at least 8/);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-horse' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/do not match/);
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'correct-horse' } });
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect((await db.settings.get('default'))!.userName).toBe('Rithish');
  });
  it('login mode rejects a wrong password and accepts the right one', async () => {
    await seedAccount(); endSession();
    const done = vi.fn();
    render(<LoginPortal mode="login" knownName="Rithish" knownEmail="r@example.com" onAuthenticated={done} />);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Incorrect/);
    expect(done).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-horse' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }));
    await waitFor(() => expect(done).toHaveBeenCalled());
  });
});

describe('Settings', () => {
  const renderSettings = () => render(<ThemeProvider><SettingsView /></ThemeProvider>);

  it('opens on Profile with details, password, nested notifications and database operations; AI + Appearance are one click away', async () => {
    await seedAccount();
    renderSettings();
    expect((await screen.findByRole('tab', { name: /Profile/ })).getAttribute('aria-selected')).toBe('true');
    for (const l of ['Full name', 'Gender', 'Email address', 'Phone number', 'Date of birth', 'Occupation / profession', 'Residential address', 'City', 'State / region', 'Country', 'Personal biography']) expect(screen.getByLabelText(l)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upload picture/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Change password/ })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /Notifications/ })).toBeNull(); // merged into Profile
    const notif = screen.getByLabelText('Daily task summary'), profileSec = screen.getByLabelText('Profile details');
    expect(profileSec.compareDocumentPosition(notif) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const b of [/Extract data/, /Restore data/, /Clear all data/]) expect(screen.getByRole('button', { name: b })).toBeTruthy();
    // order: profile details -> password -> database operations (at the bottom)
    const prof = screen.getByLabelText('Profile details'), db_ = screen.getByLabelText('Database operations');
    expect(prof.compareDocumentPosition(db_) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Appearance/ }));
    expect(await screen.findByRole('radiogroup', { name: 'Theme' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /AI Configuration/ }));
    expect(screen.queryByRole('radiogroup', { name: 'Theme' })).toBeNull();
  });

  it('saves profile fields and validates email/date of birth', async () => {
    await seedAccount();
    renderSettings();
    fireEvent.change(await screen.findByLabelText('Email address'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/valid email/);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Gender'), { target: { value: 'Female' } });
    fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: '1999-04-02' } });
    fireEvent.change(screen.getByLabelText('Personal biography'), { target: { value: 'Security learner' } });
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '+91 98765 43210' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Chennai' } });
    fireEvent.change(screen.getByLabelText('Occupation / profession'), { target: { value: 'Security engineer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(async () => expect(await db.settings.get('default')).toMatchObject({ email: 'new@example.com', gender: 'Female', dob: '1999-04-02', bio: 'Security learner', phone: '+91 98765 43210', city: 'Chennai', occupation: 'Security engineer' }));
  });

  it('changes the password only with the correct current password', async () => {
    await seedAccount();
    renderSettings();
    fireEvent.click(await screen.findByRole('button', { name: /Change password/ }));
    fireEvent.change(await screen.findByLabelText('Current password'), { target: { value: 'wrong-one' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/incorrect/);
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'correct-horse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'another-pass-1' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'another-pass-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText(/Password updated/)).toBeTruthy();
    expect(await checkPassword('another-pass-1')).toBe(true);
  });

  it('Clear all data needs the password, wipes profile + data and signals the app to show sign-up', async () => {
    await seedAccount();
    await db.habits.add({ id: 'h', name: 'x', category: 'Health', frequencyMode: 'everyday', archived: 0, createdAt: new Date().toISOString() } as any);
    await db.financeAccounts.add({ id: 'a', name: 'Bank', type: 'bank', balance: 5, currency: 'USD', createdAt: new Date().toISOString() });
    localStorage.setItem('habitos.focus.v1', '{}');
    const reset = vi.fn(); window.addEventListener(RESET_EVENT, reset);
    renderSettings();
    fireEvent.click(await screen.findByRole('button', { name: /Clear all data/ }));
    fireEvent.change(await screen.findByLabelText(/Enter your password/), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete everything' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Incorrect/);
    expect(await db.habits.count()).toBe(1);                          // nothing deleted yet
    fireEvent.change(screen.getByLabelText(/Enter your password/), { target: { value: 'correct-horse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete everything' }));
    await waitFor(() => expect(reset).toHaveBeenCalled());
    expect(await db.habits.count()).toBe(0);
    expect(await db.financeAccounts.count()).toBe(0);
    const s = (await db.settings.get('default'))!;                    // fresh defaults only
    expect(hasAccount(s)).toBe(false);
    expect(s.userName).toBe(''); expect(s.email).toBeUndefined(); expect(s.passwordHash).toBeUndefined();
    expect(localStorage.getItem('habitos.focus.v1')).toBeNull();
    expect(isSessionActive()).toBe(false);
    window.removeEventListener(RESET_EVENT, reset);
  });
});

describe('Appearance: three themes, five fonts, ten backgrounds', () => {
  it('offers exactly the specified options and no texture control', async () => {
    await seedAccount();
    render(<ThemeProvider><SettingsView /></ThemeProvider>);
    fireEvent.click(await screen.findByRole('tab', { name: /Appearance/ }));
    const themes = within(screen.getByRole('radiogroup', { name: 'Theme' })).getAllByRole('radio').map((r) => r.textContent);
    expect(themes).toHaveLength(3);
    expect(themes.join('|')).toMatch(/Sage Minimal.*Warm Monochrome.*Dark Mode/);
    expect(screen.queryByText(/Porcelain/)).toBeNull();
    expect(screen.queryByText(/Surface texture|Fine Grain|Architectural Relief/)).toBeNull();
    expect(within(screen.getByRole('radiogroup', { name: 'Font' })).getAllByRole('radio')).toHaveLength(5);
    const bgs = [...within(screen.getByRole('radiogroup', { name: 'Light backgrounds' })).getAllByRole('radio'), ...within(screen.getByRole('radiogroup', { name: 'Dark backgrounds' })).getAllByRole('radio')];
    expect(bgs).toHaveLength(10);
  });
  it('selecting theme, font and background applies instantly and persists', async () => {
    await seedAccount();
    render(<ThemeProvider><SettingsView /></ThemeProvider>);
    fireEvent.click(await screen.findByRole('tab', { name: /Appearance/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Dark Mode/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Source Serif 4/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Cosmic Nebula background' }));
    await waitFor(async () => expect(await db.settings.get('default')).toMatchObject({ themeId: 'dark-mode', fontId: 'serif', backgroundId: 'cosmic-nebula' }));
    const r = document.documentElement;
    expect(r.getAttribute('data-theme')).toBe('dark-mode'); expect(r.getAttribute('data-bg')).toBe('cosmic-nebula');
    expect(r.style.getPropertyValue('--font-heading')).toContain('Source Serif 4');
    expect(r.style.getPropertyValue('--text-primary')).toBe('#E9EEF4');   // light text on the dark theme
  });
});

describe('Sidebar + brand', () => {
  it('shows CONSTANT / Personalized Routine Tracker, grouped sections and the profile card', async () => {
    await seedAccount();
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} onSignOut={() => {}} />);
    expect(await screen.findByText('CONSTANT')).toBeTruthy();
    expect(screen.getByText('Personalized Routine Tracker')).toBeTruthy();
    for (const g of ['Overview', 'Plan & Track', 'Manage', 'Insights']) expect(screen.getByRole('group', { name: g })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(await screen.findByText('Rithish')).toBeTruthy();
  });
  it('Brand renders both lines', () => { render(<Brand size="lg" />); expect(screen.getByText('CONSTANT')).toBeTruthy(); expect(screen.getByText('Personalized Routine Tracker')).toBeTruthy(); });
});

import { within } from '@testing-library/react';
