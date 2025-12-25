"use client";

import { useState, useTransition } from "react";
import { createProperty, deleteProperty } from "@/lib/actions/properties";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BuildingsIcon, PlusIcon, CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Property } from "@/lib/schema";
import { motion, AnimatePresence } from "framer-motion";

interface PropertyManagerProps {
	properties: Property[];
	onPropertyAdded: (property: Property) => void;
	onPropertyDeleted: (id: string) => void;
}

export function PropertyManager({
	properties,
	onPropertyAdded,
	onPropertyDeleted,
}: PropertyManagerProps) {
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState("");
	const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

	function handleSubmit(formData: FormData) {
		startTransition(async () => {
			const result = await createProperty(formData);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Property added successfully");
				onPropertyAdded({
					id: crypto.randomUUID(), // Temporarily, will be refreshed
					name: formData.get("name") as string,
					userId: "",
					shareToken: null,
					shareTokenExpiresAt: null,
					createdAt: new Date(),
				});
				setName("");
			}
		});
	}

	function handleDelete(id: string) {
		startTransition(async () => {
			const result = await deleteProperty(id);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Property deleted successfully");
				onPropertyDeleted(id);
				setConfirmingDelete(null);
			}
		});
	}

	return (
		<div className="space-y-6">
			<h2 className="text-xl font-bold px-1 tracking-tight">Manage Properties</h2>

			{/* Add Property Form */}
			<form action={handleSubmit} className="flex gap-3">
				<Input
					name="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Property name..."
					className="h-12 rounded-xl flex-1"
					required
				/>
				<Button type="submit" disabled={isPending} className="h-12 px-6 rounded-xl">
					{isPending ? (
						<CircleNotchIcon size={20} className="animate-spin" />
					) : (
						<>
							<PlusIcon size={20} weight="bold" className="mr-2" />
							Add
						</>
					)}
				</Button>
			</form>

			{/* Property List */}
			<div className="space-y-2">
				{properties.length === 0 ? (
					<div className="text-center py-12 space-y-4 bg-card rounded-xl border">
						<BuildingsIcon size={48} className="mx-auto text-muted-foreground/50" />
						<p className="text-muted-foreground">No properties yet. Add your first one above!</p>
					</div>
				) : (
					<div className="grid gap-2">
						<AnimatePresence mode="popLayout">
							{properties.map((property) => (
								<motion.div
									key={property.id}
									layout
									initial={{ opacity: 0, scale: 0.95, y: 10 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95, y: -10 }}
									transition={{ duration: 0.2 }}
									className="group flex items-center justify-between p-4 bg-card rounded-xl border hover:border-primary/20 transition-colors"
								>
									<div className="flex items-center gap-3 flex-1 min-w-0">
										<div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
											<BuildingsIcon size={20} className="text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold truncate">{property.name}</p>
											<p className="text-[10px] text-muted-foreground">
												Added {new Date(property.createdAt).toLocaleDateString()}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-1 shrink-0 ml-2">
										<AnimatePresence mode="wait">
											{confirmingDelete === property.id ? (
												<motion.div
													key="confirm"
													initial={{ opacity: 0, x: 20 }}
													animate={{ opacity: 1, x: 0 }}
													exit={{ opacity: 0, x: 10 }}
													className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5"
												>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => setConfirmingDelete(null)}
														className="h-8 px-3 rounded-lg text-xs"
													>
														Cancel
													</Button>
													<Button
														size="sm"
														variant="destructive"
														onClick={() => handleDelete(property.id)}
														disabled={isPending}
														className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider"
													>
														Delete
													</Button>
												</motion.div>
											) : (
												<motion.div
													key="trash"
													initial={{ opacity: 0, scale: 0.8 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.8 }}
												>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setConfirmingDelete(property.id)}
														className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
													>
														<TrashIcon size={18} />
													</Button>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}
			</div>
		</div>
	);
}
