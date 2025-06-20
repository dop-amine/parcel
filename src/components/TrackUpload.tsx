'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useSession } from 'next-auth/react';
import WaveSurfer from 'wavesurfer.js';
import { GENRES, MOODS, MEDIA_TYPES, LICENSE_TYPES, ROYALTY_COLLECTION_ENTITIES, DISALLOWED_USES, ENTITY_TYPES, PUBLISHER_TYPES, TERRITORY_RIGHTS, SONGWRITER_ROLES, PERFORMING_RIGHTS_ORGS, getMediaTypeCategory } from '@/constants/music';
import { Check, ChevronsUpDown, ArrowLeft, ArrowRight, Save, Upload, Music, FileText, DollarSign, Users, Settings, ChevronDown, ChevronRight, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Owner {
  name: string;
  email: string;
  percentage: number;
  entityType?: string;
  labelName?: string;
  paymentContactEmail?: string;
}

interface PublishingOwner {
  publisherName: string;
  contactEmail: string;
  percentage: number;
  proAffiliation?: string;
  ipiNumber?: string;
  publisherType?: string;
  territoryRights?: string;
}

interface Songwriter {
  name: string;
  email: string;
  role: string;
  proAffiliation?: string;
  ipiNumber?: string;
  writingSharePercentage?: number;
}

interface MediaTypePricing {
  mediaTypeId: string;
  basePrice: number | undefined; // Minimum price for negotiations (hidden from buyers)
  buyoutPrice: number | undefined; // One-click purchase price (optional, visible to buyers for digital media)
}

interface FormData {
  // Step 1: Basic Song Info
  title: string;
  description: string;
  genres: string[];
  moods: string[];
  bpm: number | undefined;
  isrcCode: string;
  iswcCode: string;

  // Step 2: File Upload
  file: File | null;
  audioUrl: string;
  duration: number;
  waveformData: number[];

  // Step 3: Ownership & Rights
  ownsFullRights: boolean;
  masterOwners: Owner[];
  publishingOwners: PublishingOwner[];
  songwriters: Songwriter[];

  // Step 4: Sync Licensing & Pricing
  licenseType: string;
  canBeModified: boolean;
  disallowedUses: string[];
  allowedMediaTypes: string[];
  mediaTypePricing: MediaTypePricing[];

  // Legacy fields (to be removed)
  royaltyCollectionEntity: string;
  basePrice: number | undefined;
}

const STEPS = [
  { id: 1, title: 'Basic Song Info', icon: Music, description: 'Track details and metadata' },
  { id: 2, title: 'File Upload', icon: Upload, description: 'Select your audio file' },
  { id: 3, title: 'Ownership & Rights', icon: Users, description: 'Rights ownership and splits' },
  { id: 4, title: 'Sync Licensing & Pricing', icon: Settings, description: 'Licensing terms and pricing per media type' },
  { id: 5, title: 'Verify Information', icon: FileText, description: 'Review and confirm all details before upload' },
];

// Helper functions for file persistence
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const base64ToFile = (base64: string, fileName: string, mimeType: string, lastModified: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      const arr = base64.split(',');
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], fileName, { type: mimeType, lastModified });
      resolve(file);
    } catch (error) {
      reject(error);
    }
  });
};

