"use client";

import { motion } from "framer-motion";

type Direction = "up" | "left" | "right" | "scale" | "roll";

const variants: Record<Direction, { initial: Record<string, number>; animate: Record<string, number> }> = {
  up: { initial: { y: 40 }, animate: { y: 0 } },
  left: { initial: { x: -50 }, animate: { x: 0 } },
  right: { initial: { x: 50 }, animate: { x: 0 } },
  scale: { initial: { scale: 0.85 }, animate: { scale: 1 } },
  roll: { initial: { rotate: -8, y: 30 }, animate: { rotate: 0, y: 0 } },
};

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const { initial, animate } = variants[direction];
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...initial }}
      whileInView={{ opacity: 1, ...animate }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
