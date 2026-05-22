import type { Metadata } from "next";
// Import Google Fonts
import { Barlow_Condensed, DM_Sans, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "../../components/layout/ClientLayoutWrapper"; // Import ClientLayoutWrapper

// Configure font subsets and weights
const barlowCondensed = Barlow_Condensed({
  weight: "700", // As specified for H1
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: 'swap'
});

const dmSans = DM_Sans({
  weight: ["400", "500", "700"], // Regular, Medium, Bold as needed
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"], // Regular and Bold
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: 'swap'
});

const bebasNeue = Bebas_Neue({
  weight: "400", // Bebas Neue is typically one weight
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: 'swap'
});


export const metadata: Metadata = {
  title: "CycloAI - Your Ultimate Cycling Training Partner",
  description: "Advanced AI-powered cycling coaching for personalized training plans, race intelligence, and performance analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Apply custom font variables globally and set DM Sans as base
      className={`${barlowCondensed.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} font-dmSans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
