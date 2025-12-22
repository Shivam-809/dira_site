import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import AiChatbot from "@/components/AiChatbot";
import CredentialCleaner from "@/components/CredentialCleaner";
import FloatingBackground from "@/components/FloatingBackground";
import { Bebas_Neue, Mrs_Saint_Delafield, Montserrat, Felipa } from 'next/font/google';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

const felipa = Felipa({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-felipa',
});

const mrsSaintDelafield = Mrs_Saint_Delafield({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-signature',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-subtext',
});

export const metadata: Metadata = {
  title: "Dira",
  description: "Experience the magic of Dira Sakalya Wellbeing - Your path to spiritual enlightenment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${mrsSaintDelafield.variable} ${montserrat.variable} ${felipa.variable}`}>
        <body className="antialiased sunny-beige-bg">
          <FloatingBackground />
          <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="04c8335b-bde9-4e7c-b6bf-2bde80ea48fe"
        />
        <ErrorReporter />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
        {children}
        <AiChatbot domain="general" />
        <Toaster />
      </body>
    </html>
  );
}
