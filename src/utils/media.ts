const supabaseHost = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL || '').host;
  } catch {
    return '';
  }
})();

export const getTrustedCampaignMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  try {
    const parsed = new URL(url, window.location.origin);
    const isOwnOrigin = parsed.origin === window.location.origin;
    const isSupabaseCampaignMedia =
      parsed.host === supabaseHost &&
      parsed.pathname.startsWith('/storage/v1/object/public/campaign-media/campaigns/');

    return isOwnOrigin || isSupabaseCampaignMedia ? parsed.href : null;
  } catch {
    return null;
  }
};

export const isAllowedCampaignVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return true;

  try {
    const parsed = new URL(url, window.location.origin);
    const isYouTube = parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtu.be';
    const isVimeo = parsed.hostname === 'vimeo.com' || parsed.hostname === 'www.vimeo.com';

    return Boolean(getTrustedCampaignMediaUrl(url)) || isYouTube || isVimeo;
  } catch {
    return false;
  }
};
