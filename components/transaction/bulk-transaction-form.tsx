"use client";

import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	PlusIcon,
	TrashIcon,
	CircleNotchIcon,
	ArrowCircleDownIcon,
	ArrowCircleUpIcon,
	BuildingsIcon,
} from "@phosphor-icons/react";
import { AmountInput } from "@/components/amount-input";
import { useTransition } from "react";
import { createTransaction } from "@/lib/actions/transactions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const transactionRowSchema = z.object({
	date: z.string().min(1, "Required"),
	description: z.string().min(3, "Min 3 chars").max(100, "Too long"),
	amount: z.number().positive("Must be > 0"),
	type: z.enum(["income", "expense"]),
});

const bulkTransactionSchema = z.object({
	transactions: z.array(transactionRowSchema).min(1, "At least one transaction required"),
});

type BulkTransactionValues = z.infer<typeof bulkTransactionSchema>;

interface BulkTransactionFormProps {
	propertyId: string;
	propertyName: string;
	onSuccess?: () => void | Promise<void>;
}

export function BulkTransactionForm({
	propertyId,
	propertyName,
	onSuccess,
}: BulkTransactionFormProps) {
	const [isPending, startTransition] = useTransition();

	const {
		control,
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<BulkTransactionValues>({
		resolver: zodResolver(bulkTransactionSchema),
		defaultValues: {
			transactions: [{ date: "", description: "", amount: 0, type: "expense" }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "transactions",
	});

	const onSubmit: SubmitHandler<BulkTransactionValues> = async (values) => {
		startTransition(async () => {
			let hasError = false;

			for (const txn of values.transactions) {
				const formData = new FormData();
				formData.set("propertyId", propertyId);
				formData.set("date", txn.date);
				formData.set("description", txn.description);
				formData.set("amount", txn.amount.toString());
				formData.set("type", txn.type);

				const result = await createTransaction(formData);
				if (result.error) {
					toast.error(`Error in row: ${result.error}`);
					hasError = true;
					break;
				}
			}

			if (!hasError) {
				toast.success(`Successfully saved ${values.transactions.length} transactions`);
				reset();
				onSuccess?.();
			}
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Property ID Banner */}
			<div className="bg-primary/5 border border-primary/10 p-3 rounded-xl flex items-center justify-between px-4">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
						<BuildingsIcon size={18} className="text-primary" />
					</div>
					<div>
						<p className="text-[10px] uppercase font-bold tracking-widest text-primary/60 mb-0.5">
							Active Property
						</p>
						<p className="font-bold text-sm leading-none">{propertyName}</p>
					</div>
				</div>
				<div className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">
					BULK INPUT
				</div>
			</div>

			<div className="space-y-3">
				<AnimatePresence mode="popLayout">
					{fields.map((field, index) => (
						<motion.div
							key={field.id}
							initial={{ opacity: 0, x: -20, height: 0 }}
							animate={{ opacity: 1, x: 0, height: "auto" }}
							exit={{ opacity: 0, x: 20, height: 0 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
							className="bg-card p-4 rounded-xl border relative group"
						>
							<div className="grid grid-cols-1 md:grid-cols-12 gap-4">
								<div className="md:col-span-2">
									<label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
										Date
									</label>
									<Input
										type="date"
										{...register(`transactions.${index}.date`)}
										className="h-10 rounded-lg text-sm"
									/>
									{errors.transactions?.[index]?.date && (
										<p className="text-[10px] text-destructive mt-1 ml-1 font-medium">
											{errors.transactions[index]?.date?.message}
										</p>
									)}
								</div>

								<div className="md:col-span-4">
									<label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
										Description
									</label>
									<Input
										placeholder="Description"
										{...register(`transactions.${index}.description`)}
										className="h-10 rounded-lg text-sm"
									/>
									{errors.transactions?.[index]?.description && (
										<p className="text-[10px] text-destructive mt-1 ml-1 font-medium">
											{errors.transactions[index]?.description?.message}
										</p>
									)}
								</div>

								<div className="md:col-span-3">
									<label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
										Amount
									</label>
									<AmountInput
										value={watch(`transactions.${index}.amount`)}
										onChange={(val) => setValue(`transactions.${index}.amount`, val)}
										className="h-10 rounded-lg text-sm"
									/>
									{errors.transactions?.[index]?.amount && (
										<p className="text-[10px] text-destructive mt-1 ml-1 font-medium">
											{errors.transactions[index]?.amount?.message}
										</p>
									)}
								</div>

								<div className="md:col-span-2">
									<label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
										Type
									</label>
									<div className="flex bg-muted p-1 rounded-lg gap-1 h-10 items-center">
										<button
											type="button"
											onClick={() => setValue(`transactions.${index}.type`, "income")}
											className={cn(
												"flex-1 flex items-center justify-center p-1 rounded-md transition-all",
												watch(`transactions.${index}.type`) === "income"
													? "bg-background text-chart-2 shadow-sm"
													: "text-muted-foreground hover:text-foreground"
											)}
										>
											<ArrowCircleUpIcon size={16} weight="bold" />
										</button>
										<button
											type="button"
											onClick={() => setValue(`transactions.${index}.type`, "expense")}
											className={cn(
												"flex-1 flex items-center justify-center p-1 rounded-md transition-all",
												watch(`transactions.${index}.type`) === "expense"
													? "bg-background text-destructive shadow-sm"
													: "text-muted-foreground hover:text-foreground"
											)}
										>
											<ArrowCircleDownIcon size={16} weight="bold" />
										</button>
									</div>
								</div>

								<div className="md:col-span-1 flex items-end justify-center pb-1">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => remove(index)}
										disabled={fields.length === 1}
										className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									>
										<TrashIcon size={16} />
									</Button>
								</div>
							</div>
						</motion.div>
					))}
				</AnimatePresence>

				<Button
					type="button"
					variant="outline"
					onClick={() => append({ date: "", description: "", amount: 0, type: "expense" })}
					className="w-full border-dashed border-2 py-6 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 transition-all flex items-center gap-2 group"
				>
					<PlusIcon size={18} className="group-hover:scale-110 transition-transform" />
					<span className="font-semibold">Add Another</span>
				</Button>
			</div>

			<Button
				type="submit"
				disabled={isPending}
				className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
			>
				{isPending ? (
					<CircleNotchIcon className="animate-spin" size={24} />
				) : (
					`Save ${fields.length} Transactions`
				)}
			</Button>
		</form>
	);
}
