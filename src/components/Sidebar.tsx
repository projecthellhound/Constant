import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { LayoutDashboard, ListChecks, CalendarDays, BarChart2, Calendar, Sparkles, Settings, DollarSign, Layers, LogOut, PanelLeftClose, PanelLeftOpen, LucideIcon } from 'lucide-react';
import { db } from '../db/schema';
import { ActiveTab } from '../App';
import { Brand } from './Brand';
import { endSession } from '../auth/account';

interface SidebarProps { activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; onSignOut?: () => void }

const SECTIONS: { label: string; items: { id: ActiveTab; label: string; icon: LucideIcon }[] }[] = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Home', icon: LayoutDashboard }] },
  { label: 'Plan & Track', items: [{ id: 'habits', label: 'Habits', icon: CalendarDays }, { id: 'dolist', label: 'To-Do List', icon: ListChecks }, { id: 'calendar', label: 'Calendar', icon: Calendar }] },
  { label: 'Manage', items: [{ id: 'finance', label: 'Finance', icon: DollarSign }, { id: 'workspace', label: 'Workspace', icon: Layers }] },
  { label: 'Insights', items: [{ id: 'analytics', label: 'Analytics', icon: BarChart2 }, { id: 'insights', label: 'Smart Insights', icon: Sparkles }] },
];

const COLLAPSE_KEY = 'habitos.sidebar.collapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onSignOut }) => {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const toggleCollapsed = () => setCollapsed((c) => { const n = !c; try { localStorage.setItem(COLLAPSE_KEY, n ? '1' : '0'); } catch { /* ignore */ } return n; });
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const allLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));
  const active = habits.filter((h) => !h.paused);
  const done = allLogs.filter((l) => l.date === todayIso && l.status === 'completed' && active.some((h) => h.id === l.habitId)).length;
  const progressPct = active.length ? Math.min(Math.round((done / active.length) * 100), 100) : 0;
  const name = settings?.userName?.trim() || 'Your profile';

  const NavButton: React.FC<{ id: ActiveTab; label: string; icon: LucideIcon }> = ({ id, label, icon: Icon }) => {
    const isActive = activeTab === id;
    return (
      <button onClick={() => setActiveTab(id)} className={`sidebar-nav-item ${isActive ? 'active' : ''}`} aria-current={isActive ? 'page' : undefined} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} style={collapsed ? { justifyContent: 'center', padding: '0.7rem 0' } : undefined}>
        <Icon size={18} aria-hidden="true" style={{ flex: 'none' }} />
        {!collapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <aside className="dynamic-sidebar" aria-label="Primary" data-collapsed={collapsed ? 'true' : 'false'} style={{ width: collapsed ? 84 : 308, padding: collapsed ? '1.5rem 0.7rem 1.25rem' : '1.6rem 1.15rem 1.3rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, zIndex: 80, gap: '1.6rem', transition: 'width 180ms ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: '0.5rem', padding: collapsed ? 0 : '0 0.5rem', minHeight: 40 }}>
        {!collapsed && <Brand />}
        <button type="button" className="btn btn-secondary btn-icon" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Minimize sidebar'} aria-expanded={!collapsed} title={collapsed ? 'Expand sidebar' : 'Minimize sidebar'} style={{ flex: 'none' }}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
      </div>

      <nav aria-label="Modules" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: 2 }}>
        {SECTIONS.map((sec) => (
          <div key={sec.label} role="group" aria-label={sec.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {collapsed
              ? <div aria-hidden="true" style={{ height: 1, background: 'var(--divider)', margin: '0.15rem 0.6rem 0.35rem' }} />
              : <div className="sidebar-section-title">{sec.label}</div>}
            {sec.items.map((it) => <NavButton key={it.id} {...it} />)}
          </div>
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {!collapsed && <div className="liquid-panel" style={{ padding: '0.95rem 1rem', fontSize: '0.8rem', background: 'var(--surface-sunken)', boxShadow: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem' }}><span style={{ fontWeight: 600 }}>Today's Progress</span><strong className="num">{progressPct}%</strong></div>
          <div className="progress-bar-track" style={{ height: 6 }}><div className="progress-bar-fill" style={{ width: `${progressPct}%` }} /></div>
          <div className="subtitle" style={{ fontSize: '0.74rem', marginTop: '0.55rem' }}>{progressPct >= 60 ? 'On track. Keep going!' : 'Small steps every day.'}</div>
        </div>}

        <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.5rem', borderTop: '1px solid var(--divider)' }}>
          <button type="button" className="sidebar-nav-item" onClick={() => setActiveTab('settings')} aria-current={activeTab === 'settings' ? 'page' : undefined} title={collapsed ? `${name} · Settings` : undefined} aria-label={collapsed ? 'Settings' : undefined} style={{ padding: '0.55rem 0.6rem', flex: collapsed ? 'none' : 1, minWidth: 0, justifyContent: collapsed ? 'center' : undefined, background: activeTab === 'settings' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'settings' ? 'var(--text-on-accent)' : 'var(--text-primary)' }}>
            <span aria-hidden="true" style={{ width: 36, height: 36, overflow: 'hidden', borderRadius: '50%', background: activeTab === 'settings' ? 'var(--text-on-accent)' : 'var(--accent-primary)', color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flex: 'none' }}>{settings?.avatar ? <img src={settings.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : name.charAt(0).toUpperCase()}</span>
            {!collapsed && <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Settings size={11} aria-hidden="true" /> Settings & AI</span>
            </span>}
          </button>
          {onSignOut && <button type="button" className="btn btn-secondary btn-icon" aria-label="Sign out" title="Sign out" onClick={() => { endSession(); onSignOut(); }}><LogOut size={16} /></button>}
        </div>
      </div>
    </aside>
  );
};
