import { motion } from 'motion/react';

const EASE = [0.21, 0.6, 0.35, 1];

export default function Reveal({ children, className, delay = 0, y = 28, once = true, ...rest }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px 0px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
