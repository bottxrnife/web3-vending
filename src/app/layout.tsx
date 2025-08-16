import "./globals.css";
import type { Metadata } from "next";
import { WalletProvider } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Omnichain Vending Kiosk",
  description: "Pay with any chain; get instant candy.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#0ea5e9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
} 