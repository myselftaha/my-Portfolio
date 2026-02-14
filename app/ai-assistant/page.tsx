import AIAssistantWorkspace from "@/components/AIAssistantWorkspace";
import type { Metadata } from "next";
import { PROFILE } from "@/lib/agent/profile";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: `Chat with ${PROFILE.identity.displayName}'s AI assistant for development guidance, planning, and coding help.`,
  alternates: {
    canonical: "/ai-assistant",
  },
};

export default function AIAssistantPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <AIAssistantWorkspace />
    </main>
  );
}
