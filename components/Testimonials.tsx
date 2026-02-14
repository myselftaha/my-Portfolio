"use client";

import { motion } from "framer-motion";
import { fadeUp, hoverLift, inView, staggerContainer, tapPress } from "@/lib/motion";

const testimonials: Array<{
    quote: string;
    name: string;
    role: string;
}> = [];

const Testimonials = () => {
    return (
        <section className="py-24 bg-background border-t border-secondary/20">
            <div className="container mx-auto px-6">
                <motion.div variants={fadeUp()} {...inView} className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">What Clients Say</h2>
                    <p className="text-muted-foreground text-lg">
                        Feedback from clients and collaborators on delivery, quality, and communication.
                    </p>
                </motion.div>

                {testimonials.length ? (
                    <motion.div variants={staggerContainer(0.06, 0.08)} {...inView} className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                variants={fadeUp(18, 0.55)}
                                whileHover={hoverLift}
                                whileTap={tapPress}
                                className="bg-card p-8 rounded-2xl border border-secondary transition-colors"
                            >
                                <p className="text-muted-foreground mb-8 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                                <div>
                                    <h4 className="font-bold">{testimonial.name}</h4>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div variants={fadeUp(18, 0.55)} {...inView} className="max-w-2xl mx-auto text-center">
                        <div className="bg-card p-8 rounded-2xl border border-secondary">
                            <p className="text-muted-foreground">
                                Client testimonials will be added after verified public feedback is collected.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default Testimonials;
