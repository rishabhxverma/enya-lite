"use client";

import { motion } from "motion/react";

interface Props {
  caption: string;
  emojiArt: string;
}

export function DiagramCard({ caption, emojiArt }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-8 mx-auto max-w-md p-6 rounded-3xl border-2 bg-card shadow-sm"
    >
      <div className="text-3xl sm:text-4xl text-center tracking-wider whitespace-nowrap overflow-x-auto leading-relaxed">
        {emojiArt}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-3">
        {caption}
      </p>
    </motion.div>
  );
}
