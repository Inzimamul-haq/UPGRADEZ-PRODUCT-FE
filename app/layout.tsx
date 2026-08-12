import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'sonner';
import { PWA_CONFIG } from "@/config/pwa";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const viewport: Viewport = {
  themeColor: PWA_CONFIG.THEME_COLOR,
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: PWA_CONFIG.APP_NAME,
  description: PWA_CONFIG.APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: PWA_CONFIG.APP_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) 
{
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#1C1C1B]" style={{ backgroundColor: '#1C1C1B' }} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
            <Toaster theme="dark" richColors position="top-right" style={{ zIndex: 99999 }} />
          </ToastProvider>
        </AuthProvider>
      </body >
    </html >
  );
}
