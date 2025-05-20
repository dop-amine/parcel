"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, Library, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  // Placeholder stats
  const stats = [
    {
      title: "Total Users",
      value: 12,
      icon: Users,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Active Deals",
      value: 3,
      icon: MessageSquare,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      title: "Playlists",
      value: 7,
      icon: Library,
      color: "text-green-500 bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400 max-w-2xl">
          Welcome, Sync Manager! Here you can manage users, deals, and playlists. As a sync manager, you coordinate music licensing deals between artists and executives.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg hover:bg-gray-800/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg group-hover:opacity-80 transition-colors ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <Link
          href="/admin/messages"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Start New Deal
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          <Users className="w-5 h-5" /> Manage Users
        </Link>
        <Link
          href="/admin/library"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          <Library className="w-5 h-5" /> Manage Playlists
        </Link>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-gray-400">
          <p>No recent activity yet. As you start managing deals, user and playlist activity will appear here.</p>
        </div>
      </div>
    </div>
  );
}