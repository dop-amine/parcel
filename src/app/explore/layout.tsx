'use client';

import DashboardLayout from "@/components/DashboardLayout";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}