export const PROFILE = {
  identity: {
    legalName: "Muhammad Taha",
    displayName: "Taha Jameel",
    firstName: "Taha",
    age: 19,
    dateOfBirth: "2006-12-21",
  },
  location: {
    country: "Pakistan",
    province: "Sindh",
    city: "Karachi",
    timezone: "Asia/Karachi (UTC+05:00)",
  },
  languages: ["Urdu", "English"],
  headline:
    "Full Stack Developer with 3 years of experience in building fast, modern, and user-focused web applications.",
  intro:
    "Hi, I am Taha Jameel from Karachi, Pakistan. I build full-stack web apps with clean UI, strong performance, and reliable backend systems.",
  summary:
    "Taha is a full stack developer who focuses on practical product delivery, from polished frontends to production-ready backend APIs. He is currently working as a developer at Matjar X and is open to both freelance projects and full-time opportunities.",
  professional: {
    role: "Full Stack Developer",
    experienceYears: 3,
    status: "Open to freelance and full-time opportunities",
    currentCompany: {
      name: "Matjar X",
      role: "Developer",
      duration: "1 year (current)",
    },
    availability: "24/7",
    collaborationPreference: "Remote-first, open to flexible collaboration",
  },
  strengths: [
    "End-to-end full stack execution",
    "Clean and responsive UI implementation",
    "API integration and backend reliability",
    "Performance-focused web development",
    "Clear communication and on-time delivery",
  ],
  skills: {
    frontend: [
      "Next.js",
      "React.js",
      "TypeScript",
      "JavaScript (ES6+)",
      "Tailwind CSS",
      "Framer Motion",
      "Redux Toolkit",
      "Responsive Web Design",
      "Accessibility (a11y)",
    ],
    backend: [
      "Node.js",
      "Express.js",
      "REST APIs",
      "Authentication (JWT/session)",
      "Business logic development",
      "Third-party API integrations",
    ],
    databases: [
      "MongoDB",
      "PostgreSQL",
      "Database schema design",
      "Query optimization basics",
    ],
    devops: [
      "Git",
      "GitHub",
      "Vercel deployment",
      "Docker basics",
      "CI/CD basics",
      "Environment configuration",
    ],
    tools: ["VS Code", "Postman", "Figma", "npm", "pnpm"],
  },
  services: [
    "Web design and UI implementation",
    "Full stack web application development",
    "Custom dashboard and admin panel development",
    "API development and integration",
    "Performance optimization and deployment",
  ],
  projects: [
    {
      name: "Advanced Pharmacy POS System",
      type: "Full Stack Web Application",
      description:
        "A comprehensive point-of-sale solution for pharmacy operations with inventory tracking, customer management, billing workflow, and sales analytics.",
      stack: ["React", "JavaScript", "Node.js", "MongoDB"],
      highlights: [
        "Centralized pharmacy workflow for daily operations",
        "Inventory and sales visibility in one system",
        "Built for practical, production-style usage",
      ],
      demo: "https://ai-pharmacy-neon.vercel.app/",
      repo: "https://github.com/myselftaha/AI-Pharmacy.git",
    },
  ],
  experience: [
    {
      company: "Matjar X",
      role: "Developer",
      duration: "1 year (current)",
      responsibilities: [
        "Build and maintain web application features",
        "Implement frontend interfaces and backend integrations",
        "Support iterative delivery and product improvements",
      ],
    },
  ],
  education: [
    {
      level: "Intermediate",
      institution: "Not publicly specified",
      status: "Completed",
    },
  ],
  certifications: [
    {
      title: "Web Development Certificate",
      issuer: "Aptech Karachi",
      year: 2021,
    },
  ],
  workingPreferences: {
    projectTypes: ["Business websites", "Custom web apps", "Full stack dashboards", "POS solutions"],
    industries: ["General web products", "Retail/Pharmacy operations"],
    pricing: "Project-based pricing or monthly collaboration, depending on scope",
  },
  faq: [
    {
      question: "What does Taha specialize in?",
      answer:
        "Taha specializes in full stack web development with Next.js, React, TypeScript, Node.js, and Tailwind CSS.",
    },
    {
      question: "Is Taha available for new work?",
      answer:
        "Yes. He is open to both freelance projects and full-time opportunities, with 24/7 availability.",
    },
    {
      question: "How much experience does Taha have?",
      answer:
        "He has 3 years of hands-on experience and is currently working as a developer at Matjar X.",
    },
    {
      question: "What is his main project right now?",
      answer:
        "His highlighted project is an Advanced Pharmacy POS System focused on inventory, customer management, and analytics.",
    },
    {
      question: "How can clients contact Taha quickly?",
      answer:
        "Email him at contact.devtaha@gmail.com or message him on WhatsApp at +92 336 8240877.",
    },
  ],
  assistantNotes: {
    responseRules: [
      "If asked about age, answer 19 based on the provided profile.",
      "If asked for undisclosed private data, state that it is not publicly shared.",
      "Always prioritize the profile facts and keep answers clear and practical.",
    ],
  },
  documents: {
    resume: {
      available: true,
      label: "Resume (PDF)",
      url: "/resume.pdf.pdf",
    },
  },
  contact: {
    email: "contact.devtaha@gmail.com",
    whatsappLocal: "03368240877",
    whatsappInternational: "+92 336 8240877",
    whatsappLink: "https://wa.me/923368240877",
    linkedin: "https://www.linkedin.com/in/taha-jameel-6b9b293aa/",
    github: "https://github.com/myselftaha?tab=repositories",
  },
} as const;

export function serializeProfile(): string {
  return JSON.stringify(PROFILE, null, 2);
}
