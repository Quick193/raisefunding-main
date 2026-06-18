interface SkeletonProps {
  className?: string;
}

/** Base gray placeholder box with a subtle pulse — the building block for all skeletons. */
export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

/** Placeholder that mirrors a single campaign grid card. */
export const CampaignCardSkeleton = () => (
  <div className="bg-white/60 border border-gray-200/60 rounded-2xl overflow-hidden h-full flex flex-col">
    {/* image */}
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-5 flex-1 flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

/** A responsive grid of card placeholders — matches the Campaigns / Dashboard grids. */
export const CampaignGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <CampaignCardSkeleton key={i} />
    ))}
  </div>
);

/** Generic full-page placeholder used while route-level data / auth resolves. */
export const PageSkeleton = () => (
  <div className="min-h-screen bg-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-4 w-96 mb-10" />
      <CampaignGridSkeleton count={8} />
    </div>
  </div>
);
