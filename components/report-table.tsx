"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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

interface Transaction {
	id: string;
	date: string;
	description: string;
	amount: number | string;
	type: "income" | "expense";
}

interface ReportTableProps {
	transactions: Transaction[];
	propertyName: string;
	propertyId: string;
}

// Format month from yyyy-mm to "Month YYYY"
function formatMonthYear(dateString: string): string {
	const [year, month] = dateString.split("-");
	const date = new Date(parseInt(year), parseInt(month) - 1);
	return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ReportTable({ transactions, propertyName, propertyId }: ReportTableProps) {
	const tableRef = useRef<HTMLDivElement>(null);
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
		if (tableRef.current) {
			setIsDownloading(true);
			await new Promise((resolve) => setTimeout(resolve, 150));

			try {
				// Format filename as propertyName_month-YYYY
				const [year, month] = filterMonth.split("-");
				const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
					"en-US",
					{ month: "long" }
				);
				await exportToPng(tableRef.current, `${propertyName}_${monthName}-${year}.png`);
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

			{/* Report Table */}
			<div
				ref={tableRef}
				className={`bg-card rounded-xl border shadow-sm p-6 ${
					isDownloading ? "overflow-visible" : "overflow-hidden"
				}`}
			>
				<div className="mb-6 text-center">
					<h2 className="text-2xl font-bold text-primary">{propertyName}</h2>
					<p className="text-muted-foreground font-medium">
						Financial Report - {formatMonthYear(filterMonth)}
					</p>
				</div>

				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent border-b-2">
							<TableHead className="w-[120px] font-bold">Date</TableHead>
							<TableHead className="font-bold">Description</TableHead>
							<TableHead className="text-right font-bold text-green-600 dark:text-green-400">
								Debit (In)
							</TableHead>
							<TableHead className="text-right font-bold text-red-600 dark:text-red-400">
								Credit (Out)
							</TableHead>
							<TableHead className="text-right font-bold">Balance</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{reportData.map((row) => (
							<TableRow key={row.id} className="hover:bg-muted/30">
								<TableCell className="font-medium">
									{new Date(row.date).toLocaleDateString("en-US", {
										day: "2-digit",
										month: "short",
									})}
								</TableCell>
								<TableCell>{row.description}</TableCell>
								<TableCell className="text-right text-green-600 dark:text-green-400">
									{row.income > 0 ? row.income.toLocaleString() : "-"}
								</TableCell>
								<TableCell className="text-right text-red-600 dark:text-red-400">
									{row.expense > 0 ? row.expense.toLocaleString() : "-"}
								</TableCell>
								<TableCell className="text-right font-semibold">
									{row.balance.toLocaleString()}
								</TableCell>
							</TableRow>
						))}
						{reportData.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
									No transactions found for this month.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>

				<div className="mt-6 flex justify-end">
					<div className="bg-primary/10 px-6 py-3 rounded-xl border border-primary/20 whitespace-nowrap">
						<span className="text-sm font-medium text-muted-foreground mr-4">Total Balance:</span>
						<span className="text-xl font-bold text-primary">
							Rp.{" "}
							{reportData.length > 0
								? reportData[reportData.length - 1].balance.toLocaleString()
								: "0"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
