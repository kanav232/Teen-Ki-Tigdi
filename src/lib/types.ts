
export type ValidationMetrics = {
  postCount: number;
  verifiedPostCount: number;
  relevantMediaCount: number; // Only increments if AI confidence > 0.7
};

export type Incident = {
  id: string;
  type: 'Fire' | 'Accident' | 'Congestion' | 'Public Unrest';
  severity: 'critical' | 'severe' | 'moderate' | 'minor';
  location: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  confidence: number;
  posts: string[];
  relatedPostUris?: string[]; // To track unique bluesky post URIs for deduplication
  status: 'new' | 'acknowledged' | 'in-progress' | 'resolved' | 'false-positive';
  summary: string;
  validationMetrics: ValidationMetrics;
  url?: string; // Link to the source post
};


export type User = {
  name: string;
  email: string;
  role: 'admin' | 'authority' | 'viewer';
  avatar: string;
};
