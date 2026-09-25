import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edumerge-360 | Enterprise Campus OS",
  description:
    "Integrated Higher-Education ERP: Smart Attendance, Fee Lifecycle & 3-Way Reconciliation, Intelligent Timetable CSP Solver, SLA Helpdesk, and Admission CRM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
