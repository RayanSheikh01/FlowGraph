import type { CSSProperties } from 'react'

const panel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#f9f9f9',
}

export const HitlPanel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={panel}>
        {children}
    </div>
  );
}