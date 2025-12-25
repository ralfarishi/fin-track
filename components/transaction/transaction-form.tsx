"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ArrowCircleDownIcon, ArrowCircleUpIcon, CircleNotchIcon } from "@phosphor-icons/react";
import PropertyCombobox from "@/components/property/PropertyCombobox";
import { cn } from "@/lib/utils";
import { useTransition } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import { toast } from "sonner";
import type { Property } from "@/lib/schema";
import { AmountInput } from "@/components/amount-input";

const transactionSchema = z.object({
	propertyId: z.string().uuid("Please select a property"),
	date: z.string().min(1, "Date is required"),
	description: z.string().min(3, "Min 3 characters").max(100, "Max 100 characters"),
	amount: z.coerce.number().positive("Amount must be positive"),
	type: z.enum(["income", "expense"]),
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
	properties: Property[];
	selectedPropertyId: string;
	onPropertyChange: (property: Property) => void;
	onSuccess?: () => void | Promise<void>;
}

export function TransactionForm({
	properties,
	selectedPropertyId: externalPropertyId,
	onPropertyChange,
	onSuccess,
}: TransactionFormProps) {
	const [isPending, startTransition] = useTransition();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<TransactionValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(transactionSchema) as any,
		defaultValues: {
			propertyId: externalPropertyId || (properties.length > 0 ? properties[0].id : ""),
			date: "",
			description: "",
			amount: 0,
			type: "expense",
		},
	});

	// Sync local form state with external property selection
	useEffect(() => {
		if (externalPropertyId) {
			setValue("propertyId", externalPropertyId);
		}
	}, [externalPropertyId, setValue]);

	const selectedType = watch("type");
	const selectedPropertyId = watch("propertyId");

	function onSubmit(values: TransactionValues) {
		const formData = new FormData();
		formData.set("propertyId", values.propertyId);
		formData.set("date", values.date);
		formData.set("description", values.description);
		formData.set("amount", values.amount.toString());
		formData.set("type", values.type);

		startTransition(async () => {
			const result = await createTransaction(formData);
			if (result.error) {
				toast.error(result.error);
			} else {
				reset({
					propertyId: values.propertyId,
					date: new Date().toISOString().split("T")[0],
					description: "",
					amount: 0,
					type: "expense",
				});
				toast.success("Transaction saved successfully");
				onSuccess?.();
			}
		});
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-6 bg-card p-6 rounded-xl border shadow-sm"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Field>
					<FieldLabel>Property</FieldLabel>
					<FieldContent>
						<PropertyCombobox
							properties={properties}
							selectedPropertyId={selectedPropertyId ?? ""}
							onSelect={(p) => {
								setValue("propertyId", p.id);
								onPropertyChange(p);
							}}
							className="h-12! w-full px-4 text-base"
						/>
					</FieldContent>
					{errors.propertyId && <FieldError errors={[{ message: errors.propertyId.message }]} />}
				</Field>

				<Field>
					<FieldLabel>Date</FieldLabel>
					<FieldContent>
						<Input type="date" {...register("date")} className="rounded-xl h-12" />
					</FieldContent>
					{errors.date && <FieldError errors={[{ message: errors.date.message }]} />}
				</Field>
			</div>

			<Field>
				<FieldLabel>Description</FieldLabel>
				<FieldContent>
					<Input
						placeholder="e.g., Monthly Rent"
						{...register("description")}
						className="rounded-xl h-12"
					/>
				</FieldContent>
				{errors.description && <FieldError errors={[{ message: errors.description.message }]} />}
			</Field>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Field>
					<FieldLabel>Amount</FieldLabel>
					<FieldContent>
						<AmountInput
							value={watch("amount")}
							onChange={(val) => setValue("amount", val)}
							className="rounded-xl h-12"
						/>
					</FieldContent>
					{errors.amount && <FieldError errors={[{ message: errors.amount.message }]} />}
				</Field>

				<Field>
					<FieldLabel>Type</FieldLabel>
					<FieldContent>
						<div className="flex bg-muted p-1 rounded-xl gap-1 h-12 items-center">
							<button
								type="button"
								onClick={() => setValue("type", "income")}
								className={cn(
									"flex-1 flex items-center justify-center gap-2 h-full rounded-lg transition-all",
									selectedType === "income"
										? "bg-background text-chart-2 shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<ArrowCircleUpIcon
									size={20}
									weight={selectedType === "income" ? "fill" : "regular"}
								/>
								<span className="font-medium">Income</span>
							</button>
							<button
								type="button"
								onClick={() => setValue("type", "expense")}
								className={cn(
									"flex-1 flex items-center justify-center gap-2 h-full rounded-lg transition-all",
									selectedType === "expense"
										? "bg-background text-destructive shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								<ArrowCircleDownIcon
									size={20}
									weight={selectedType === "expense" ? "fill" : "regular"}
								/>
								<span className="font-medium">Expense</span>
							</button>
						</div>
					</FieldContent>
				</Field>
			</div>

			<Button
				type="submit"
				disabled={isPending}
				className="w-full h-12 rounded-xl text-lg font-semibold shadow-md transition-all active:scale-[0.98]"
			>
				{isPending ? <CircleNotchIcon className="animate-spin" size={24} /> : "Save Transaction"}
			</Button>
		</form>
	);
}
