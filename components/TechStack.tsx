"use client";

import { motion } from "framer-motion";
import { Code2, Database, Layout, Server, Smartphone, Globe } from "lucide-react";
import { EASE_OUT, fadeInLeft, fadeInRight, inView } from "@/lib/motion";

const TechStack = () => {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                <motion.div variants={fadeInLeft()} {...inView}>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        Languages I use
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg mb-8">
                        I use a modern, scalable, and robust technology stack to build high-performance applications. Always exploring new languages and tools.
                    </p>
                </motion.div>

                {/* Node Graph Mockup - Tech Stack Edition */}
                <motion.div
                    variants={fadeInRight()}
                    {...inView}
                    className="relative min-h-[300px] sm:min-h-[400px] flex items-center justify-center hidden md:flex"
                >
                    {/* Central Node */}
                    <div className="z-20 w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center border border-border shadow-lg">
                        <span className="text-2xl font-bold text-foreground">Dev</span>
                    </div>

                    {/* Surrounding Nodes - Tech Icons */}
                    {[
                        { Icon: Code2, color: "text-zinc-200", x: -120, y: -80, label: "React" },
                        { Icon: Database, color: "text-zinc-300", x: 120, y: -80, label: "Node" },
                        { Icon: Server, color: "text-zinc-400", x: -120, y: 80, label: "Next" },
                        { Icon: Globe, color: "text-zinc-100", x: 120, y: 80, label: "Web" },
                        { Icon: Layout, color: "text-zinc-500", x: 0, y: -140, label: "UI" },
                        { Icon: Smartphone, color: "text-zinc-300", x: 0, y: 140, label: "Mobile" },
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            className="absolute z-10 w-16 h-16 bg-card rounded-xl border border-secondary flex flex-col items-center justify-center shadow-lg gap-1"
                            style={{ x: item.x, y: item.y }}
                            animate={{ y: [item.y - 10, item.y + 10, item.y - 10] }}
                            transition={{ duration: 3 + index, repeat: Infinity, ease: EASE_OUT }}
                        >
                            <item.Icon className={`w-6 h-6 ${item.color}`} />
                            <span className="text-[10px] text-muted-foreground">{item.label}</span>
                        </motion.div>
                    ))}

                    {/* Connecting Lines (SVG) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {[
                            { x1: "50%", y1: "50%", x2: "calc(50% - 120px)", y2: "calc(50% - 80px)" },
                            { x1: "50%", y1: "50%", x2: "calc(50% + 120px)", y2: "calc(50% - 80px)" },
                            { x1: "50%", y1: "50%", x2: "calc(50% - 120px)", y2: "calc(50% + 80px)" },
                            { x1: "50%", y1: "50%", x2: "calc(50% + 120px)", y2: "calc(50% + 80px)" },
                            { x1: "50%", y1: "50%", x2: "50%", y2: "calc(50% - 140px)" },
                            { x1: "50%", y1: "50%", x2: "50%", y2: "calc(50% + 140px)" },
                        ].map((line, i) => (
                            <line
                                key={i}
                                x1={line.x1} y1={line.y1}
                                x2={line.x2} y2={line.y2}
                                stroke="#1F2833"
                                strokeWidth="2"
                            />
                        ))}
                    </svg>
                </motion.div>

            </div>
        </section>
    );
};

export default TechStack;
