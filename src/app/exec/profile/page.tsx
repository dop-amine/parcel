'use client';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ExecProfilePage() {
  const { data: session } = useSession();
  const { data: user, refetch } = api.user.me.useQuery();
  const updateProfile = api.user.updateProfile.useMutation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    profilePicture: '',
    bio: '',
    location: '',
    socialLinks: [] as string[],
    company: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        location: user.location || '',
        socialLinks: Array.isArray(user.socialLinks)
          ? user.socialLinks
          : user.socialLinks
          ? Object.values(user.socialLinks)
          : [],
        company: user.company || '',
      });
    }
  }, [user]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSocialLinkChange = (idx: number, value: string) => {
    setForm((prev) => {
      const links = [...prev.socialLinks];
      links[idx] = value;
      return { ...prev, socialLinks: links };
    });
  };

  const handleAddSocialLink = () => {
    setForm((prev) => ({ ...prev, socialLinks: [...prev.socialLinks, ''] }));
  };

  const handleRemoveSocialLink = (idx: number) => {
    setForm((prev) => {
      const links = [...prev.socialLinks];
      links.splice(idx, 1);
      return { ...prev, socialLinks: links };
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      ...form,
      socialLinks: form.socialLinks.filter((link) => link.trim() !== ''),
    });
    refetch();
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        bio: user.bio || '',
        location: user.location || '',
        socialLinks: Array.isArray(user.socialLinks)
          ? user.socialLinks
          : user.socialLinks
          ? Object.values(user.socialLinks)
          : [],
        company: user.company || '',
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-xl p-8 space-y-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-xl text-white">
        {!isEditing ? (
          <div className="space-y-6 text-white">
            <div className="flex flex-col items-center space-y-2">
              {form.profilePicture && (
                <img src={form.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border border-gray-700" />
              )}
              <h2 className="text-2xl font-semibold">{form.name}</h2>
              <p className="text-gray-400">{form.email}</p>
            </div>
            <div className="space-y-2">
              <div><span className="font-semibold">Bio:</span> <span className="text-gray-300">{form.bio || <span className="italic text-gray-500">No bio</span>}</span></div>
              <div><span className="font-semibold">Location:</span> <span className="text-gray-300">{form.location || <span className="italic text-gray-500">No location</span>}</span></div>
              <div><span className="font-semibold">Company:</span> <span className="text-gray-300">{form.company || <span className="italic text-gray-500">No company</span>}</span></div>
              <div>
                <span className="font-semibold">Social Links:</span>
                {form.socialLinks.length > 0 ? (
                  <ul className="list-disc ml-6 mt-1 text-gray-200">
                    {form.socialLinks.map((link, idx) => (
                      <li key={idx}><a href={link} target="_blank" rel="noopener noreferrer" className="underline">{link}</a></li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-gray-500 ml-2">No social links</span>
                )}
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-white">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input name="name" value={form.name} onChange={handleChange} required className="text-white" />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input name="email" value={form.email} disabled className="opacity-60 cursor-not-allowed text-white" />
              </div>
              <div>
                <Label htmlFor="profilePicture" className="text-white">Profile Picture URL</Label>
                <Input name="profilePicture" value={form.profilePicture} onChange={handleChange} className="text-white" />
              </div>
              <div>
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white" />
              </div>
              <div>
                <Label htmlFor="location" className="text-white">Location</Label>
                <Input name="location" value={form.location} onChange={handleChange} className="text-white" />
              </div>
              <div>
                <Label htmlFor="company" className="text-white">Company</Label>
                <Input name="company" value={form.company} onChange={handleChange} className="text-white" />
              </div>
              <div>
                <Label className="text-white">Social Links</Label>
                <div className="space-y-2">
                  {form.socialLinks.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={link}
                        onChange={e => handleSocialLinkChange(idx, e.target.value)}
                        className="text-white flex-1"
                        placeholder="https://..."
                      />
                      <Button type="button" variant="destructive" onClick={() => handleRemoveSocialLink(idx)} className="px-2 py-1">-</Button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={handleAddSocialLink} className="mt-1">+ Add Link</Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="default" onClick={handleCancel} className="w-full">
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfile.isPending} variant="secondary" className="w-full">
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}