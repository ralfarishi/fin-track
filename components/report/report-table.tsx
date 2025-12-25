"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
	DownloadSimpleIcon,
	FunnelIcon,
	ShareNetworkIcon,
	CopyIcon,
	LinkBreakIcon,
	EyeIcon,
	CheckIcon,
} from "@phosphor-icons/react";
import { exportToPng } from "@/lib/export-to-png";
import { generateShareToken, revokeShareToken, getShareStatus } from "@/lib/actions/share";
import { toast } from "sonner";
import { Input } from "@base-ui/react";
import ReportTableContent from "./report-table-content";

import { Transaction } from "@/lib/schema";

interface ReportTableProps {
	transactions: Transaction[];
	propertyName: string;
	propertyId: string;
}

export function ReportTable({ transactions, propertyName, propertyId }: ReportTableProps) {
	const tableRef = useRef<HTMLDivElement>(null);
	const captureRef = useRef<HTMLDivElement>(null);
	const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
	const [isDownloading, setIsDownloading] = useState(false);

	// Share state
	const [isShared, setIsShared] = useState(false);
	const [shareToken, setShareToken] = useState<string | null>(null);
	const [visitCount, setVisitCount] = useState(0);
	const [isSharing, setIsSharing] = useState(false);
	const [copied, setCopied] = useState(false);

	// Fetch share status on mount and when propertyId changes
	useEffect(() => {
		async function fetchShareStatus() {
			if (!propertyId) return;
			const result = await getShareStatus(propertyId);
			if (result.data) {
				setIsShared(result.data.isShared);
				setShareToken(result.data.shareToken);
				setVisitCount(result.data.visitCount);
			}
		}
		fetchShareStatus();
	}, [propertyId]);

	const filteredTransactions = useMemo(() => {
		return transactions
			.filter((t) => t.date.startsWith(filterMonth))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}, [transactions, filterMonth]);

	const reportData = useMemo(() => {
		return filteredTransactions.reduce((acc, t) => {
			const amount = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
			const income = t.type === "income" ? amount : 0;
			const expense = t.type === "expense" ? amount : 0;
			const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
			const balance = prevBalance + income - expense;

			acc.push({
				...t,
				income,
				expense,
				balance,
			});
			return acc;
		}, [] as (Transaction & { income: number; expense: number; balance: number })[]);
	}, [filteredTransactions]);

	const downloadImage = async () => {
		if (captureRef.current) {
			setIsDownloading(true);
			// Small delay to ensure any potential layout shifts are settled
			await new Promise((resolve) => setTimeout(resolve, 150));

			try {
				const [year, month] = filterMonth.split("-");
				const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
					"en-US",
					{ month: "long" }
				);
				await exportToPng(captureRef.current, `${propertyName}_${monthName}-${year}.png`);
			} finally {
				setIsDownloading(false);
			}
		}
	};

	const handleShare = useCallback(async () => {
		setIsSharing(true);
		try {
			const result = await generateShareToken(propertyId);
			if (result.error) {
				toast.error(result.error);
			} else if (result.data) {
				setIsShared(true);
				setShareToken(result.data.shareToken);
				toast.success("Share link created!");
			}
		} finally {
			setIsSharing(false);
		}
	}, [propertyId]);

	const handleCopyLink = useCallback(async () => {
		if (!shareToken) return;
		const shareUrl = `${window.location.origin}/share/${shareToken}`;
		await navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		toast.success("Link copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
	}, [shareToken]);

	const handleRevoke = useCallback(async () => {
		setIsSharing(true);
		try {
			const result = await revokeShareToken(propertyId);
			if (result.error) {
				toast.error(result.error);
			} else {
				setIsShared(false);
				setShareToken(null);
				setVisitCount(0);
				toast.success("Share link revoked");
			}
		} finally {
			setIsSharing(false);
		}
	}, [propertyId]);

	return (
		<div className="space-y-4">
			{/* Hidden capture target - rendered off-screen but readable on all devices */}
			<div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
				<div
					ref={captureRef}
					className="bg-card rounded-none p-8 w-[800px]!"
					style={{ backgroundColor: "white" }}
				>
					<ReportTableContent
						data={reportData}
						propertyName={propertyName}
						filterMonth={filterMonth}
						isExporting={true}
					/>
				</div>
			</div>

			{/* Controls Bar */}
			<div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm my-2">
				<div className="flex items-center gap-2">
					<FunnelIcon size={20} className="text-primary" />
					<Input
						type="month"
						value={filterMonth}
						onChange={(e) => setFilterMonth(e.target.value)}
						className="bg-transparent border-none focus:ring-0 font-semibold cursor-pointer w-full"
					/>
				</div>
				<div className="flex items-center gap-2 flex-wrap justify-center">
					<Button
						onClick={downloadImage}
						variant="outline"
						className="rounded-xl gap-2 shadow-sm"
						disabled={isDownloading}
					>
						<DownloadSimpleIcon size={20} />
						<span className="hidden sm:inline">
							{isDownloading ? "Downloading..." : "Download"}
						</span>
					</Button>

					{!isShared ? (
						<Button
							onClick={handleShare}
							variant="outline"
							className="rounded-xl gap-2 shadow-sm"
							disabled={isSharing}
						>
							<ShareNetworkIcon size={20} />
							<span className="hidden sm:inline">{isSharing ? "Creating..." : "Share"}</span>
						</Button>
					) : (
						<>
							<Button
								onClick={handleCopyLink}
								variant="outline"
								className="rounded-xl gap-2 shadow-sm"
							>
								{copied ? (
									<CheckIcon size={20} className="text-green-500" />
								) : (
									<CopyIcon size={20} />
								)}
								<span className="hidden sm:inline">{copied ? "Copied!" : "Copy Link"}</span>
							</Button>
							<Button
								onClick={handleRevoke}
								variant="outline"
								className="rounded-xl gap-2 shadow-sm text-destructive hover:text-destructive"
								disabled={isSharing}
							>
								<LinkBreakIcon size={20} />
								<span className="hidden sm:inline">Revoke</span>
							</Button>
							{visitCount > 0 && (
								<div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-xl text-sm font-medium text-muted-foreground">
									<EyeIcon size={16} />
									<span>{visitCount}</span>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Visible Report Table */}
			<div ref={tableRef} className="bg-card rounded-xl border shadow-sm p-6 overflow-hidden">
				<ReportTableContent
					data={reportData}
					propertyName={propertyName}
					filterMonth={filterMonth}
					isExporting={false}
				/>
			</div>
		</div>
	);
}
