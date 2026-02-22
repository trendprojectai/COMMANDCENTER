// src/pages/Agents.tsx
import { OfficeCanvas } from '../components/office/OfficeCanvas';

export function Agents() {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <OfficeCanvas />
    </div>
  );
}
