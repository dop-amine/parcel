'use client';

import { useState } from "react";
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Mail,
  Building,
  Phone,
  Edit,
  Trash2,
  Calendar,
  Activity
} from "lucide-react";

export default function RepContacts() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    company: "",
    title: "",
    notes: ""
  });

  // API calls
  const { data: contacts, isLoading, refetch } = api.rep.getExecContacts.useQuery();
  const addContactMutation = api.rep.addExecContact.useMutation();
  const updateContactMutation = api.rep.updateExecContact.useMutation();
  const deleteContactMutation = api.rep.deleteExecContact.useMutation();

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

  const filteredContacts = contacts?.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddContact = async () => {
    try {
      await addContactMutation.mutateAsync(newContact);
      setIsAddModalOpen(false);
      setNewContact({ name: "", email: "", company: "", title: "", notes: "" });
      refetch();
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    try {
      await updateContactMutation.mutateAsync({
        contactId: selectedContact.id,
        name: selectedContact.name,
        email: selectedContact.email,
        company: selectedContact.company,
        title: selectedContact.title,
        notes: selectedContact.notes,
      });
      setIsEditModalOpen(false);
      setSelectedContact(null);
      refetch();
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await deleteContactMutation.mutateAsync({ contactId });
      refetch();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  // Calculate stats from real data
  const totalContacts = contacts?.length || 0;
  const activeThisMonth = contacts?.filter(c =>
    c.lastContactedAt &&
    new Date(c.lastContactedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length || 0;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* REP Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-orange-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Contacts</h1>
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
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
            disabled={addContactMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalContacts}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeThisMonth}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Set(contacts?.map(c => c.company).filter(Boolean)).size || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Recent Additions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {contacts?.filter(c =>
                  new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts List */}
        {filteredContacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center"
          >
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="mb-2 text-xl font-semibold text-white">No contacts found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery ? "Try adjusting your search query." : "Start building your network of music executives."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{contact.name || 'No name'}</h3>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{contact.email}</span>
                            </div>
                            {(contact.company || contact.title) && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span>
                                  {contact.company}
                                  {contact.title && contact.company && <span className="text-gray-500"> • {contact.title}</span>}
                                  {contact.title && !contact.company && contact.title}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {contact.lastContactedAt
                                  ? `Last contacted ${new Date(contact.lastContactedAt).toLocaleDateString()}`
                                  : `Added ${new Date(contact.createdAt).toLocaleDateString()}`
                                }
                              </span>
                            </div>
                          </div>

                          {contact.notes && (
                            <p className="text-sm text-gray-400 mb-3">{contact.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContact(contact);
                              setIsEditModalOpen(true);
                            }}
                            disabled={updateContactMutation.isPending}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-red-400 hover:text-red-300"
                            disabled={deleteContactMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

      {/* Add Contact Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Executive Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Name</label>
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Email</label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Company</label>
                <Input
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Sony Music"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Title</label>
                <Input
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  placeholder="Music Supervisor"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Notes</label>
              <textarea
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                placeholder="Contact preferences, music interests, current projects..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAddContact}
              disabled={!newContact.name.trim() || !newContact.email.trim() || addContactMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {addContactMutation.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Name</label>
                <Input
                  value={selectedContact.name || ''}
                  onChange={(e) => setSelectedContact({ ...selectedContact, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Email</label>
                <Input
                  type="email"
                  value={selectedContact.email}
                  onChange={(e) => setSelectedContact({ ...selectedContact, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Company</label>
                  <Input
                    value={selectedContact.company || ''}
                    onChange={(e) => setSelectedContact({ ...selectedContact, company: e.target.value })}
                    placeholder="Sony Music"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Title</label>
                  <Input
                    value={selectedContact.title || ''}
                    onChange={(e) => setSelectedContact({ ...selectedContact, title: e.target.value })}
                    placeholder="Music Supervisor"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Notes</label>
                <textarea
                  value={selectedContact.notes || ''}
                  onChange={(e) => setSelectedContact({ ...selectedContact, notes: e.target.value })}
                  placeholder="Contact preferences, music interests, current projects..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleEditContact}
              disabled={updateContactMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {updateContactMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}