'use client';

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isArtist = session?.user?.role === 'ARTIST';

  const navigation = isArtist
    ? [
        { name: "Dashboard", href: "/artist/dashboard" },
        { name: "Upload", href: "/artist/upload" },
        { name: "My Tracks", href: "/artist/tracks" },
        { name: "Messages", href: "/artist/messages" },
        { name: "Earnings", href: "/artist/earnings" },
      ]
    : [
        { name: "Dashboard", href: "/exec" },
        { name: "Explore", href: "/exec/explore" },
        { name: "Library", href: "/exec/library" },
        { name: "Messages", href: "/exec/messages" },
        { name: "Purchases", href: "/exec/purchases" },
      ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 backdrop-blur-sm border-b border-gray-800 bg-black/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href={isArtist ? "/artist/dashboard" : "/exec/dashboard"}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
                >
                  Parcel
                </Link>
              </div>
              {/* Desktop nav */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? "border-purple-500 text-white"
                        : "border-transparent text-gray-300 hover:border-gray-300 hover:text-white"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              {/* Mobile nav */}
              <div className="sm:hidden ml-4 relative">
                <button
                  onClick={() => setMobileNavOpen((open) => !open)}
                  className="flex items-center px-2 py-2 rounded text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                {mobileNavOpen && (
                  <div className="absolute left-0 mt-2 w-40 rounded-md shadow-lg bg-gray-900 border border-gray-800 z-50">
                    <nav className="flex flex-col py-2">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`$ {
                            pathname === item.href
                              ? "bg-purple-700 text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          } px-4 py-2 text-sm font-medium transition-colors duration-200`}
                          style={{ color: pathname === item.href ? '#fff' : '#d1d5db' }}
                          onClick={() => setMobileNavOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-300">
                    {session?.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}