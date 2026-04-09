import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Portal Ualá Bank",
  description: "MVP interno de compras, facturas, AP y auditoría",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
