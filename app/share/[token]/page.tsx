import { getSharedReport } from "@/lib/actions/share";
import { SharedReportTable } from "@/components/report/shared-report-table";
import { ChartLineUpIcon, LinkBreakIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

interface PageProps {
	params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { token } = await params;
	const { data } = await getSharedReport(token);

	if (!data) {
		return {
			title: "Report Not Found - FinTrack",
		};
	}

	return {
		title: `${data.property.name} - Shared Report | FinTrack`,
		description: `View the financial report for ${data.property.name}`,
	};
}

export default async function SharedReportPage({ params }: PageProps) {
	const { token } = await params;
	const { data, error } = await getSharedReport(token);

	if (error || !data) {
		return (
			<main className="min-h-screen bg-background flex items-center justify-center px-4">
				<div className="text-center space-y-4 max-w-md">
					<div className="bg-destructive/10 p-4 rounded-2xl w-fit mx-auto">
						<LinkBreakIcon size={48} className="text-destructive" />
					</div>
					<h1 className="text-2xl font-bold text-foreground">Report Not Found</h1>
					<p className="text-muted-foreground">
						{error || "This share link may have been revoked or doesn't exist."}
					</p>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-background pb-20">
			<div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
				{/* Header */}
				<header className="flex items-center gap-4">
					<div className="bg-primary/10 p-3 rounded-2xl">
						<ChartLineUpIcon size={32} className="text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-foreground tracking-tight">FinTrack</h1>
						<p className="text-muted-foreground text-sm font-medium">Shared Report</p>
					</div>
				</header>

				<SharedReportTable
					transactions={data.transactions}
					propertyName={data.property.name}
					propertyId={data.property.id}
				/>

				<footer className="text-center text-sm text-muted-foreground">
					<p>This is a read-only shared report. Data updates in real-time.</p>
				</footer>
			</div>
		</main>
	);
}
