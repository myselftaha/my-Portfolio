import type { Metadata } from "next";
import "./globals.css";
import { PROFILE } from "@/lib/agent/profile";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  toAbsoluteUrl,
} from "@/lib/site";

const ogImage = toAbsoluteUrl("/Logo.png");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [
    {
      name: PROFILE.identity.displayName,
      url: PROFILE.contact.linkedin,
    },
  ],
  creator: PROFILE.identity.displayName,
  publisher: PROFILE.identity.displayName,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/Logo.png" }],
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: `${PROFILE.identity.displayName} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

const THEME_INIT_SCRIPT = `
(() => {
  try {
    const key = "portfolio-theme";
    const applyTheme = () => {
      const savedTheme = localStorage.getItem(key);
      const nextTheme = savedTheme === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
    };

    applyTheme();
    window.addEventListener("storage", (event) => {
      if (event.key === key) {
        applyTheme();
      }
    });
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
