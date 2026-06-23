import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChronosOS — Executive Operating System",
  description: "High-performance productivity engine for deep work, nutrition, and task orchestration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-chronos-900 text-chronos-50">
        {children}
      </body>
    </html>
  );
}
