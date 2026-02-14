"use client";

import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import { PROFILE } from "@/lib/agent/profile";
import { fadeInLeft, fadeInRight, fadeUp, hoverLift, inView, tapPress } from "@/lib/motion";

const featuredProject = PROFILE.projects[0];

const Projects = () => {
  if (!featuredProject) return null;

  return (
    <section className="py-20 sm:py-24 bg-secondary/20 relative overflow-hidden" id="projects">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div variants={fadeUp()} {...inView} className="mb-14 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">Featured Project</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Real delivery work from {PROFILE.identity.displayName}, focused on practical business workflows and
            production-ready architecture.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.article
            variants={fadeInLeft(22, 0.55)}
            {...inView}
            whileHover={hoverLift}
            whileTap={tapPress}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8 h-full flex flex-col"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">{featuredProject.type}</p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">{featuredProject.name}</h3>
            <p className="text-muted-foreground leading-relaxed">{featuredProject.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {featuredProject.stack.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-secondary text-foreground border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-8 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                href={featuredProject.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-secondary font-semibold text-sm"
              >
                Live Demo
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href={featuredProject.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground font-semibold text-sm hover:border-primary/50"
              >
                GitHub Projects
                <Github className="w-4 h-4" />
              </Link>
            </div>
          </motion.article>

          <motion.article
            variants={fadeInRight(22, 0.55)}
            {...inView}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8 h-full flex flex-col"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Project</p>
              <span className="text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full border border-border bg-secondary text-muted-foreground">
                In Planning
              </span>
            </div>

            <h4 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">Coming Soon</h4>
            <p className="text-muted-foreground leading-relaxed">
              This slot is reserved for the next production-grade project. Scope definition and discovery are currently
              in progress.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Focus</p>
                <p className="text-sm font-medium text-foreground">Business Workflow App</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/35 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-medium text-foreground">Requirements Gathering</p>
              </div>
            </div>

            <div className="mt-auto pt-7 rounded-xl border border-dashed border-border bg-secondary/45 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Launch Note</p>
              <p className="text-sm text-foreground font-medium">Public case study and live preview will be published soon.</p>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
};

export default Projects;
