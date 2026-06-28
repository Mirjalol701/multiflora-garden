import type { Metadata } from "next";
import { ChatApp } from "@/components/ai-chat/chat-app";
import { WorkspaceProvider } from "@/hooks/use-workspace";

export const metadata: Metadata = {
  title: "MultiFlora AI",
  description: "Умный AI-ассистент — спрашивайте о чём угодно и получайте ответы мгновенно.",
};

export default function HomePage() {
  return (
    <WorkspaceProvider>
      <ChatApp />
    </WorkspaceProvider>
  );
}
