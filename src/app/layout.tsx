import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "grokbotit",
  description:
    "A Product Hunt-style community for Grok Bots. Connect X, post the bots you've built, upvote them, and argue in the replies.",
  metadataBase: new URL(process.env.APP_URL || "https://grokbotit.com"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
