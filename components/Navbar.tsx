"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoveRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { hoverLift, tapPress } from "@/lib/motion";

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/#home" },
        { name: "Projects", href: "/#projects" },
        { name: "Contact", href: "/#contact" },
        { name: "AI Assistant", href: "/ai-assistant" },
    ];

    const getLinkTargetProps = (href: string) =>
        href === "/ai-assistant"
            ? { target: "_blank", rel: "noopener noreferrer" as const }
            : {};

    const handleNavLinkClick = (closeMobile = false) => {
        if (closeMobile) {
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                isScrolled
                    ? "bg-background/80 backdrop-blur-md border-border py-2.5 sm:py-4"
                    : "bg-transparent py-3.5 sm:py-6"
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
                {/* Logo */}
                <motion.div whileHover={hoverLift} whileTap={tapPress}>
                <Link href="/" className="flex items-center group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 relative flex items-center justify-center">
                        <Image src="/Logo.png" alt="Taha Logo" fill priority className="object-contain themed-logo" />
                    </div>
                </Link>
                </motion.div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <motion.div key={link.name} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
                            <Link
                                href={link.href}
                                {...getLinkTargetProps(link.href)}
                                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                            >
                                {link.name}
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* CTA + Theme */}
                <div className="hidden md:flex items-center gap-3">
                    <ThemeToggle />
                    <motion.div whileHover={hoverLift} whileTap={tapPress}>
                        <Link href="/#contact" className="bg-secondary hover:bg-secondary/80 text-foreground px-5 py-2 rounded-full text-sm font-medium transition-all border border-border hover:border-primary/50 flex items-center gap-2">
                            Hire Me
                            <MoveRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>

                {/* Mobile Actions */}
                <div className="md:hidden flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        className="text-foreground p-2 rounded-md hover:bg-secondary transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-background border-b border-border overflow-hidden"
                    >
                        <div className="flex flex-col p-4 sm:p-6 gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    {...getLinkTargetProps(link.href)}
                                    className="text-muted-foreground hover:text-primary transition-colors text-base"
                                    onClick={() => handleNavLinkClick(true)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Link
                                href="/#contact"
                                className="bg-primary/10 text-primary px-5 py-3 rounded-lg text-center font-medium mt-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Hire Me
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
