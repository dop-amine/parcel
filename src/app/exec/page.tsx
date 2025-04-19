"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ShoppingCart, BarChart3 } from "lucide-react";

export default function ExecDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user.role !== "EXEC") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="space-y-8 p-8">
        <div className="h-8 w-64 bg-gray-900/50 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg animate-pulse h-[200px]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Executive Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your activity overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg hover:bg-gray-800/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Recent Purchases</h2>
              <p className="text-sm text-gray-400">View your latest acquisitions</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {/* Add recent purchases list here */}
            <p className="text-gray-500 text-sm">No recent purchases</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg hover:bg-gray-800/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/10 rounded-lg group-hover:bg-purple-600/20 transition-colors">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Messages</h2>
              <p className="text-sm text-gray-400">Your conversations with artists</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {/* Add messages list here */}
            <p className="text-gray-500 text-sm">No recent messages</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg hover:bg-gray-800/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600/10 rounded-lg group-hover:bg-green-600/20 transition-colors">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Statistics</h2>
              <p className="text-sm text-gray-400">Track your activity metrics</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {/* Add statistics here */}
            <p className="text-gray-500 text-sm">No statistics available</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}