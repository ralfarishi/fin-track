"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/command";

import { BuildingsIcon, CaretUpDownIcon } from "@phosphor-icons/react";
import type { Property } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface PropertyComboboxProps {
	properties: Property[];
	selectedPropertyId: string | null;
	onSelect: (property: Property) => void;
	className?: string;
}

export default function PropertyCombobox({
	properties,
	selectedPropertyId,
	onSelect,
	className,
}: PropertyComboboxProps) {
	const [open, setOpen] = useState(false);

	const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						className={cn("w-full justify-between rounded-xl h-10 px-4", className)}
					/>
				}
			>
				<span className="flex items-center gap-2 truncate">
					<BuildingsIcon size={16} className="text-primary shrink-0" />
					{selectedProperty?.name || "Select property..."}
				</span>
				<CaretUpDownIcon size={16} className="text-muted-foreground shrink-0" />
			</PopoverTrigger>
			<PopoverContent className="w-(--anchor-width) p-1" align="start">
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
									data-checked={selectedPropertyId === property.id}
								>
									<BuildingsIcon size={16} className="text-muted-foreground" />
									{property.name}
									{selectedPropertyId === property.id}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
