import { type Variants } from "framer-motion";

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const staggerContainer = (delayChildren = 0.08, staggerChildren = 0.1): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren,
    },
  },
});

export const fadeUp = (distance = 24, duration = 0.7): Variants => ({
  hidden: { opacity: 0, y: distance },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: EASE_OUT },
  },
});

export const fadeInLeft = (distance = 36, duration = 0.75): Variants => ({
  hidden: { opacity: 0, x: -distance },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration, ease: EASE_OUT },
  },
});

export const fadeInRight = (distance = 36, duration = 0.75): Variants => ({
  hidden: { opacity: 0, x: distance },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration, ease: EASE_OUT },
  },
});

export const scaleIn = (from = 0.96, duration = 0.7): Variants => ({
  hidden: { opacity: 0, scale: from },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration, ease: EASE_OUT },
  },
});

export const inView = {
  initial: "hidden" as const,
  whileInView: "show" as const,
  viewport: { once: true, amount: 0.22 },
};

export const hoverLift = {
  y: -4,
  scale: 1.01,
  transition: { duration: 0.22, ease: EASE_OUT },
};

export const tapPress = {
  scale: 0.98,
  transition: { duration: 0.12, ease: EASE_OUT },
};
