"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { fadeUp, inView } from "@/lib/motion";

const techLogos = [
    { name: "Next.js", logo: "/tech/nextjs.svg" },
    { name: "React", logo: "/tech/react.svg" },
    { name: "TypeScript", logo: "/tech/typescript.svg" },
    { name: "Tailwind CSS", logo: "/tech/tailwindcss.svg" },
    { name: "Node.js", logo: "/tech/nodejs.svg" },
    { name: "GraphQL", logo: "/tech/graphql.svg" },
    { name: "Prisma", logo: "/tech/prisma.svg" },
    { name: "Supabase", logo: "/tech/supabase.svg" },
    { name: "Framer Motion", logo: "/tech/framer.svg" },
    { name: "Redux", logo: "/tech/redux.svg" },
    { name: "Firebase", logo: "/tech/firebase.svg" },
    { name: "Vercel", logo: "/tech/vercel.svg" },
];

const Skills = () => {
    const loopItems = [...techLogos, ...techLogos];

    return (
        <section className="py-16 sm:py-20 bg-background relative overflow-hidden" id="skills">
            <div className="container mx-auto px-4 sm:px-6">
                <motion.div variants={fadeUp()} {...inView} className="mb-6 text-center">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">Modern Tech Stack</h2>
                </motion.div>
            </div>

            <motion.div
                variants={fadeUp(16, 0.55)}
                {...inView}
                className="relative left-1/2 -translate-x-1/2 w-screen py-2 sm:py-3"
            >
                <div className="logo-loop-mask">
                    <div className="logo-loop-track">
                        {loopItems.map((item, index) => (
                            <div
                                key={`${item.name}-${index}`}
                                className="logo-loop-item"
                                style={{ animationDelay: `${(index % techLogos.length) * 120}ms` }}
                                title={item.name}
                                aria-label={item.name}
                            >
                                <div className="logo-loop-bubble">
                                    <Image
                                        src={item.logo}
                                        alt={`${item.name} logo`}
                                        width={32}
                                        height={32}
                                        className="logo-loop-image"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default Skills;
