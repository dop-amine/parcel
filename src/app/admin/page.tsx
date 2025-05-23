"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  Users,
  Music,
  Handshake,
  List,
  MessageSquare,
  Settings,
  DollarSign,
  FileText,
  Search,
  Download,
  Filter,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Import individual admin sections
import AdminUsers from '@/components/admin/AdminUsers';
import AdminTracks from '@/components/admin/AdminTracks';
import AdminDeals from '@/components/admin/AdminDeals';
import AdminPlaylists from '@/components/admin/AdminPlaylists';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminPlatform from '@/components/admin/AdminPlatform';
import AdminFinancials from '@/components/admin/AdminFinancials';

const adminTabs = [
  { id: 'users', name: 'Users', icon: Users, description: 'Manage all platform users' },
  { id: 'tracks', name: 'Tracks', icon: Music, description: 'View and manage all tracks' },
  { id: 'deals', name: 'Deals', icon: Handshake, description: 'Oversee all deal activity' },
  { id: 'playlists', name: 'Playlists', icon: List, description: 'Manage playlists and shares' },
  { id: 'messages', name: 'Messages', icon: MessageSquare, description: 'Moderate conversations' },
  { id: 'platform', name: 'Platform', icon: Settings, description: 'Platform settings & audit logs' },
  { id: 'financials', name: 'Financials', icon: DollarSign, description: 'Revenue and payments' },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('users');

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const activeTabData = adminTabs.find(tab => tab.id === activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsers />;
      case 'tracks':
        return <AdminTracks />;
      case 'deals':
        return <AdminDeals />;
      case 'playlists':
        return <AdminPlaylists />;
      case 'messages':
        return <AdminMessages />;
      case 'platform':
        return <AdminPlatform />;
      case 'financials':
        return <AdminFinancials />;
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Full operational control over the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-500/50">
            ADMIN
          </Badge>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Audit Logs
          </Button>
        </div>
      </header>

      <div className="flex w-full max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-80 min-w-[280px] border-r border-gray-800 bg-gray-900/30 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Admin Sections</h2>
            <nav className="space-y-2">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-purple-900/60 border border-purple-500/50 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tab.name}</div>
                      <div className="text-xs text-gray-500 truncate">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              {activeTabData && <activeTabData.icon className="h-6 w-6 text-purple-400" />}
              <h2 className="text-2xl font-bold text-white">{activeTabData?.name}</h2>
            </div>
            <p className="text-gray-400">{activeTabData?.description}</p>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}