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
        <header className="bg-white border-b border-gray-200">
          <div className="container-custom py-4">
            <h1 className="text-2xl font-semibold text-gray-900">HireLens AI</h1>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

