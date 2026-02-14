"use client";

import { motion } from "framer-motion";
import { Mail, Send, Phone } from "lucide-react";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { fadeInLeft, fadeInRight, inView } from "@/lib/motion";
import { PROFILE } from "@/lib/agent/profile";

const Contact = () => {
    const [formState, setFormState] = useState({ name: "", email: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const subject = encodeURIComponent(`Project inquiry from ${formState.name}`);
        const body = encodeURIComponent(
            [
                `Name: ${formState.name}`,
                `Email: ${formState.email}`,
                "",
                "Project details:",
                formState.message,
            ].join("\n")
        );

        window.location.href = `mailto:${PROFILE.contact.email}?subject=${subject}&body=${body}`;
        setIsSubmitting(false);
        setFormState({ name: "", email: "", message: "" });
    };

    return (
        <section className="py-20 sm:py-24 bg-background relative overflow-hidden" id="contact">
            <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-16 items-start relative z-10">

                {/* Contact Info & Text */}
                <motion.div
                    variants={fadeInLeft()}
                    {...inView}
                >
                    <div className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
                        Get in Touch
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                        Let&apos;s work together on your <span className="text-primary">next big idea.</span>
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg mb-8">
                        I am available for freelance and full-time opportunities. Share your goals and I will help you plan and build the right solution.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-white/5 shrink-0">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm text-muted-foreground">Email</div>
                                <Link
                                    href={`mailto:${PROFILE.contact.email}`}
                                    className="text-foreground font-medium hover:text-primary transition-colors break-all sm:break-normal"
                                >
                                    {PROFILE.contact.email}
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-white/5 shrink-0">
                                <Phone className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm text-muted-foreground">WhatsApp</div>
                                <Link
                                    href={PROFILE.contact.whatsappLink}
                                    target="_blank"
                                    className="text-foreground font-medium hover:text-primary transition-colors break-all sm:break-normal"
                                >
                                    {PROFILE.contact.whatsappInternational}
                                </Link>
                            </div>
                        </div>

                    </div>

                </motion.div>

                {/* Contact Form */}
                <motion.div
                    variants={fadeInRight()}
                    {...inView}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="Your name"
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="you@example.com"
                                    value={formState.email}
                                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                            <textarea
                                id="message"
                                required
                                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[150px] resize-none"
                                placeholder="Tell me about your project..."
                                value={formState.message}
                                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-secondary font-bold py-4 rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Opening mail app..." : "Send Message"}
                            {!isSubmitting && <Send className="w-5 h-5" />}
                        </button>
                        <p className="text-xs text-muted-foreground">
                            This form opens your email app and drafts a message to {PROFILE.contact.email}.
                        </p>
                    </form>
                </motion.div>

            </div>
        </section>
    );
};

export default Contact;
