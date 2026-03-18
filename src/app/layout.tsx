import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdBanner from "@/components/ads/AdBanner";
import Script from "next/script";

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
    <html lang="tr" className="dark">
      {/* 1. Global Layout: h-screen ve overflow-hidden ile tam ekran, kaydırmasız yapı. */}
      {/* 2. Menü Etkileşimi: Header'dan yönetilecek bir state ile body'e eklenecek .menu-open sınıfı varsayılarak ana içerik flulaştırılır. */}
      <body className="h-screen overflow-hidden flex flex-col bg-[#F9F6F0] dark:bg-slate-950 text-foreground">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Header />
        {/* Ana içerik alanı, dikeyde kaydırılabilir ve menü etkileşimine duyarlı hale getirildi. */}
        <main className="flex-1 overflow-y-auto transition-all duration-300 group-[.menu-open]:blur-sm group-[.menu-open]:brightness-50">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <AdBanner />
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}