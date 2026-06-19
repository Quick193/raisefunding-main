// Supabase returns PostgreSQL `numeric` as a JS string at runtime.
// Accept both so every caller is safe regardless of what the DB driver returns.
export const formatCurrency = (amount: number | string | null | undefined): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

export const formatDate = (date: string): string => {
  const d = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const then = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00');
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
};

export const calculateProgress = (current: number | string, goal: number | string): number => {
  const c = Number(current) || 0;
  const g = Number(goal) || 0;
  if (g === 0) return 0;
  return Math.min(Math.round((c / g) * 100), 100);
};

// A campaign is "ended" if it was explicitly completed, or its end_date has
// passed. Campaigns run through 11:59 PM on their end_date, so we compare
// against the end of that day. Keep this as the single source of truth for
// derived status — the DB `status` column is only flipped lazily (on detail
// view), so listings must not rely on it alone.
export const isCampaignEnded = (
  campaign: { status?: string | null; end_date?: string | null }
): boolean => {
  if (campaign.status && ['completed', 'withdrawn', 'refunded'].includes(campaign.status)) return true;
  if (!campaign.end_date) return false;
  const endOfDay = new Date(campaign.end_date.split('T')[0] + 'T23:59:59').getTime();
  return endOfDay <= Date.now();
};