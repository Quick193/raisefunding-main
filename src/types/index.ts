export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  name?: string;
}

export interface Campaign {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  image_url: string | null;
  video_url?: string | null;
  media?: MediaItem[];
  status: 'active' | 'completed';
  end_date: string | null;
  created_at: string;
  updated_at: string;
  category?: string;
  location?: string;
  supporter_count?: number;
  is_featured?: boolean;
  featured_until?: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface Donation {
  id: string;
  campaign_id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  message: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  created_at: string;
}

export interface CampaignStats {
  totalRaised: number;
  totalDonors: number;
  averageDonation: number;
  donationRate: number;
  progress: number;
  donations: Donation[];
  chartData: {
    labels: string[];
    data: number[];
  };
}