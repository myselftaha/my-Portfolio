"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bebas_Neue } from "next/font/google";
import { EASE_OUT } from "@/lib/motion";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const INTRO_TEXT = "TAHA JAMEEL";
const TYPE_INTERVAL_MS = 95;
const HOLD_AFTER_TYPE_MS = 350;

type HomeIntroGateProps = {
  children: React.ReactNode;
};

const HomeIntroGate = ({ children }: HomeIntroGateProps) => {
  const [typedLength, setTypedLength] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    let revealTimeout: number | undefined;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setTypedLength(INTRO_TEXT.length);
      revealTimeout = window.setTimeout(() => setShowContent(true), 120);
      return () => {
        if (revealTimeout) window.clearTimeout(revealTimeout);
      };
    }

    const intervalId = window.setInterval(() => {
      setTypedLength((prev) => {
        const next = Math.min(prev + 1, INTRO_TEXT.length);
        if (next === INTRO_TEXT.length) {
          window.clearInterval(intervalId);
          revealTimeout = window.setTimeout(() => setShowContent(true), HOLD_AFTER_TYPE_MS);
        }
        return next;
      });
    }, TYPE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (revealTimeout) window.clearTimeout(revealTimeout);
    };
  }, []);

  const typedText = useMemo(() => INTRO_TEXT.slice(0, typedLength), [typedLength]);

  if (!showContent) {
    const showCursor = typedLength < INTRO_TEXT.length;

    return (
      <div className="fixed inset-0 z-[120] bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p
            className={`${bebasNeue.className} text-primary uppercase tracking-[0.08em] sm:tracking-[0.12em] text-[38px] sm:text-[76px] lg:text-[96px] leading-none whitespace-nowrap`}
          >
            {typedText}
            {showCursor && <span className="inline-block w-[0.08em] h-[0.9em] ml-1 bg-primary animate-pulse align-[-0.08em]" />}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
};

export default HomeIntroGate;
