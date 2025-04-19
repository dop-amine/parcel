"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}