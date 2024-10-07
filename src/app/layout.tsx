import React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Box } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import "./globals.css";
import NavBar from '@/components/NavBar';
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CKB Multisig Wizard",
  description: "A handy tool for signing multisig transactions on CKB chain.",
};

// export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} >
        <AuthProvider>
          <Box sx={{ width: '100%', maxWidth: '100%' }}>
            <NavBar />
            {children}
          </Box>
        </AuthProvider>
      </body>
    </html>
  );
}
