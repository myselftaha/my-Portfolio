"use client";

import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, hoverLift, inView, tapPress } from "@/lib/motion";
import { PROFILE } from "@/lib/agent/profile";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-10 sm:py-12">
      <motion.div variants={fadeUp(16, 0.55)} {...inView} className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground/90">
              Copyright © {new Date().getFullYear()} {PROFILE.identity.displayName}. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6">
            {[
              { Icon: Github, href: PROFILE.contact.github },
              { Icon: Linkedin, href: PROFILE.contact.linkedin },
            ].map((social, index) => (
              <Link
                key={index}
                href={social.href}
                target="_blank"
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                <motion.div whileHover={hoverLift} whileTap={tapPress}>
                  <social.Icon className="w-5 h-5" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
