import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // globals.css dosyasını import et
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdBanner from "@/components/ads/AdBanner";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bergama CBS | Dijital Arazi Uygulaması",
  description: "Coğrafya ve Jeoloji eğitimi için etkileşimli görev sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      {/* 'dark' sınıfı JavaScript tarafından eklenecek/kaldırılacak */}
      <body className={`${inter.className} bg-slate-950 text-white dark:bg-gray-900 dark:text-gray-100 min-h-screen flex flex-col`}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Header />
        <AdBanner />
        <main className="flex-grow container mx-auto p-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}