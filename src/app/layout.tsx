import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdBanner from "@/components/ads/AdBanner";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coğrafi Bilgi Sistemleri'ni Öğreniyorum | Dijital Arazi Uygulaması",
  description: "Coğrafya ve Jeoloji eğitimi için etkileşimli görev sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark"> {/* Varsayılan tema karanlık */}
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* Arka plan ve metin renkleri globals.css'ten CSS değişkenleri ile yönetilir */}
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