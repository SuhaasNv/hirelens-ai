import type { Metadata } from "next";
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
        <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/30">
          <div className="container-custom py-6">
            <h1 className="text-xl font-light tracking-wide text-gray-100">HireLens AI</h1>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

