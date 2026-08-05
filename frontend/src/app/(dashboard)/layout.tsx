"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
