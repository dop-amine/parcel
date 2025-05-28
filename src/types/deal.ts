export type UserRole = "ARTIST" | "EXEC" | "ADMIN" | "REP";

export type ArtistTier = "ARTIST" | "LABEL" | "ROSTERED";
export type BuyerTier = "CREATOR" | "STUDIO" | "PRO";
export type UserTier = ArtistTier | BuyerTier;

// Utility functions for tier checking
export const isArtistTier = (tier: UserTier): tier is ArtistTier => {
  return ['ARTIST', 'LABEL', 'ROSTERED'].includes(tier);
};

export const isBuyerTier = (tier: UserTier): tier is BuyerTier => {
  return ['CREATOR', 'STUDIO', 'PRO'].includes(tier);
};

export const getArtistTierDisplayName = (tier: ArtistTier): string => {
  switch (tier) {
    case 'ARTIST': return 'Artist';
    case 'LABEL': return 'Label';
    case 'ROSTERED': return 'Rostered';
  }
};

export const getBuyerTierDisplayName = (tier: BuyerTier): string => {
  switch (tier) {
    case 'CREATOR': return 'Creator';
    case 'STUDIO': return 'Studio';
    case 'PRO': return 'Pro';
  }
};

export const getTierDisplayName = (tier: UserTier): string => {
  if (isArtistTier(tier)) {
    return getArtistTierDisplayName(tier);
  }
  return getBuyerTierDisplayName(tier);
};

export type DealStatus = "PENDING" | "COUNTERED" | "ACCEPTED" | "DECLINED" | "AWAITING_RESPONSE" | "CANCELLED";

export type DealAction = "COUNTER" | "ACCEPT" | "DECLINE" | "CANCEL";

export interface DealTerms {
  usageType: "SYNC" | "MASTER";
  rights: "EXCLUSIVE" | "NON_EXCLUSIVE";
  duration: number;
  price: number;
}

export interface Deal {
  id: string;
  trackId: string;
  state: DealStatus;
  terms: DealTerms;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdByRole: UserRole;
  track: {
    id: string;
    title: string;
  };
  artistId: string;
  execId: string;
}

export interface DealHistoryEntry {
  id: string;
  dealId: string;
  userId: string;
  userRole: UserRole;
  action: DealAction;
  previousState: DealStatus;
  newState: DealStatus;
  changes: Partial<DealTerms>;
  timestamp: Date;
}

export interface DealStateTransition {
  from: DealStatus;
  to: DealStatus;
  allowedRoles: UserRole[];
}

export const DEAL_STATE_TRANSITIONS: DealStateTransition[] = [
  {
    from: "PENDING",
    to: "COUNTERED",
    allowedRoles: ["ARTIST", "EXEC", "REP"],
  },
  {
    from: "PENDING",
    to: "ACCEPTED",
    allowedRoles: ["ARTIST"],
  },
  {
    from: "PENDING",
    to: "DECLINED",
    allowedRoles: ["ARTIST"],
  },
  {
    from: "PENDING",
    to: "CANCELLED",
    allowedRoles: ["EXEC", "REP"],
  },
  {
    from: "COUNTERED",
    to: "PENDING",
    allowedRoles: ["EXEC", "REP"],
  },
  {
    from: "COUNTERED",
    to: "ACCEPTED",
    allowedRoles: ["ARTIST"],
  },
  {
    from: "COUNTERED",
    to: "DECLINED",
    allowedRoles: ["ARTIST"],
  },
  {
    from: "COUNTERED",
    to: "CANCELLED",
    allowedRoles: ["EXEC", "REP"],
  },
  {
    from: "AWAITING_RESPONSE",
    to: "ACCEPTED",
    allowedRoles: ["ARTIST"],
  },
  {
    from: "AWAITING_RESPONSE",
    to: "DECLINED",
    allowedRoles: ["ARTIST"],
  },
  {
    from: "AWAITING_RESPONSE",
    to: "CANCELLED",
    allowedRoles: ["EXEC", "REP"],
  },
  {
    from: "AWAITING_RESPONSE",
    to: "COUNTERED",
    allowedRoles: ["ARTIST"],
  },
];

export class DealError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
  }
}

export class InvalidStateTransitionError extends DealError {
  constructor() {
    super(
      "Invalid state transition",
      "INVALID_STATE_TRANSITION",
      400
    );
  }
}

export class UnauthorizedActionError extends DealError {
  constructor() {
    super(
      "Unauthorized action",
      "UNAUTHORIZED_ACTION",
      403
    );
  }
}