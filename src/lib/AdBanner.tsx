'use client';

import { useEffect } from 'react';

export default function AdBanner() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense Hatası:", err);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-6 overflow-hidden">
      <div className="bg-slate-800/50 border border-dashed border-slate-700 w-full max-w-[728px] h-[90px] flex items-center justify-center text-slate-600 text-xs italic">REKLAM ALANI</div>
    </div>
  );
}