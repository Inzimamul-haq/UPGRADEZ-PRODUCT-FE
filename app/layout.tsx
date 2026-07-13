import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AI Exam Prep",
  description: "Platform for AI-assisted exam preparation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#1C1C1B]" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
            <Toaster theme="dark" richColors position="top-right" style={{ zIndex: 99999 }} />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
