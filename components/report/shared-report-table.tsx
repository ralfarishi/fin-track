"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { FunnelIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase";
import type { Transaction } from "@/lib/schema";

interface SharedReportTableProps {
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

// Format timestamp for display
function formatTimestamp(date: Date): string {
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});
}

export function SharedReportTable({
	transactions: initialTransactions,
	propertyName,
	propertyId,
}: SharedReportTableProps) {
	const [transactions, setTransactions] = useState(initialTransactions);
	const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
	const [isLive, setIsLive] = useState(true);
	const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

	// Subscribe to real-time updates
	useEffect(() => {
		if (!isLive) return;

		const supabase = createClient();
		const channel = supabase
			.channel(`shared-report-${propertyId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "transactions",
					filter: `property_id=eq.${propertyId}`,
				},
				(payload) => {
					const now = new Date();
					setLastUpdated(now);

					if (payload.eventType === "INSERT") {
						setTransactions((prev) => [...prev, payload.new as Transaction]);
					} else if (payload.eventType === "UPDATE") {
						setTransactions((prev) =>
							prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t))
						);
					} else if (payload.eventType === "DELETE") {
						setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [propertyId, isLive]);

	const filteredTransactions = useMemo(() => {
		return transactions
			.filter((t) => t.date.startsWith(filterMonth))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}, [transactions, filterMonth]);

	const reportData = useMemo(() => {
		return filteredTransactions.reduce((acc, t) => {
			const amount = typeof t.amount === "string" ? parseFloat(t.amount) : Number(t.amount);
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

	const handleRefresh = useCallback(() => {
		window.location.reload();
	}, []);

	return (
		<div className="space-y-3">
			<div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
				<div className="flex items-center gap-2">
					<FunnelIcon size={20} className="text-primary" />
					<input
						type="month"
						value={filterMonth}
						onChange={(e) => setFilterMonth(e.target.value)}
						className="bg-transparent border-none focus:ring-0 font-semibold cursor-pointer w-full"
					/>
				</div>
				<div className="flex items-center gap-4">
					<span className="text-xs text-muted-foreground">
						Updated: {formatTimestamp(lastUpdated)}
					</span>
					<button
						onClick={handleRefresh}
						className="p-2 rounded-xl hover:bg-muted transition-colors"
						title="Refresh data"
					>
						<ArrowsClockwiseIcon size={20} className="text-muted-foreground" />
					</button>
					<div className="flex items-center gap-2 text-sm">
						<span
							className={`w-2 h-2 rounded-full ${
								isLive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
							}`}
						/>
						<span className="text-muted-foreground font-medium">{isLive ? "Live" : "Paused"}</span>
					</div>
				</div>
			</div>

			<div className="bg-card rounded-xl border shadow-sm p-6 overflow-hidden">
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
							<TableHead className="text-center font-bold text-emerald-600 dark:text-emerald-400">
								Debit (In)
							</TableHead>
							<TableHead className="text-center font-bold text-rose-600 dark:text-rose-400">
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
								<TableCell className="text-center text-emerald-600 dark:text-emerald-400">
									{row.income > 0 ? row.income.toLocaleString() : "-"}
								</TableCell>
								<TableCell className="text-center text-rose-600 dark:text-rose-400">
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
