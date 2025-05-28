'use client';

import DashboardLayout from "@/components/DashboardLayout";

export default function RepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}