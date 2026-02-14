"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Bebas_Neue, Inter } from "next/font/google";
import { EASE_OUT, fadeInLeft, fadeInRight, hoverLift, staggerContainer, tapPress } from "@/lib/motion";
import { PROFILE } from "@/lib/agent/profile";

const inter = Inter({
    subsets: ["latin"],
    weight: ["700"],
    display: "swap",
});

const bebasNeue = Bebas_Neue({
    subsets: ["latin"],
    weight: "400",
    display: "swap",
});

const Hero = () => {
    return (
        <section id="home" className="pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-16 lg:pb-20 overflow-hidden bg-background">
            <motion.div
                variants={staggerContainer(0.1, 0.12)}
                initial="hidden"
                animate="show"
                className="container mx-auto px-4 sm:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-14"
            >
                {/* Left Content */}
                <motion.div
                    variants={fadeInLeft()}
                    className="space-y-6 sm:space-y-7 text-left w-full lg:max-w-3xl"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: EASE_OUT }}
                >
                    <h1 className="flex flex-wrap sm:flex-nowrap items-end gap-2.5 sm:gap-4 leading-none">
                        <span
                            className={`${inter.className} lowercase text-[16px] sm:text-[20px] tracking-[0.32em] sm:tracking-[0.38em] text-primary font-bold pb-[0.2em]`}
                        >
                            the
                        </span>
                        <span
                            className={`${bebasNeue.className} text-primary uppercase text-[50px] sm:text-[80px] lg:text-[96px] leading-[0.9] tracking-[0.03em] sm:tracking-[0.06em]`}
                        >
                            {PROFILE.identity.displayName}.
                        </span>
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-3xl pr-1">
                        {PROFILE.identity.displayName} is a full stack web developer known for building SEO-friendly,
                        high-performance websites and scalable web applications using Next.js, React, TypeScript, Node.js,
                        and Tailwind CSS.
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-start">
                        <motion.div whileHover={hoverLift} whileTap={tapPress}>
                            <Link
                                href="/resume.pdf.pdf"
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-secondary font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                Download Resume
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </motion.div>
                        <motion.div whileHover={hoverLift} whileTap={tapPress}>
                            <Link
                                href="https://github.com/myselftaha?tab=repositories"
                                target="_blank"
                                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-4 bg-transparent border border-border text-foreground font-bold rounded-lg hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <span className="sr-only">GitHub</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        </motion.div>
                        <motion.div whileHover={hoverLift} whileTap={tapPress}>
                            <Link
                                href="https://www.linkedin.com/in/taha-jameel-6b9b293aa/"
                                target="_blank"
                                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-4 bg-transparent border border-border text-foreground font-bold rounded-lg hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <span className="sr-only">LinkedIn</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        </motion.div>
                    </div>

                </motion.div>

                <motion.div variants={fadeInRight()} className="hidden lg:flex w-full lg:w-auto justify-center lg:justify-end lg:-mt-16 xl:-mt-20">
                    <motion.div whileHover={hoverLift} whileTap={tapPress} className="relative w-36 h-36 sm:w-56 sm:h-56 lg:w-[420px] lg:h-[420px]">
                        <Image
                            src="/Logo.png"
                            alt="Taha Logo"
                            fill
                            priority
                            className="object-contain themed-logo"
                        />
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default Hero;
