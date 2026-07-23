// Framer Motion presets that match the design Skill's rules.
// Expo-out easing on every transition.
export const easing = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: easing },
};

export const stagger = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true },
  variants: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easing } },
};

export const liftOnHover = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: easing } },
};
