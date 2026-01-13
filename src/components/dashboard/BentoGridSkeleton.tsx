import { Skeleton } from "@/components/ui/skeleton"

export function BentoGridSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6 lg:gap-8 lg:h-full">
            {/* ZONE 1: LEFT (CGPA Hero) */}
            <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
                <Skeleton className="h-[220px] w-full rounded-3xl" />
            </div>

            {/* ZONE 2: CENTER (Semesters) */}
            <div className="lg:col-span-1 flex flex-col gap-8 min-w-0 pb-20 lg:pb-0">
                {[1, 2].map((i) => (
                    <div key={i} className="mb-10">
                        {/* Header Skeleton */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-14 w-14 rounded-2xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((j) => (
                                <Skeleton key={j} className="h-[180px] rounded-3xl" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ZONE 3: RIGHT (Deadlines) */}
            <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
                <Skeleton className="h-full min-h-[400px] w-full rounded-3xl" />
                <Skeleton className="h-[200px] w-full rounded-3xl" />
            </div>
        </div>
    )
}
