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
      <html data-theme="cupcake" lang="en">
        <body>
          <NavMenu />
          <div className="min-h-screen bg-gray-100 text-gray-900">
            <main>{children}</main>
          </div>
        </body>
      </html>
    </AuthProvider>
  );
}
