import { useEffect, useState } from 'react';
import { onBodiesChange } from '../utils/physicsWorld';
import { uiClick } from '../utils/sfx';

// Subtle bottom-right button that puts every thrown button and smashed
// hero piece back where it started. Only rendered while the physics
// world actually has something to reset.
export default function ResetPhysics() {
  const [visible, setVisible] = useState(false);

  useEffect(() => onBodiesChange((count) => setVisible(count > 0)), []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="physics-reset"
      onClick={() => {
        uiClick();
        window.dispatchEvent(new Event('eh:physics-reset'));
      }}
    >
      <span aria-hidden="true">↺</span> reset
    </button>
  );
}
