'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { api } from '@/utils/api';
import {
  Users,
  Mail,
  Music,
  TrendingUp,
  PlayCircle,
  MessageSquare,
  Plus,
  ExternalLink
} from 'lucide-react';

export default function RepDashboard() {
  const { data: session, status } = useSession();

  // API calls
  const { data: stats, isLoading: statsLoading } = api.rep.getRepStats.useQuery();
  const { data: activity, isLoading: activityLoading } = api.rep.getRepActivity.useQuery();

  if (status === 'loading' || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'REP') {
    redirect('/');
  }

  const getActivityIcon = (type: string, subType: string) => {
    if (type === 'deal') {
      switch (subType) {
        case 'pending':
          return '🔄';
        case 'accepted':
          return '✅';
        case 'countered':
          return '💬';
        case 'declined':
          return '❌';
        default:
          return '📄';
      }
    } else if (type === 'share') {
      switch (subType) {
        case 'pending':
          return '📤';
        case 'viewed':
          return '👁️';
        case 'deal_created':
          return '🎯';
        default:
          return '📋';
      }
    }
    return '📌';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Representative Dashboard</h1>
          <p className="text-gray-400">Manage deals, share playlists, and facilitate music licensing</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Deals</CardTitle>
              <MessageSquare className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.activeDeals || 0}</div>
              <p className="text-xs text-gray-400">Pending & countered</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Shared Playlists</CardTitle>
              <PlayCircle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.sharedPlaylists || 0}</div>
              <p className="text-xs text-gray-400">Total shares sent</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Exec Contacts</CardTitle>
              <Users className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.execContacts || 0}</div>
              <p className="text-xs text-gray-400">In your network</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.conversionRate || 0}%</div>
              <p className="text-xs text-green-400">Shares to deals</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/rep/explore">
                <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                  <Music className="h-4 w-4 mr-2" />
                  Browse Music Catalog
                </Button>
              </Link>
              <Link href="/rep/library">
                <Button variant="outline" className="w-full justify-start border-gray-700 text-gray-300">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Manage Playlists
                </Button>
              </Link>
              <Link href="/rep/contacts">
                <Button variant="outline" className="w-full justify-start border-gray-700 text-gray-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exec Contact
                </Button>
              </Link>
              <Link href="/rep/messages">
                <Button variant="outline" className="w-full justify-start border-gray-700 text-gray-300">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Deal Messages
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-400 mx-auto"></div>
                  </div>
                ) : activity && activity.length > 0 ? (
                  activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg mt-1">
                        {getActivityIcon(item.type, item.subType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">{item.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">{formatTimeAgo(item.createdAt)}</p>
                          {'amount' in item.metadata && item.metadata.amount && (
                            <span className="text-xs text-green-400 font-medium">
                              ${item.metadata.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Start sharing playlists to see activity here</p>
                  </div>
                )}
              </div>
              {activity && activity.length > 5 && (
                <div className="mt-4">
                  <Link href="/rep/messages">
                    <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300">
                      View all activity
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}