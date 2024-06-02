import type { Metadata } from "next";
import "./globals.css";
import NavMenu from "./NavMenu";
import { AuthProvider } from "./AuthProvider";

export const metadata: Metadata = {
  title: "ChatWrangler",
  description: "Take control of your chat!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en">
        <body>
          <NavMenu />
          <div className="min-h-screen bg-gray-100 text-gray-900">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              {children}
            </main>
          </div>
        </body>
      </html>
    </AuthProvider>
  );
}
