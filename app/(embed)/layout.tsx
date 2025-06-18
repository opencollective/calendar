import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { KeyProvider } from "../contexts/KeyProvider";
import { EventsProvider } from "../contexts/EventsProvider";
import { Header } from "../components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Community Events - Embed",
  description: "Embeddable community events calendar",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} bg-white min-h-screen`}>
      <KeyProvider>
        <EventsProvider>
          <Header />
          {children}
        </EventsProvider>
      </KeyProvider>
    </div>
  );
}
