import React from 'react';

/** App identity: CONSTANT / Personalized Routine Tracker. */
export const Brand: React.FC<{ size?: 'sm' | 'lg'; align?: 'left' | 'center' }> = ({ size = 'sm', align = 'left' }) => {
  const big = size === 'lg';
  return (
    <div style={{ display: 'flex', flexDirection: big ? 'column' : 'row', alignItems: 'center', gap: big ? '1.1rem' : '0.75rem', textAlign: align }}>
      <img src={`${import.meta.env.BASE_URL}icon.png`} alt="" aria-hidden="true" width={big ? 96 : 46} height={big ? 96 : 46} draggable={false} style={{ width: big ? 96 : 46, height: big ? 96 : 46, objectFit: 'contain', flex: 'none' }} />
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: big ? '0.28em' : '0.16em', fontSize: big ? '2.1rem' : '1.05rem', lineHeight: 1.1, color: 'var(--text-primary)' }}>CONSTANT</div>
        <div style={{ fontSize: big ? '0.95rem' : '0.74rem', color: 'var(--text-secondary)', marginTop: big ? 6 : 2, letterSpacing: big ? '0.04em' : 0 }}>Personalized Routine Tracker</div>
      </div>
    </div>
  );
};
