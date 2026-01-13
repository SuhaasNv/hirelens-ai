import type { Metadata } from "next";
import Link from "next/link";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "HireLens AI",
  description: "Explainable AI resume and interview intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/30 sticky top-0 z-50">
          <div className="container-custom py-4 sm:py-6">
            <Link
              href="/"
              className="text-lg sm:text-xl font-light tracking-wide text-gray-100 hover:text-white transition-colors"
            >
              HireLens AI
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

