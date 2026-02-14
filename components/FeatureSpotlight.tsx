"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { fadeInLeft, fadeInRight, inView, scaleIn } from "@/lib/motion";

interface FeatureSpotlightProps {
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
    alignment: "left" | "right";
    children?: React.ReactNode;
}

const FeatureSpotlight = ({
    title,
    description,
    linkText,
    linkHref,
    alignment,
    children
}: FeatureSpotlightProps) => {
    return (
        <section className="py-24 bg-background overflow-hidden">
            <div className="container mx-auto px-6">
                <div className={`flex flex-col md:flex-row items-center gap-12 ${alignment === "right" ? "md:flex-row-reverse" : ""}`}>

                    {/* Text Content */}
                    <motion.div
                        variants={alignment === "left" ? fadeInLeft() : fadeInRight()}
                        {...inView}
                        className="flex-1 space-y-6"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            {description}
                        </p>
                        <Link
                            href={linkHref}
                            className="inline-flex items-center gap-2 text-primary font-bold transition-all group"
                        >
                            {linkText}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    {/* Visual Content (Mockup/Image) */}
                    <motion.div
                        variants={scaleIn()}
                        {...inView}
                        className="flex-1 w-full"
                    >
                        <div className="relative rounded-xl bg-card border border-border aspect-[4/3] overflow-hidden shadow-xl">

                            {/* Placeholder for feature specific visualization */}
                            {children ? children : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-mono text-4xl font-bold">
                                    {title}
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default FeatureSpotlight;
