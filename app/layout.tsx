import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./app.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tutoring Assistant Platform",
  description: "An interactive platform for tutors and students with test creation, automatic grading, and progress tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
