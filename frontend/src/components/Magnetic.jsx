import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

// M3 — gentle magnetic pull toward the cursor while hovering.
export default function Magnetic({ children, strength = 0.22 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 240, damping: 16, mass: 0.4 });

  const onPointerMove = (event) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ display: 'inline-block', x: sx, y: sy }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.div>
  );
}
