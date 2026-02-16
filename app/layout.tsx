import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ChainMate - AI-Powered Crypto Companion for BSC",
  description: "Simplify blockchain transactions with AI. Send tokens, schedule payments, and manage crypto through natural language on BNB Smart Chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-gray-900`}>
        <Web3Provider>
          {children}
          <Toaster position="top-right" theme="dark" />
        </Web3Provider>
      </body>
    </html>
  );
}
