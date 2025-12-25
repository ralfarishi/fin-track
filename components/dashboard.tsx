"use client";

import { TransactionForm } from "@/components/transaction/transaction-form";
import { ReportTable } from "@/components/report/report-table";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
	HouseIcon,
	ChartLineUpIcon,
	PlusIcon,
	BuildingsIcon,
	PlusCircleIcon,
	ArrowLeftIcon,
	StackIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserNav } from "@/components/user-nav";
import { PropertyManager } from "@/components/property/property-manager";
import { getTransactions } from "@/lib/actions/transactions";
import { ReportTableSkeleton } from "@/components/report/report-table-skeleton";
import PropertyCombobox from "@/components/property/PropertyCombobox";
import { BulkTransactionForm } from "@/components/transaction/bulk-transaction-form";
import type { Property, Transaction } from "@/lib/schema";

interface DashboardProps {
	user: {
		email?: string;
	} | null;
	initialProperties: Property[];
}

export function Dashboard({ user, initialProperties }: DashboardProps) {
	const [properties, setProperties] = useState<Property[]>(initialProperties);
	const [selectedProperty, setSelectedProperty] = useState<Property | null>(
		initialProperties.length > 0 ? initialProperties[0] : null
	);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loadingTransactions, setLoadingTransactions] = useState(false);
	const [activeTab, setActiveTab] = useState("report");
	const [isBulkMode, setIsBulkMode] = useState(false);

	// Fetch transactions when selected property changes
	useEffect(() => {
		async function fetchTransactions() {
			if (!selectedProperty) {
				setTransactions([]);
				return;
			}

			setLoadingTransactions(true);
			const result = await getTransactions(selectedProperty.id);
			if (result.data) {
				setTransactions(result.data as Transaction[]);
			}
			setLoadingTransactions(false);
		}

		fetchTransactions();
	}, [selectedProperty]);

	// Update properties when new one is added
	function handlePropertyAdded(newProperty: Property) {
		setProperties((prev) => [...prev, newProperty]);
		if (!selectedProperty) {
			setSelectedProperty(newProperty);
		}
	}

	// Handle property deletion
	function handlePropertyDeleted(id: string) {
		setProperties((prev) => {
			const updated = prev.filter((p) => p.id !== id);
			if (selectedProperty?.id === id) {
				setSelectedProperty(updated.length > 0 ? updated[0] : null);
			}
			return updated;
		});
	}

	// Refresh transactions after new one is created
	async function refreshTransactions() {
		if (!selectedProperty) return;
		const result = await getTransactions(selectedProperty.id);
		if (result.data) {
			setTransactions(result.data as Transaction[]);
		}
	}

	return (
		<main className="min-h-screen bg-background pb-20">
			<div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
				{/* Header */}
				<header className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="bg-primary/10 p-3 rounded-2xl">
							<ChartLineUpIcon size={32} className="text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-foreground tracking-tight">FinTrack</h1>
							<p className="text-muted-foreground text-sm font-medium">Financial Monitoring</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<UserNav email={user?.email} />
					</div>
				</header>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-3 rounded-xl h-14 p-1 bg-muted/50 border backdrop-blur-sm relative">
						<TabsTrigger
							value="report"
							className="rounded-xl flex items-center gap-2 relative z-10 data-[state=active]:bg-background data-[state=active]:shadow-none transition-all"
						>
							<HouseIcon size={20} weight="bold" />
							<span className="font-semibold hidden sm:inline">Report</span>
						</TabsTrigger>
						<TabsTrigger
							value="add"
							className="rounded-xl flex items-center gap-2 relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
						>
							<PlusIcon size={20} weight="bold" />
							<span className="font-semibold hidden sm:inline">Transaction</span>
						</TabsTrigger>
						<TabsTrigger
							value="properties"
							className="rounded-xl flex items-center gap-2 relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
						>
							<BuildingsIcon size={20} weight="bold" />
							<span className="font-semibold hidden sm:inline">Properties</span>
						</TabsTrigger>

						{/* Smooth sliding indicator */}
						<motion.div
							className="absolute bg-background h-[calc(100%-8px)] rounded-xl shadow-sm z-0"
							initial={false}
							animate={{
								width: "calc(33.333% - 4px)",
								x:
									activeTab === "report"
										? "4px"
										: activeTab === "add"
										? "calc(100% + 4px)"
										: "calc(200% + 4px)",
							}}
							transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
						/>
					</TabsList>

					<TabsContent value="report" className="mt-6 space-y-6">
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							{properties.length === 0 ? (
								<div className="text-center py-12 space-y-4">
									<BuildingsIcon size={48} className="mx-auto text-muted-foreground/50" />
									<p className="text-muted-foreground">
										No properties yet. Add one to get started!
									</p>
								</div>
							) : (
								<>
									<PropertyCombobox
										properties={properties}
										selectedPropertyId={selectedProperty?.id || null}
										onSelect={setSelectedProperty}
										className="max-w-xs mb-6"
									/>
									{loadingTransactions ? (
										<ReportTableSkeleton />
									) : (
										<ReportTable
											transactions={transactions}
											propertyName={selectedProperty?.name || ""}
											propertyId={selectedProperty?.id || ""}
										/>
									)}
								</>
							)}
						</motion.div>
					</TabsContent>

					<TabsContent value="add" className="mt-6">
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<div className="space-y-4">
								<div className="flex items-center justify-between px-1">
									<h2 className="text-xl font-bold tracking-tight">
										{isBulkMode ? "Bulk Transactions" : "New Transaction"}
									</h2>
									<Button
										variant="ghost"
										onClick={() => setIsBulkMode(!isBulkMode)}
										className="rounded-xl gap-2 text-primary hover:bg-primary/5"
									>
										{isBulkMode ? (
											<>
												<ArrowLeftIcon size={18} weight="bold" />
												Back to Single
											</>
										) : (
											<>
												<StackIcon size={18} weight="bold" />
												Bulk Mode
											</>
										)}
									</Button>
								</div>

								{properties.length === 0 ? (
									<div className="text-center py-12 space-y-4 bg-card rounded-xl border">
										<PlusCircleIcon size={48} className="mx-auto text-muted-foreground/50" />
										<p className="text-muted-foreground">
											Add a property first to create transactions.
										</p>
									</div>
								) : isBulkMode ? (
									<BulkTransactionForm
										propertyId={selectedProperty?.id || ""}
										propertyName={selectedProperty?.name || ""}
										onSuccess={refreshTransactions}
									/>
								) : (
									<TransactionForm
										properties={properties}
										selectedPropertyId={selectedProperty?.id || ""}
										onPropertyChange={setSelectedProperty}
										onSuccess={refreshTransactions}
									/>
								)}
							</div>
						</motion.div>
					</TabsContent>

					<TabsContent value="properties" className="mt-6">
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<PropertyManager
								properties={properties}
								onPropertyAdded={handlePropertyAdded}
								onPropertyDeleted={handlePropertyDeleted}
							/>
						</motion.div>
					</TabsContent>
				</Tabs>
			</div>
		</main>
	);
}
