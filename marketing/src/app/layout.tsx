import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalkByte AI | Voice Commerce OS",
  description: "Automate your restaurant's phone orders with human-parity voice AI. Never miss a call, sync directly to POS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen antialiased bg-[#050505]">
        {children}
      </body>
    </html>
  );
}
