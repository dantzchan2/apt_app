import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const rokafFont = localFont({
  src: '../../public/fonts/ROKAF Slab Serif Bold.otf',
  variable: '--font-rokaf',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "P.T. VIT",
  description: "Point-based appointment scheduling system for fitness trainers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rokafFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