export default function TrackUpload() {
  const router = useRouter();
  const { data: session } = useSession();
  const uploadMutation = api.track.uploadAndCreate.useMutation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapsible panel state
  const [masterRightsOpen, setMasterRightsOpen] = useState(true);
  const [publishingRightsOpen, setPublishingRightsOpen] = useState(true);
  const [songwritersOpen, setSongwritersOpen] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    genres: [],
    moods: [],
    bpm: undefined,
    isrcCode: '',
    iswcCode: '',
    file: null,
    audioUrl: '',
    duration: 0,
    waveformData: [],
    ownsFullRights: true,
    masterOwners: [],
    publishingOwners: [],
    songwriters: [],
    licenseType: 'non-exclusive',
    canBeModified: false,
    disallowedUses: [],
    allowedMediaTypes: [],
    mediaTypePricing: [],
    royaltyCollectionEntity: '',
    basePrice: undefined,
  });

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (formData.title || formData.file) {
        let fileData = null;

        // Convert file to base64 for storage if it exists
        if (formData.file) {
          try {
            const base64 = await fileToBase64(formData.file);
            fileData = {
              name: formData.file.name,
              size: formData.file.size,
              type: formData.file.type,
              lastModified: formData.file.lastModified,
              base64: base64
            };
          } catch (error) {
            console.warn('Failed to convert file to base64 for autosave:', error);
          }
        }

        localStorage.setItem('trackUploadDraft', JSON.stringify({
          ...formData,
          file: null, // Don't save file object directly
          fileData: fileData // Save serializable file data
        }));
        setLastSaved(new Date());
      }
    };

    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Load draft on component mount
  useEffect(() => {
    const draft = localStorage.getItem('trackUploadDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        const loadDraft = async () => {
          // Restore file from base64 data if it exists
          let restoredFile = null;
          if (parsed.fileData) {
            try {
              restoredFile = await base64ToFile(
                parsed.fileData.base64,
                parsed.fileData.name,
                parsed.fileData.type,
                parsed.fileData.lastModified
              );
            } catch (error) {
              console.warn('Failed to restore file from draft:', error);
            }
          }

          setFormData(prev => ({
            ...prev,
            ...parsed,
            file: restoredFile,
            fileData: undefined // Remove fileData as it's no longer needed
          }));
        };

        loadDraft();
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      updateFormData({
        file: selectedFile,
        title: formData.title || selectedFile.name.replace(/\.[^/.]+$/, '') // Only set title if empty
      });
    }
  };

  const generateWaveformData = async (audioUrl: string): Promise<number[]> => {
    const ws = WaveSurfer.create({
      container: document.createElement('div'),
      backend: 'WebAudio',
    });

    try {
      await ws.load(audioUrl);
      const peaks = ws.exportPeaks({ maxLength: 1000 });
      ws.destroy();
      return peaks[0] || [];
    } catch (err) {
      ws.destroy();
      throw err;
    }
  };

  const uploadFile = async (): Promise<string> => {
    if (!formData.file) throw new Error('No file selected');

    const formDataToSend = new FormData();
    formDataToSend.append('file', formData.file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formDataToSend,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const { url } = await response.json();
    return url;
  };

  const handleNext = async () => {
    // No longer upload on step 2 - just proceed to next step
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload file and process audio data
      const audioUrl = await uploadFile();

      // Generate waveform data
      const waveformData = await generateWaveformData(audioUrl);

      // Get duration using WaveSurfer
      const ws = WaveSurfer.create({
        container: document.createElement('div'),
        backend: 'WebAudio',
      });
      await ws.load(audioUrl);
      const duration = ws.getDuration();
      ws.destroy();

      // Convert PublishingOwner[] to the format expected by the API
      const publishingOwnersForAPI = formData.publishingOwners.map(owner => ({
        name: owner.publisherName,
        email: owner.contactEmail,
        percentage: owner.percentage,
      }));

      // Calculate average minimum sync fee from media type pricing
      const minSyncFee = formData.mediaTypePricing.length > 0
        ? Math.min(...formData.mediaTypePricing.map(p => p.basePrice || 0))
        : undefined;

      await uploadMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        genres: formData.genres,
        moods: formData.moods,
        bpm: formData.bpm,
        isrcCode: formData.isrcCode || undefined,
        iswcCode: formData.iswcCode || undefined,
        audioUrl: audioUrl,
        duration: duration,
        waveformData: waveformData,
        ownsFullRights: formData.ownsFullRights,
        masterOwners: formData.masterOwners,
        publishingOwners: publishingOwnersForAPI,
        songwriters: formData.songwriters,
        minimumSyncFee: minSyncFee,
        allowedMediaTypes: formData.allowedMediaTypes,
        licenseType: formData.licenseType,
        canBeModified: formData.canBeModified,
        disallowedUses: formData.disallowedUses.length > 0 ? formData.disallowedUses.join(', ') : undefined,
        royaltyCollectionEntity: undefined, // Removed from form
        basePrice: undefined, // Replaced with per-media-type pricing
        isNegotiable: formData.mediaTypePricing.some(p => p.buyoutPrice && p.buyoutPrice > 0), // Has buyout pricing
      });

      // Clear draft
      localStorage.removeItem('trackUploadDraft');

      // Reset form
      setFormData({
        title: '',
        description: '',
        genres: [],
        moods: [],
        bpm: undefined,
        isrcCode: '',
        iswcCode: '',
        file: null,
        audioUrl: '',
        duration: 0,
        waveformData: [],
        ownsFullRights: true,
        masterOwners: [],
        publishingOwners: [],
        songwriters: [],
        licenseType: 'non-exclusive',
        canBeModified: false,
        disallowedUses: [],
        allowedMediaTypes: [],
        mediaTypePricing: [],
        royaltyCollectionEntity: '',
        basePrice: undefined,
      });

      router.push('/artist/tracks');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const calculateArtistPercentage = (owners: Owner[]): number => {
    const otherOwnersTotal = owners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
    return Math.max(0, 100 - otherOwnersTotal);
  };

  const calculateArtistPublishingPercentage = (owners: PublishingOwner[]): number => {
    const otherOwnersTotal = owners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
    return Math.max(0, 100 - otherOwnersTotal);
  };

  const addOwner = (type: 'master') => {
    const newOwner: Owner = { name: '', email: '', percentage: 0 };
    updateFormData({ masterOwners: [...formData.masterOwners, newOwner] });
  };

  const addPublishingOwner = () => {
    const newOwner: PublishingOwner = {
      publisherName: '',
      contactEmail: '',
      percentage: 0
    };
    updateFormData({ publishingOwners: [...formData.publishingOwners, newOwner] });
  };

  const updateOwner = (index: number, field: keyof Owner, value: string | number) => {
    const updated = [...formData.masterOwners];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ masterOwners: updated });
  };

  const updatePublishingOwner = (index: number, field: keyof PublishingOwner, value: string | number) => {
    const updated = [...formData.publishingOwners];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ publishingOwners: updated });
  };

  const removeOwner = (index: number) => {
    updateFormData({ masterOwners: formData.masterOwners.filter((_, i) => i !== index) });
  };

  const removePublishingOwner = (index: number) => {
    updateFormData({ publishingOwners: formData.publishingOwners.filter((_, i) => i !== index) });
  };

  // Validation functions
  const getTotalMasterPercentage = (): number => {
    const artistPercentage = calculateArtistPercentage(formData.masterOwners);
    const otherPercentage = formData.masterOwners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
    return artistPercentage + otherPercentage;
  };

  const getTotalPublishingPercentage = (): number => {
    const artistPercentage = calculateArtistPublishingPercentage(formData.publishingOwners);
    const otherPercentage = formData.publishingOwners.reduce((sum, owner) => sum + (owner.percentage || 0), 0);
    return artistPercentage + otherPercentage;
  };

  const isOneStopCleared = (): boolean => {
    return formData.ownsFullRights &&
           formData.masterOwners.length === 0 &&
           formData.publishingOwners.length === 0;
  };

  const getMasterPercentageWarning = (): string | null => {
    const total = getTotalMasterPercentage();
    if (total > 100) return 'Master rights exceed 100%';
    if (total < 100) return 'Master rights total less than 100%';
    return null;
  };

  const getPublishingPercentageWarning = (): string | null => {
    const total = getTotalPublishingPercentage();
    if (total > 100) return 'Publishing rights exceed 100%';
    if (total < 100) return 'Publishing rights total less than 100%';
    return null;
  };

  const addSongwriter = () => {
    const newSongwriter: Songwriter = { name: '', email: '', role: '' };
    updateFormData({ songwriters: [...formData.songwriters, newSongwriter] });
  };

  const updateSongwriter = (index: number, field: keyof Songwriter, value: string | number) => {
    const updated = [...formData.songwriters];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ songwriters: updated });
  };

  const removeSongwriter = (index: number) => {
    updateFormData({ songwriters: formData.songwriters.filter((_, i) => i !== index) });
  };

  // Media Type Pricing helpers
  const updateMediaTypePricing = (mediaTypeId: string, field: keyof MediaTypePricing, value: any) => {
    const existingIndex = formData.mediaTypePricing.findIndex(p => p.mediaTypeId === mediaTypeId);

    if (existingIndex >= 0) {
      const updated = [...formData.mediaTypePricing];
      updated[existingIndex] = { ...updated[existingIndex], [field]: value };
      updateFormData({ mediaTypePricing: updated });
    } else {
      // Create new pricing entry
      const newPricing: MediaTypePricing = {
        mediaTypeId,
        buyoutPrice: undefined,
        basePrice: undefined,
      };
      (newPricing as any)[field] = value;
      updateFormData({ mediaTypePricing: [...formData.mediaTypePricing, newPricing] });
    }
  };

  const getMediaTypePricing = (mediaTypeId: string): MediaTypePricing => {
    return formData.mediaTypePricing.find(p => p.mediaTypeId === mediaTypeId) || {
      mediaTypeId,
      basePrice: undefined,
      buyoutPrice: undefined,
    };
  };

  const syncMediaTypePricing = (selectedMediaTypes: string[]) => {
    // Remove pricing for deselected media types
    const filteredPricing = formData.mediaTypePricing.filter(p => selectedMediaTypes.includes(p.mediaTypeId));
    updateFormData({ mediaTypePricing: filteredPricing });
  };

  const renderStep1 = () => (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Music className="h-5 w-5" />
          Basic Song Info
        </CardTitle>
        <CardDescription className="text-gray-400">
          Provide the essential information about your track
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
      <div>
          <Label htmlFor="title" className="text-gray-300">Song Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Enter song title"
            required
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-gray-300">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe your track..."
            rows={3}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Genres *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  {formData.genres.length > 0
                    ? `${formData.genres.length} selected`
                    : "Select genres..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                <Command className="bg-gray-800">
                  <CommandInput placeholder="Search genres..." className="text-white" />
                  <CommandList>
                    <CommandEmpty className="text-gray-400">No genre found.</CommandEmpty>
                    <CommandGroup>
                      {GENRES.map((genre) => (
                        <CommandItem
                          key={genre.id}
                          onSelect={() => {
                            const updated = formData.genres.includes(genre.id)
                              ? formData.genres.filter(g => g !== genre.id)
                              : [...formData.genres, genre.id];
                            updateFormData({ genres: updated });
                          }}
                          className="text-white hover:bg-gray-700"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.genres.includes(genre.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {genre.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-gray-300">Moods/Emotions *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  {formData.moods.length > 0
                    ? `${formData.moods.length} selected`
                    : "Select moods..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                <Command className="bg-gray-800">
                  <CommandInput placeholder="Search moods..." className="text-white" />
                  <CommandList>
                    <CommandEmpty className="text-gray-400">No mood found.</CommandEmpty>
                    <CommandGroup>
                      {MOODS.map((mood) => (
                        <CommandItem
                          key={mood.id}
                          onSelect={() => {
                            const updated = formData.moods.includes(mood.id)
                              ? formData.moods.filter(m => m !== mood.id)
                              : [...formData.moods, mood.id];
                            updateFormData({ moods: updated });
                          }}
                          className="text-white hover:bg-gray-700"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.moods.includes(mood.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {mood.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="bpm" className="text-gray-300">BPM</Label>
            <Input
              id="bpm"
              type="number"
              value={formData.bpm || ''}
              onChange={(e) => updateFormData({ bpm: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="120"
              min="60"
              max="200"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
            />
          </div>

          <div>
            <Label htmlFor="isrcCode" className="text-gray-300">ISRC Code</Label>
            <Input
              id="isrcCode"
              value={formData.isrcCode}
              onChange={(e) => updateFormData({ isrcCode: e.target.value })}
              placeholder="USRC12345678"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
            />
          </div>

          <div>
            <Label htmlFor="iswcCode" className="text-gray-300">ISWC Code</Label>
            <Input
              id="iswcCode"
              value={formData.iswcCode}
              onChange={(e) => updateFormData({ iswcCode: e.target.value })}
              placeholder="T-123456789-0"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="h-5 w-5" />
          File Upload
        </CardTitle>
        <CardDescription className="text-gray-400">
          Upload your audio file (WAV, FLAC, MP3, M4A, AAC up to 100MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="file" className="text-gray-300">Audio File *</Label>
          <div className="mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
            <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            Select File
            </Button>
            {formData.file && (
              <div className="mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md">
                <p className="text-sm font-medium text-white">{formData.file.name}</p>
                <p className="text-sm text-gray-400">
                  {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        </div>

        {formData.audioUrl && (
          <div className="p-3 bg-green-900/50 border border-green-700 rounded-md">
            <p className="text-sm text-green-300">
              ✓ File uploaded successfully
            </p>
            <p className="text-sm text-green-400">
              Duration: {Math.floor(formData.duration / 60)}:{(formData.duration % 60).toFixed(0).padStart(2, '0')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5" />
          Ownership & Rights
          {isOneStopCleared() && (
            <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-600/30">
              ✅ One-Stop Cleared
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Define ownership structure for Master Recording and Publishing Rights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Ownership Question */}
        <div className="space-y-3">
          <Label className="text-gray-300 font-medium">I own 100% of Master and Publishing rights</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.ownsFullRights ? "default" : "outline"}
              onClick={() => updateFormData({ ownsFullRights: true, masterOwners: [], publishingOwners: [], songwriters: [] })}
              className={cn(
                "flex-1",
                formData.ownsFullRights
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              )}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={!formData.ownsFullRights ? "default" : "outline"}
              onClick={() => updateFormData({ ownsFullRights: false })}
              className={cn(
                "flex-1",
                !formData.ownsFullRights
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              )}
            >
              No
            </Button>
        </div>
      </div>

        {/* Enhanced Ownership Sections - Only show when not owning 100% */}
        {!formData.ownsFullRights && (
          <div className="space-y-6">

            {/* MASTER RIGHTS SECTION */}
            <div className="border border-gray-700 rounded-lg bg-gray-800/30">
              <button
                type="button"
                onClick={() => setMasterRightsOpen(!masterRightsOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
      <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Who Owns the Master Recording?
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      Rights to the sound recording
                    </span>
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    The entity that paid for or owns the actual recording
                  </p>
                </div>
                {masterRightsOpen ?
                  <ChevronDown className="h-5 w-5 text-gray-400" /> :
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                }
              </button>

              {masterRightsOpen && (
                <div className="p-4 border-t border-gray-700 space-y-4">
                  {/* Artist's Master Rights */}
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                    <div className="grid grid-cols-4 gap-3 items-center">
                      <div className="text-gray-300 font-medium">{session?.user?.name || 'You'}</div>
                      <div className="text-gray-400">{session?.user?.email}</div>
                      <div className="text-gray-400 text-sm">Artist</div>
                      <div className="text-gray-300 font-medium text-right">
                        {calculateArtistPercentage(formData.masterOwners)}%
                      </div>
                    </div>
                  </div>

                  {/* Additional Master Rights Owners */}
                  {formData.masterOwners.map((owner, index) => (
                    <div key={index} className="space-y-3 p-3 border border-gray-700 rounded-lg bg-gray-900/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-400">Name *</Label>
                          <Input
                            placeholder="Owner name"
                            value={owner.name}
                            onChange={(e) => updateOwner(index, 'name', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">Entity Type *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              >
                                {owner.entityType
                                  ? ENTITY_TYPES.find(et => et.id === owner.entityType)?.label
                                  : "Select type..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                              <Command className="bg-gray-800">
                                <CommandList>
                                  <CommandGroup>
                                    {ENTITY_TYPES.map((entityType) => (
                                      <CommandItem
                                        key={entityType.id}
                                        onSelect={() => updateOwner(index, 'entityType', entityType.id)}
                                        className="text-white hover:bg-gray-700"
                                      >
                                        {entityType.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
      </div>

                      <div className="grid grid-cols-2 gap-3">
      <div>
                          <Label className="text-sm text-gray-400">Contact Email *</Label>
                          <Input
                            placeholder="contact@example.com"
                            type="email"
                            value={owner.email}
                            onChange={(e) => updateOwner(index, 'email', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">Ownership % *</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="25"
                              type="number"
                              min="0"
                              max="100"
                              value={owner.percentage || ''}
                              onChange={(e) => updateOwner(index, 'percentage', parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOwner(index)}
                              className="bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
      </div>

                      {owner.entityType === 'label' && (
        <div>
                          <Label className="text-sm text-gray-400">Label Name</Label>
                          <Input
                            placeholder="Record label name"
                            value={owner.labelName || ''}
                            onChange={(e) => updateOwner(index, 'labelName', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-sm text-gray-400">Payment Contact Email (if different)</Label>
                        <Input
                          placeholder="payments@example.com"
                          type="email"
                          value={owner.paymentContactEmail || ''}
                          onChange={(e) => updateOwner(index, 'paymentContactEmail', e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addOwner('master')}
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    + Add Master Rights Co-Owner
                  </Button>

                  {/* Master Rights Validation */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Master Rights:</span>
                    <span className={cn(
                      "font-medium",
                      getTotalMasterPercentage() === 100 ? "text-green-400" : "text-orange-400"
                    )}>
                      {getTotalMasterPercentage()}%
                    </span>
                  </div>
                  {getMasterPercentageWarning() && (
                    <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-900/20 border border-orange-800 rounded p-2">
                      <AlertTriangle className="h-4 w-4" />
                      {getMasterPercentageWarning()}
                    </div>
                  )}
                  {formData.masterOwners.length > 0 && (
                    <div className="text-sm text-gray-400 bg-blue-900/20 border border-blue-800 rounded p-2">
                      💡 Other master rights holders will be emailed to confirm their share.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PUBLISHING RIGHTS SECTION */}
            <div className="border border-gray-700 rounded-lg bg-gray-800/30">
              <button
                type="button"
                onClick={() => setPublishingRightsOpen(!publishingRightsOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Who Owns the Publishing Rights (Composition)?
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      Rights to lyrics + melody
                    </span>
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    The entities that control the musical composition itself
                  </p>
                </div>
                {publishingRightsOpen ?
                  <ChevronDown className="h-5 w-5 text-gray-400" /> :
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                }
              </button>

              {publishingRightsOpen && (
                <div className="p-4 border-t border-gray-700 space-y-4">
                  {/* Artist's Publishing Rights */}
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                    <div className="grid grid-cols-4 gap-3 items-center">
                      <div className="text-gray-300 font-medium">{session?.user?.name || 'You'}</div>
                      <div className="text-gray-400">{session?.user?.email}</div>
                      <div className="text-gray-400 text-sm">Self-Published</div>
                      <div className="text-gray-300 font-medium text-right">
                        {calculateArtistPublishingPercentage(formData.publishingOwners)}%
                      </div>
                    </div>
                  </div>

                  {/* Additional Publishing Rights Owners */}
                  {formData.publishingOwners.map((owner, index) => (
                    <div key={index} className="space-y-3 p-3 border border-gray-700 rounded-lg bg-gray-900/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-400">Publisher Name *</Label>
                          <Input
                            placeholder="Publisher name"
                            value={owner.publisherName}
                            onChange={(e) => updatePublishingOwner(index, 'publisherName', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">Publisher Type</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              >
                                {owner.publisherType
                                  ? PUBLISHER_TYPES.find(pt => pt.id === owner.publisherType)?.label
                                  : "Select type..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                              <Command className="bg-gray-800">
                                <CommandList>
                                  <CommandGroup>
                                    {PUBLISHER_TYPES.map((publisherType) => (
                                      <CommandItem
                                        key={publisherType.id}
                                        onSelect={() => updatePublishingOwner(index, 'publisherType', publisherType.id)}
                                        className="text-white hover:bg-gray-700"
                                      >
                                        {publisherType.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-400">Contact Email *</Label>
                          <Input
                            placeholder="publisher@example.com"
                            type="email"
                            value={owner.contactEmail}
                            onChange={(e) => updatePublishingOwner(index, 'contactEmail', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">Ownership % *</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="25"
            type="number"
                              min="0"
                              max="100"
                              value={owner.percentage || ''}
                              onChange={(e) => updatePublishingOwner(index, 'percentage', parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePublishingOwner(index)}
                              className="bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
        </div>

                      <div className="grid grid-cols-2 gap-3">
        <div>
                          <Label className="text-sm text-gray-400 flex items-center gap-1">
                            PRO Affiliation
                            <HelpCircle className="h-3 w-3 text-gray-500" />
                          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              >
                                {owner.proAffiliation
                                  ? PERFORMING_RIGHTS_ORGS.find(pro => pro.id === owner.proAffiliation)?.label
                                  : "Select PRO..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                              <Command className="bg-gray-800">
                                <CommandList>
                                  <CommandGroup>
                                    {PERFORMING_RIGHTS_ORGS.map((pro) => (
                                      <CommandItem
                                        key={pro.id}
                                        onSelect={() => updatePublishingOwner(index, 'proAffiliation', pro.id)}
                                        className="text-white hover:bg-gray-700"
                                      >
                                        {pro.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400 flex items-center gap-1">
                            IPI/CAE Number
                            <HelpCircle className="h-3 w-3 text-gray-500" />
                          </Label>
                          <Input
                            placeholder="123456789"
                            value={owner.ipiNumber || ''}
                            onChange={(e) => updatePublishingOwner(index, 'ipiNumber', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-400">Territory Rights</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                            >
                              {owner.territoryRights
                                ? TERRITORY_RIGHTS.find(tr => tr.id === owner.territoryRights)?.label
                                : "Worldwide"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                            <Command className="bg-gray-800">
                              <CommandList>
                                <CommandGroup>
                                  {TERRITORY_RIGHTS.map((territory) => (
                                    <CommandItem
                                      key={territory.id}
                                      onSelect={() => updatePublishingOwner(index, 'territoryRights', territory.id)}
                                      className="text-white hover:bg-gray-700"
                                    >
                                      {territory.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addPublishingOwner()}
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    + Add Publishing Rights Co-Owner
                  </Button>

                  {/* Publishing Rights Validation */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Publishing Rights:</span>
                    <span className={cn(
                      "font-medium",
                      getTotalPublishingPercentage() === 100 ? "text-green-400" : "text-orange-400"
                    )}>
                      {getTotalPublishingPercentage()}%
                    </span>
                  </div>
                  {getPublishingPercentageWarning() && (
                    <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-900/20 border border-orange-800 rounded p-2">
                      <AlertTriangle className="h-4 w-4" />
                      {getPublishingPercentageWarning()}
                    </div>
                  )}
                  {formData.publishingOwners.length > 0 && (
                    <div className="text-sm text-gray-400 bg-blue-900/20 border border-blue-800 rounded p-2">
                      💡 If other songwriters are involved, they will be asked to confirm/add their publishers.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SONGWRITERS SECTION */}
            <div className="border border-gray-700 rounded-lg bg-gray-800/30">
                    <button
                type="button"
                onClick={() => setSongwritersOpen(!songwritersOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Who Wrote This Song?
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      Actual creators
                    </span>
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    The people who created the lyrics and/or melody
                  </p>
                </div>
                {songwritersOpen ?
                  <ChevronDown className="h-5 w-5 text-gray-400" /> :
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                }
              </button>

              {songwritersOpen && (
                <div className="p-4 border-t border-gray-700 space-y-4">
                  {formData.songwriters.map((songwriter, index) => (
                    <div key={index} className="space-y-3 p-3 border border-gray-700 rounded-lg bg-gray-900/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-400">Name *</Label>
                          <Input
                            placeholder="Songwriter name"
                            value={songwriter.name}
                            onChange={(e) => updateSongwriter(index, 'name', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">Email *</Label>
                          <Input
                            placeholder="songwriter@example.com"
                            type="email"
                            value={songwriter.email}
                            onChange={(e) => updateSongwriter(index, 'email', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-400">Role *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              >
                                {songwriter.role
                                  ? SONGWRITER_ROLES.find(sr => sr.id === songwriter.role)?.label
                                  : "Select role..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                              <Command className="bg-gray-800">
                                <CommandList>
                                  <CommandGroup>
                                    {SONGWRITER_ROLES.map((role) => (
                                      <CommandItem
                                        key={role.id}
                                        onSelect={() => updateSongwriter(index, 'role', role.id)}
                                        className="text-white hover:bg-gray-700"
                                      >
                                        {role.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400">Writing Share % (optional)</Label>
                          <Input
                            placeholder="25"
                            type="number"
                            min="0"
                            max="100"
                            value={songwriter.writingSharePercentage || ''}
                            onChange={(e) => updateSongwriter(index, 'writingSharePercentage', parseInt(e.target.value) || 0)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-gray-400 flex items-center gap-1">
                            PRO Affiliation
                            <HelpCircle className="h-3 w-3 text-gray-500" />
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              >
                                {songwriter.proAffiliation
                                  ? PERFORMING_RIGHTS_ORGS.find(pro => pro.id === songwriter.proAffiliation)?.label
                                  : "Select PRO..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                              <Command className="bg-gray-800">
                                <CommandList>
                                  <CommandGroup>
                                    {PERFORMING_RIGHTS_ORGS.map((pro) => (
                                      <CommandItem
                                        key={pro.id}
                                        onSelect={() => updateSongwriter(index, 'proAffiliation', pro.id)}
                                        className="text-white hover:bg-gray-700"
                                      >
                                        {pro.label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-400 flex items-center gap-1">
                            IPI/CAE Number
                            <HelpCircle className="h-3 w-3 text-gray-500" />
                          </Label>
                          <Input
                            placeholder="123456789"
                            value={songwriter.ipiNumber || ''}
                            onChange={(e) => updateSongwriter(index, 'ipiNumber', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSongwriter(index)}
                          className="bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
                        >
                          Remove Songwriter
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSongwriter}
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    + Add Songwriter
                  </Button>

                  {formData.songwriters.length > 0 && (
                    <div className="text-sm text-gray-400 bg-blue-900/20 border border-blue-800 rounded p-2">
                      💡 Each songwriter will be emailed a link to confirm their info and optionally add their publisher.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="h-5 w-5" />
          Sync Licensing & Pricing
        </CardTitle>
        <CardDescription className="text-gray-400">
          Define licensing terms and set pricing for each media type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* License Type */}
        <div className="space-y-3">
          <Label className="text-gray-300 font-medium">License Type</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.licenseType === 'exclusive' ? "default" : "outline"}
              onClick={() => updateFormData({ licenseType: 'exclusive' })}
                      className={cn(
                "flex-1",
                formData.licenseType === 'exclusive'
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              )}
            >
              Exclusive
            </Button>
            <Button
              type="button"
              variant={formData.licenseType === 'non-exclusive' ? "default" : "outline"}
              onClick={() => updateFormData({ licenseType: 'non-exclusive' })}
              className={cn(
                "flex-1",
                formData.licenseType === 'non-exclusive'
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              )}
            >
              Non-Exclusive
            </Button>
          </div>
        </div>

        {/* Track Modification */}
        <div className="space-y-3">
          <Label className="text-gray-300 font-medium">This track can be modified (remixed, edited, etc.)</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.canBeModified ? "default" : "outline"}
              onClick={() => updateFormData({ canBeModified: true })}
              className={cn(
                "flex-1",
                formData.canBeModified
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              )}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={!formData.canBeModified ? "default" : "outline"}
              onClick={() => updateFormData({ canBeModified: false })}
              className={cn(
                "flex-1",
                !formData.canBeModified
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              )}
            >
              No
            </Button>
          </div>
        </div>

        {/* Disallowed Uses */}
        <div>
          <Label className="text-gray-300 font-medium">Disallowed Uses</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700 mt-2"
              >
                {formData.disallowedUses.length > 0
                  ? `${formData.disallowedUses.length} selected`
                  : "Select disallowed uses..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
              <Command className="bg-gray-800">
                <CommandInput placeholder="Search disallowed uses..." className="text-white" />
                <CommandList>
                  <CommandEmpty className="text-gray-400">No disallowed use found.</CommandEmpty>
                  <CommandGroup>
                    {DISALLOWED_USES.map((use) => (
                      <CommandItem
                        key={use.id}
                        onSelect={() => {
                          const updated = formData.disallowedUses.includes(use.id)
                            ? formData.disallowedUses.filter(u => u !== use.id)
                            : [...formData.disallowedUses, use.id];
                          updateFormData({ disallowedUses: updated });
                        }}
                        className="text-white hover:bg-gray-700"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                            formData.disallowedUses.includes(use.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                        {use.label}
                      </CommandItem>
                  ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Allowed Media Types */}
        <div>
          <Label className="text-gray-300 font-medium">Allowed Media Types *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700 mt-2"
              >
                {formData.allowedMediaTypes.length > 0
                  ? `${formData.allowedMediaTypes.length} selected`
                  : "Select media types..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
              <Command className="bg-gray-800">
                <CommandInput placeholder="Search media types..." className="text-white" />
                <CommandList>
                  <CommandEmpty className="text-gray-400">No media type found.</CommandEmpty>
                  <CommandGroup>
                    {MEDIA_TYPES.map((mediaType) => (
                      <CommandItem
                        key={mediaType.id}
                        onSelect={() => {
                          const updated = formData.allowedMediaTypes.includes(mediaType.id)
                            ? formData.allowedMediaTypes.filter(m => m !== mediaType.id)
                            : [...formData.allowedMediaTypes, mediaType.id];
                          updateFormData({ allowedMediaTypes: updated });
                          syncMediaTypePricing(updated);
                        }}
                        className="text-white hover:bg-gray-700"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                            formData.allowedMediaTypes.includes(mediaType.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                        {mediaType.label}
                      </CommandItem>
                  ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Pricing Per Media Type */}
        {formData.allowedMediaTypes.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Pricing by Media Type</h3>
              <p className="text-sm text-gray-400 mb-4">
                Set pricing for each selected media type.
              </p>
      </div>

            {formData.allowedMediaTypes.map((mediaTypeId) => {
              const mediaType = MEDIA_TYPES.find(mt => mt.id === mediaTypeId);
              const pricing = getMediaTypePricing(mediaTypeId);
              const category = getMediaTypeCategory(mediaTypeId);

              return (
                <div key={mediaTypeId} className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      {mediaType?.label}
                      {category === 'traditional' && (
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                          Negotiation Only
                        </span>
                      )}
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {/* Base Price - Required for all media types */}
      <div>
                      <Label className="text-sm text-gray-300">Base Price (USD) *</Label>
                      <Input
          type="number"
                        placeholder={category === 'traditional' ? "5000" : "250"}
          min="0"
          step="1"
                        value={pricing.basePrice || ''}
                        onChange={(e) => updateMediaTypePricing(
                          mediaTypeId,
                          'basePrice',
                          e.target.value ? parseFloat(e.target.value) : 0
                        )}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 mt-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Minimum price for negotiations (hidden from buyers)
                      </p>
      </div>

                    {/* Buyout Price - Only for digital media types */}
                    {category === 'digital' && (
                      <div>
                        <Label className="text-sm text-gray-300">Buyout Price (USD) - Optional</Label>
                        <Input
                          type="number"
                          placeholder="500"
                          min="0"
                          step="1"
                          value={pricing.buyoutPrice || ''}
                          onChange={(e) => updateMediaTypePricing(
                            mediaTypeId,
                            'buyoutPrice',
                            e.target.value ? parseFloat(e.target.value) : 0
                          )}
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 mt-1"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          One-click purchase price (visible to buyers). If set, buyers can purchase instantly without negotiation.
                        </p>
                        {pricing.buyoutPrice && pricing.buyoutPrice > 0 && (
                          <div className="flex items-center gap-2 mt-2 text-green-400 text-xs">
                            <span className="bg-green-600/20 px-2 py-1 rounded border border-green-600/30">
                              ✨ One-Click Purchase Available
                            </span>
      </div>
                        )}
                      </div>
                    )}

                    {/* Explanation for traditional media */}
                    {category === 'traditional' && (
                      <div className="text-xs text-blue-400 bg-blue-900/20 border border-blue-800 rounded p-2">
                        💼 Traditional media licensing typically involves custom negotiations based on budget, usage scope, and term length. Our sync reps will negotiate the best deal for you.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5" />
          Verify Information
        </CardTitle>
        <CardDescription className="text-gray-400">
          Review and confirm all details before uploading your track
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Basic Song Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
            Basic Song Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-400">Song Title</Label>
              <p className="text-white font-medium">{formData.title}</p>
            </div>
            {formData.description && (
              <div>
                <Label className="text-sm text-gray-400">Description</Label>
                <p className="text-white">{formData.description}</p>
              </div>
            )}
            <div>
              <Label className="text-sm text-gray-400">Genres</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.genres.map(genre => (
                  <span key={genre} className="bg-purple-900/50 text-purple-200 text-xs px-2 py-1 rounded-full">
                    {GENRES.find(g => g.id === genre)?.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-400">Moods</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.moods.map(mood => (
                  <span key={mood} className="bg-blue-900/50 text-blue-200 text-xs px-2 py-1 rounded-full">
                    {MOODS.find(m => m.id === mood)?.label}
                  </span>
                ))}
              </div>
            </div>
            {formData.bpm && (
              <div>
                <Label className="text-sm text-gray-400">BPM</Label>
                <p className="text-white">{formData.bpm}</p>
              </div>
            )}
            {formData.isrcCode && (
              <div>
                <Label className="text-sm text-gray-400">ISRC Code</Label>
                <p className="text-white">{formData.isrcCode}</p>
              </div>
            )}
            {formData.iswcCode && (
              <div>
                <Label className="text-sm text-gray-400">ISWC Code</Label>
                <p className="text-white">{formData.iswcCode}</p>
              </div>
            )}
          </div>
        </div>

        {/* File Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
            Audio File
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-400">File Name</Label>
              <p className="text-white">{formData.file?.name}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-400">File Size</Label>
              <p className="text-white">
                {formData.file ? `${(formData.file.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Ownership & Rights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center gap-2">
            Ownership & Rights
            {isOneStopCleared() && (
              <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-600/30">
                ✅ One-Stop Cleared
              </span>
            )}
          </h3>
          <div>
            <Label className="text-sm text-gray-400">Full Rights Ownership</Label>
            <p className="text-white">{formData.ownsFullRights ? 'Yes - I own 100% of Master and Publishing rights' : 'No - Split ownership'}</p>
          </div>

          {!formData.ownsFullRights && (
            <>
              {formData.masterOwners.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-400">Master Rights Co-Owners</Label>
                  <div className="space-y-2 mt-1">
                    {formData.masterOwners.map((owner, index) => (
                      <div key={index} className="bg-gray-800/50 p-2 rounded text-sm">
                        <span className="text-white">{owner.name}</span> - {owner.percentage}%
                        {owner.entityType && (
                          <span className="text-gray-400 ml-2">({ENTITY_TYPES.find(et => et.id === owner.entityType)?.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.publishingOwners.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-400">Publishing Rights Co-Owners</Label>
                  <div className="space-y-2 mt-1">
                    {formData.publishingOwners.map((owner, index) => (
                      <div key={index} className="bg-gray-800/50 p-2 rounded text-sm">
                        <span className="text-white">{owner.publisherName}</span> - {owner.percentage}%
                        {owner.publisherType && (
                          <span className="text-gray-400 ml-2">({PUBLISHER_TYPES.find(pt => pt.id === owner.publisherType)?.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.songwriters.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-400">Songwriters</Label>
                  <div className="space-y-2 mt-1">
                    {formData.songwriters.map((songwriter, index) => (
                      <div key={index} className="bg-gray-800/50 p-2 rounded text-sm">
                        <span className="text-white">{songwriter.name}</span>
                        {songwriter.role && (
                          <span className="text-gray-400 ml-2">({SONGWRITER_ROLES.find(sr => sr.id === songwriter.role)?.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Licensing & Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
            Sync Licensing & Pricing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-400">License Type</Label>
              <p className="text-white capitalize">{formData.licenseType}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-400">Track Modification</Label>
              <p className="text-white">{formData.canBeModified ? 'Yes - Can be modified' : 'No - Cannot be modified'}</p>
            </div>
          </div>

          {formData.disallowedUses.length > 0 && (
            <div>
              <Label className="text-sm text-gray-400">Disallowed Uses</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.disallowedUses.map(use => (
                  <span key={use} className="bg-red-900/50 text-red-200 text-xs px-2 py-1 rounded-full">
                    {DISALLOWED_USES.find(du => du.id === use)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm text-gray-400">Media Types & Pricing</Label>
            <div className="space-y-3 mt-2">
              {formData.allowedMediaTypes.map(mediaTypeId => {
                const mediaType = MEDIA_TYPES.find(mt => mt.id === mediaTypeId);
                const pricing = getMediaTypePricing(mediaTypeId);
                const category = getMediaTypeCategory(mediaTypeId);

                return (
                  <div key={mediaTypeId} className="bg-gray-800/50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{mediaType?.label}</span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                        {category === 'traditional' ? 'Negotiation Only' : 'One-Click Available'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-400">Base Price: </span>
                        <span className="text-white">${pricing.basePrice || 'Not set'}</span>
                      </div>
                      {category === 'digital' && pricing.buyoutPrice && (
                        <div>
                          <span className="text-gray-400">Buyout Price: </span>
                          <span className="text-white">${pricing.buyoutPrice}</span>
                          <span className="text-green-400 ml-2 text-xs">✨ One-Click Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.genres.length > 0 && formData.moods.length > 0;
      case 2:
        return formData.file !== null; // Only check for file selection, not upload
      case 3:
        return true; // All ownership fields are optional or have defaults
      case 4:
        // Validate licensing and pricing
        if (!formData.allowedMediaTypes.length || !formData.licenseType) return false;

        // Check that all selected media types have required pricing
        for (const mediaTypeId of formData.allowedMediaTypes) {
          const pricing = getMediaTypePricing(mediaTypeId);
          const category = getMediaTypeCategory(mediaTypeId);

          // Base price is required for all media types
          if (!pricing.basePrice || pricing.basePrice <= 0) return false;

          // No additional validation needed - buyout price is optional for digital media
        }

        return true;
      case 5:
        // Final verification step - ensure we have all required data
        return formData.file !== null && formData.title && formData.genres.length > 0 && formData.moods.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 bg-gray-950 min-h-screen p-6">
      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Upload Track</h1>
          {lastSaved && (
            <p className="text-sm text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep > step.id
                    ? "bg-purple-600 text-white"
                    : currentStep === step.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-400"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-2",
                    currentStep > step.id ? "bg-purple-600" : "bg-gray-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Progress value={(currentStep / STEPS.length) * 100} className="h-2 bg-gray-800" />

        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-gray-400">
            {STEPS[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      {renderCurrentStep()}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-800 rounded-md">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isUploading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isUploading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Uploading Track...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Upload Track
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}