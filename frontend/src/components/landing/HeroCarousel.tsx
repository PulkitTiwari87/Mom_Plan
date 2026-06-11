"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: "/images/landing/carousel-1.jpeg",
    alt: "Families discovering benefits with MomPlan",
  },
  {
    src: "/images/landing/carousel-2.jpeg",
    alt: "Caseworkers supporting mothers in their community",
  },
  {
    src: "/images/landing/carousel-3.jpeg",
    alt: "Community organizations streamlining benefit access",
  },
  {
    src: "/images/landing/carousel-4.jpeg",
    alt: "Simplified path to government assistance programs",
  },
] as const;

const AUTO_PLAY_MS = 5000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative w-full pt-16"
      aria-roledescription="carousel"
      aria-label="Featured images"
    >
      <div className="relative h-[240px] w-full overflow-hidden bg-surface-container-low sm:h-[320px] md:h-[400px] lg:h-[460px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={SLIDES[index].src}
              alt={SLIDES[index].alt}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              aria-hidden={i !== index}
              className={cn(
                "relative h-1.5 overflow-hidden rounded-full bg-white/40 transition-all duration-300",
                i === index ? "w-10" : "w-1.5"
              )}
            >
              {i === index && (
                <motion.div
                  key={index}
                  className="absolute inset-0 origin-left rounded-full bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_PLAY_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
