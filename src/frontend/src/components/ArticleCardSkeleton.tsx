import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleCardSkeleton() {
  return (
    <div className="border-t border-white/20 pt-6 pb-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-3/4 bg-white/10" />
        <Skeleton className="h-4 w-1/3 bg-white/10" />
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-4/5 bg-white/10" />
      </div>
    </div>
  );
}
