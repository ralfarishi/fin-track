import { Transaction } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

// Format month from yyyy-mm to "Month YYYY"
function formatMonthYear(dateString: string): string {
	const [year, month] = dateString.split("-");
	const date = new Date(parseInt(year), parseInt(month) - 1);
	return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface ReportTableContentProps {
	data: (Transaction & { income: number; expense: number; balance: number })[];
	propertyName: string;
	filterMonth: string;
	isExporting?: boolean;
}

export default function ReportTableContent({
	data,
	propertyName,
	filterMonth,
	isExporting,
}: ReportTableContentProps) {
	return (
		<>
			<div className="mb-6 text-center">
				<h2 className={cn("text-2xl font-bold text-primary", isExporting && "text-primary")}>
					{propertyName}
				</h2>
				<p className={cn("text-muted-foreground font-medium", isExporting && "text-slate-500")}>
					Financial Report - {formatMonthYear(filterMonth)}
				</p>
			</div>

			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent border-b-2">
						<TableHead className={cn("w-[120px] font-bold", isExporting && "text-neutral-800")}>
							Date
						</TableHead>
						<TableHead className={cn("font-bold", isExporting && "text-neutral-800")}>
							Description
						</TableHead>
						<TableHead
							className={cn(
								"text-center font-bold text-emerald-600 dark:text-emerald-400",
								isExporting && "text-emerald-600"
							)}
						>
							Debit (In)
						</TableHead>
						<TableHead
							className={cn(
								"text-center font-bold text-rose-600 dark:text-rose-400",
								isExporting && "text-rose-600"
							)}
						>
							Credit (Out)
						</TableHead>
						<TableHead className={cn("text-right font-bold", isExporting && "text-neutral-800")}>
							Balance
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((row) => (
						<TableRow key={row.id} className="hover:bg-muted/30">
							<TableCell className={cn("font-medium", isExporting && "text-neutral-800")}>
								{new Date(row.date).toLocaleDateString("en-US", {
									day: "2-digit",
									month: "short",
								})}
							</TableCell>
							<TableCell className={cn(isExporting && "text-neutral-800")}>
								{row.description}
							</TableCell>
							<TableCell
								className={cn(
									"text-center text-emerald-600 dark:text-emerald-400",
									isExporting && "text-emerald-600"
								)}
							>
								{row.income > 0 ? row.income.toLocaleString() : "-"}
							</TableCell>
							<TableCell
								className={cn(
									"text-center text-rose-600 dark:text-rose-400",
									isExporting && "text-rose-600"
								)}
							>
								{row.expense > 0 ? row.expense.toLocaleString() : "-"}
							</TableCell>
							<TableCell
								className={cn("text-right font-semibold", isExporting && "text-neutral-800")}
							>
								{row.balance.toLocaleString()}
							</TableCell>
						</TableRow>
					))}
					{data.length === 0 && (
						<TableRow>
							<TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
								No transactions found for this month.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<div className="mt-6 flex justify-center sm:justify-end">
				<div className="bg-primary/10 px-6 py-3 rounded-xl border border-primary/20 whitespace-nowrap">
					<span
						className={cn(
							"text-sm font-medium text-muted-foreground mr-4",
							isExporting && "text-slate-500"
						)}
					>
						Total Balance:
					</span>
					<span className={cn("text-xl font-bold text-primary", isExporting && "text-primary")}>
						Rp. {data.length > 0 ? data[data.length - 1].balance.toLocaleString() : "0"}
					</span>
				</div>
			</div>
		</>
	);
}
