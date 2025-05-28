'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { UserTier, ArtistTier, BuyerTier } from '@/types/deal';
import { getArtistTierInfo, getBuyerTierInfo } from '@/utils/tiers';

interface TierSelectorProps {
  userRole: 'ARTIST' | 'EXEC';
  selectedTier?: UserTier;
  onTierSelect: (tier: UserTier) => void;
  disabled?: boolean;
  className?: string;
}

export default function TierSelector({
  userRole,
  selectedTier,
  onTierSelect,
  disabled = false,
  className = ""
}: TierSelectorProps) {
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);

  const artistTiers: ArtistTier[] = ['ARTIST', 'LABEL', 'ROSTERED'];
  const buyerTiers: BuyerTier[] = ['CREATOR', 'STUDIO', 'PRO'];

  const tiers = userRole === 'ARTIST' ? artistTiers : buyerTiers;

  const getTierIcon = (tier: UserTier) => {
    if (userRole === 'ARTIST') {
      switch (tier) {
        case 'ARTIST': return <Zap className="h-5 w-5" />;
        case 'LABEL': return <Star className="h-5 w-5" />;
        case 'ROSTERED': return <Crown className="h-5 w-5" />;
      }
    } else {
      switch (tier) {
        case 'CREATOR': return <Zap className="h-5 w-5" />;
        case 'STUDIO': return <Star className="h-5 w-5" />;
        case 'PRO': return <Crown className="h-5 w-5" />;
      }
    }
    return <Zap className="h-5 w-5" />;
  };

  const isPopular = (tier: UserTier) => {
    return (userRole === 'ARTIST' && tier === 'LABEL') ||
           (userRole === 'EXEC' && tier === 'STUDIO');
  };

  const isRequestAccess = (tier: UserTier) => {
    return tier === 'ROSTERED' || tier === 'PRO';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Choose Your {userRole === 'ARTIST' ? 'Artist' : 'Buyer'} Tier
        </h3>
        <p className="text-gray-400">
          {userRole === 'ARTIST'
            ? 'Select the tier that matches your music career level'
            : 'Choose the tier that fits your licensing needs'
          }
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const tierInfo = userRole === 'ARTIST'
            ? getArtistTierInfo(tier as ArtistTier)
            : getBuyerTierInfo(tier as BuyerTier);

          const isSelected = selectedTier === tier;
          const isHovered = hoveredTier === tier;
          const popular = isPopular(tier);
          const requestAccess = isRequestAccess(tier);

          return (
            <Card
              key={tier}
              className={`relative cursor-pointer transition-all duration-200 border-2 ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10'
                  : isHovered
                    ? 'border-gray-600 bg-gray-800/80'
                    : 'border-gray-800 bg-gray-900/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onMouseEnter={() => !disabled && setHoveredTier(tier)}
              onMouseLeave={() => !disabled && setHoveredTier(null)}
              onClick={() => !disabled && !requestAccess && onTierSelect(tier)}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-600 text-white border-orange-500">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-3 text-orange-400">
                  {getTierIcon(tier)}
                </div>
                <CardTitle className="text-xl text-white">{tierInfo.name}</CardTitle>
                <p className="text-gray-400 text-sm">{tierInfo.description}</p>
                <div className="text-2xl font-bold text-white mt-2">
                  {tierInfo.price}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tierInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {userRole === 'ARTIST' && 'uploadLimit' in tierInfo && (
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-800">
                    Upload limit: {tierInfo.uploadLimit === -1 ? 'Unlimited' : `${tierInfo.uploadLimit} tracks/month`}
                  </div>
                )}

                {userRole === 'EXEC' && 'accessLevel' in tierInfo && (
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-800">
                    Access: {tierInfo.accessLevel}
                  </div>
                )}

                <Button
                  className={`w-full mt-4 ${
                    isSelected
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : requestAccess
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled && requestAccess) {
                      // Handle request access flow
                      alert('Request access functionality coming soon!');
                    }
                  }}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : requestAccess ? (
                    'Request Access'
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTier && !isRequestAccess(selectedTier) && (
        <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm">
            ✓ You've selected the <strong>{getTierDisplayName(selectedTier)}</strong> tier.
            {userRole === 'ARTIST' ? ' You can start uploading tracks immediately.' : ' You can browse and license tracks right away.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function (could be moved to utils)
function getTierDisplayName(tier: UserTier): string {
  switch (tier) {
    case 'ARTIST': return 'Artist';
    case 'LABEL': return 'Label';
    case 'ROSTERED': return 'Rostered';
    case 'CREATOR': return 'Creator';
    case 'STUDIO': return 'Studio';
    case 'PRO': return 'Pro';
    default: return tier;
  }
}