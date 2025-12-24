"use client";

import { useState, useTransition } from "react";
import { createProperty } from "@/lib/actions/properties";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BuildingsIcon, PlusIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Property } from "@/lib/schema";

interface PropertyManagerProps {
	properties: Property[];
	onPropertyAdded: (property: Property) => void;
}

export function PropertyManager({ properties, onPropertyAdded }: PropertyManagerProps) {
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState("");

	function handleSubmit(formData: FormData) {
		startTransition(async () => {
			const result = await createProperty(formData);
			if (result.error) {
				toast.error(result.error);
			} else {
				toast.success("Property added successfully");
				// Create a temporary property object for optimistic UI
				const tempProperty: Property = {
					id: crypto.randomUUID(),
					name: formData.get("name") as string,
					userId: "",
					shareToken: null,
					shareTokenExpiresAt: null,
					createdAt: new Date(),
				};
				onPropertyAdded(tempProperty);
				setName("");
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
					properties.map((property) => (
						<div
							key={property.id}
							className="flex items-center justify-between p-4 bg-card rounded-xl border"
						>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
									<BuildingsIcon size={20} className="text-primary" />
								</div>
								<div>
									<p className="font-semibold">{property.name}</p>
									<p className="text-xs text-muted-foreground">
										Added {new Date(property.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
