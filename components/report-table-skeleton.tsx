"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ReportTableSkeleton() {
	return (
		<div className="bg-card rounded-xl border shadow-sm p-6 mt-2 space-y-6">
			{/* Header skeleton */}
			<div className="text-center space-y-2">
				<Skeleton className="h-8 w-48 mx-auto" />
				<Skeleton className="h-4 w-36 mx-auto" />
			</div>

			{/* Table skeleton */}
			<div className="space-y-3">
				{/* Header row */}
				<div className="flex gap-4 pb-3 border-b-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 flex-1" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
				</div>

				{/* Data rows */}
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="flex gap-4 py-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 flex-1" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-24" />
					</div>
				))}
			</div>

			{/* Footer skeleton */}
			<div className="flex justify-end">
				<Skeleton className="h-12 w-56 rounded-xl" />
			</div>
		</div>
	);
}
