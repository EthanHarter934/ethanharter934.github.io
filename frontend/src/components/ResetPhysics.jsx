import { useEffect, useState } from 'react';
import { onBodiesChange } from '../utils/physicsWorld';
import { uiClick } from '../utils/sfx';

// Subtle bottom-right button that puts every thrown button and smashed
// hero piece back where it started. Rendered whenever the physics world
// has something to reset, or the hero is mid-smash (its debris may have
// already flown off and been removed before the button is clicked).
export default function ResetPhysics() {
  const [bodyCount, setBodyCount] = useState(0);
  const [smashed, setSmashed] = useState(false);

  useEffect(() => onBodiesChange(setBodyCount), []);

  useEffect(() => {
    const onSmashState = (event) => setSmashed(event.detail);
    window.addEventListener('eh:hero-smash-state', onSmashState);
    return () => window.removeEventListener('eh:hero-smash-state', onSmashState);
  }, []);

  if (bodyCount === 0 && !smashed) return null;

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
