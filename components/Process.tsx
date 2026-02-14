"use client";

import { motion } from "framer-motion";
import { Bug, Code2, Palette, Rocket, Search } from "lucide-react";
import { fadeUp, inView, staggerContainer } from "@/lib/motion";

const processSteps = [
    {
        title: "Discovery",
        description: "Requirements, goals, and success metrics are mapped before coding starts.",
        icon: Search,
    },
    {
        title: "Design",
        description: "I structure clean UX flows and UI direction aligned with your product goals.",
        icon: Palette,
    },
    {
        title: "Development",
        description: "Scalable frontend and backend implementation with maintainable architecture.",
        icon: Code2,
    },
    {
        title: "Testing",
        description: "Cross-device QA, performance checks, and bug fixes before release.",
        icon: Bug,
    },
    {
        title: "Deployment",
        description: "Production launch, monitoring, and post-release support for stability.",
        icon: Rocket,
    },
];

const Process = () => {
    return (
        <section className="py-24 bg-background border-t border-secondary/20" id="process">
            <div className="container mx-auto px-4 sm:px-6">
                <motion.div variants={fadeUp()} {...inView} className="text-center max-w-3xl mx-auto mb-14">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">My Process</h2>
                    <p className="text-muted-foreground text-base sm:text-lg">
                        A structured workflow that keeps projects fast, transparent, and launch-ready.
                    </p>
                </motion.div>

                <motion.div
                    variants={staggerContainer(0.06, 0.08)}
                    {...inView}
                    className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
                >
                    {processSteps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            variants={fadeUp(18, 0.55)}
                            className="card-surface p-5 h-full"
                        >
                            <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center mb-4">
                                <step.icon className="w-5 h-5 text-foreground" />
                            </div>
                            <p className="text-xs font-medium tracking-wide text-muted-foreground mb-2">
                                Step {index + 1}
                            </p>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Process;
