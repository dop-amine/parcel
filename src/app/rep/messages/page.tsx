'use client';

import { useState } from "react";
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MessageSquare,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  DollarSign,
  ExternalLink
} from "lucide-react";

export default function RepMessages() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // API calls
  const { data: activity, isLoading } = api.rep.getRepActivity.useQuery();

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'REP') {
    redirect('/');
  }

  const filteredMessages = activity?.filter(message => {
    const matchesSearch = message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ('execName' in message.metadata && message.metadata.execName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         ('execEmail' in message.metadata && message.metadata.execEmail?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const getMessageIcon = (type: string, subType: string) => {
    if (type === 'deal') {
      switch (subType) {
        case 'pending':
          return <DollarSign className="h-5 w-5 text-orange-400" />;
        case 'accepted':
          return <CheckCircle className="h-5 w-5 text-green-400" />;
        case 'countered':
          return <AlertCircle className="h-5 w-5 text-yellow-400" />;
        case 'declined':
          return <AlertCircle className="h-5 w-5 text-red-400" />;
        default:
          return <MessageSquare className="h-5 w-5 text-gray-400" />;
      }
    } else if (type === 'share') {
      switch (subType) {
        case 'pending':
          return <Clock className="h-5 w-5 text-yellow-400" />;
        case 'viewed':
          return <Play className="h-5 w-5 text-blue-400" />;
        case 'deal_created':
          return <CheckCircle className="h-5 w-5 text-green-400" />;
        default:
          return <MessageSquare className="h-5 w-5 text-gray-400" />;
      }
    }
    return <MessageSquare className="h-5 w-5 text-gray-400" />;
  };

  const getMessageTypeColor = (type: string, subType: string) => {
    if (type === 'deal') {
      switch (subType) {
        case 'pending':
          return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        case 'accepted':
          return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'countered':
          return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'declined':
          return 'bg-red-500/10 text-red-400 border-red-500/20';
        default:
          return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      }
    } else if (type === 'share') {
      switch (subType) {
        case 'pending':
          return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'viewed':
          return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'deal_created':
          return 'bg-green-500/10 text-green-400 border-green-500/20';
        default:
          return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      }
    }
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  // Calculate stats from real data
  const totalMessages = activity?.length || 0;
  const thisWeekMessages = activity?.filter(m =>
    new Date(m.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length || 0;
  const activeDeals = activity?.filter(m =>
    m.type === 'deal' && ['pending', 'countered'].includes(m.subType)
  ).length || 0;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* REP Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-orange-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Messages & Activity</h1>
        </div>
        <Badge variant="secondary" className="bg-orange-900/50 text-orange-400 border-orange-500/50">
          REP
        </Badge>
      </header>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Types</option>
              <option value="deal">Deal Activity</option>
              <option value="share">Playlist Shares</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalMessages}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{thisWeekMessages}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeDeals}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {activity ? Math.round((activity.filter(m => m.type === 'deal' && m.subType === 'accepted').length / Math.max(activity.filter(m => m.type === 'share').length, 1)) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center"
          >
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="mb-2 text-xl font-semibold text-white">No messages found</h3>
            <p className="text-gray-400">
              {searchQuery || typeFilter !== 'all'
                ? "Try adjusting your search or filters."
                : "Your deal activity and notifications will appear here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getMessageIcon(message.type, message.subType)}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">{message.title}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={getMessageTypeColor(message.type, message.subType)}>
                                  {message.subType.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">
                                {new Date(message.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-300 mb-3">{message.content}</p>

                          {/* Metadata Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              {'execEmail' in message.metadata && message.metadata.execEmail && (
                                <>
                                  {'execName' in message.metadata && message.metadata.execName && (
                                    <span className="font-medium text-gray-300">{message.metadata.execName}</span>
                                  )}
                                  <span>{message.metadata.execEmail}</span>
                                </>
                              )}
                              {'playlistName' in message.metadata && (
                                <span className="font-medium text-gray-300">{message.metadata.playlistName}</span>
                              )}
                            </div>

                            {/* Amount for deal messages */}
                            {'amount' in message.metadata && message.metadata.amount && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-400" />
                                <span className="text-green-400 font-semibold">
                                  ${message.metadata.amount.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}