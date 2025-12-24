"use client";

import { TransactionForm } from "@/components/transaction-form";
import { ReportTable } from "@/components/report-table";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	HouseIcon,
	ChartLineUpIcon,
	PlusIcon,
	BuildingsIcon,
	PlusCircleIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserNav } from "@/components/user-nav";
import { PropertyManager } from "@/components/property-manager";
import { getTransactions } from "@/lib/actions/transactions";
import { ReportTableSkeleton } from "@/components/report-table-skeleton";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import type { Property, Transaction } from "@/lib/schema";

function PropertySelector({
	properties,
	selectedProperty,
	onSelect,
}: {
	properties: Property[];
	selectedProperty: Property | null;
	onSelect: (property: Property) => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						className="w-full max-w-xs justify-between rounded-xl h-10 px-4"
					/>
				}
			>
				<span className="flex items-center gap-2 truncate">
					<BuildingsIcon size={16} className="text-primary shrink-0" />
					{selectedProperty?.name || "Select property..."}
				</span>
				<CaretUpDownIcon size={16} className="text-muted-foreground shrink-0" />
			</PopoverTrigger>
			<PopoverContent className="max-w-xl p-1" align="start">
				<Command>
					<CommandInput placeholder="Search properties..." />
					<CommandList>
						<CommandEmpty>No properties found.</CommandEmpty>
						<CommandGroup>
							{properties.map((property) => (
								<CommandItem
									key={property.id}
									value={property.name}
									onSelect={() => {
										onSelect(property);
										setOpen(false);
									}}
									data-checked={selectedProperty?.id === property.id}
								>
									<BuildingsIcon size={16} className="text-muted-foreground" />
									{property.name}
									{selectedProperty?.id === property.id}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

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
				setTransactions(result.data);
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

	// Refresh transactions after new one is created
	async function refreshTransactions() {
		if (!selectedProperty) return;
		const result = await getTransactions(selectedProperty.id);
		if (result.data) {
			setTransactions(result.data);
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
					<UserNav email={user?.email} />
				</header>

				<Tabs defaultValue="report" className="w-full">
					<TabsList className="grid w-full grid-cols-3 rounded-2xl h-14 p-1 bg-muted/50 border backdrop-blur-sm">
						<TabsTrigger
							value="report"
							className="rounded-xl flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
						>
							<HouseIcon size={20} weight="bold" />
							<span className="font-semibold hidden sm:inline">Report</span>
						</TabsTrigger>
						<TabsTrigger
							value="add"
							className="rounded-xl flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
						>
							<PlusIcon size={20} weight="bold" />
							<span className="font-semibold hidden sm:inline">Transaction</span>
						</TabsTrigger>
						<TabsTrigger
							value="properties"
							className="rounded-xl flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
						>
							<BuildingsIcon size={20} weight="bold" />
							<span className="font-semibold hidden sm:inline">Properties</span>
						</TabsTrigger>
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
									<PropertySelector
										properties={properties}
										selectedProperty={selectedProperty}
										onSelect={setSelectedProperty}
									/>
									{loadingTransactions ? (
										<ReportTableSkeleton />
									) : (
										<ReportTable
											transactions={transactions.map((t) => ({
												...t,
												amount: parseFloat(t.amount),
											}))}
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
								<h2 className="text-xl font-bold px-1 tracking-tight">New Transaction</h2>
								{properties.length === 0 ? (
									<div className="text-center py-12 space-y-4 bg-card rounded-xl border">
										<PlusCircleIcon size={48} className="mx-auto text-muted-foreground/50" />
										<p className="text-muted-foreground">
											Add a property first to create transactions.
										</p>
									</div>
								) : (
									<TransactionForm properties={properties} onSuccess={refreshTransactions} />
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
							<PropertyManager properties={properties} onPropertyAdded={handlePropertyAdded} />
						</motion.div>
					</TabsContent>
				</Tabs>
			</div>
		</main>
	);
}
