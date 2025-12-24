"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AmountInputProps {
	value: number;
	onChange: (value: number) => void;
	className?: string;
}

// Format number with thousand separators
function formatNumber(num: number): string {
	if (num === 0) return "";
	return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// Parse string to number, removing commas
function parseNumber(str: string): number {
	const cleaned = str.replace(/,/g, "");
	const parsed = parseFloat(cleaned);
	return isNaN(parsed) ? 0 : parsed;
}

export function AmountInput({ value, onChange, className }: AmountInputProps) {
	const [displayValue, setDisplayValue] = useState(() => formatNumber(value));
	const [isFocused, setIsFocused] = useState(false);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const inputValue = e.target.value;

		// Allow only numbers, commas, and decimal point
		const cleaned = inputValue.replace(/[^0-9.,]/g, "");

		// Update display immediately
		setDisplayValue(cleaned);

		// Parse and update form value
		const numericValue = parseNumber(cleaned);
		onChange(numericValue);
	}

	function handleFocus() {
		setIsFocused(true);
		// Show raw number for easier editing
		if (value > 0) {
			setDisplayValue(value.toString());
		}
	}

	function handleBlur() {
		setIsFocused(false);
		// Format on blur
		const numericValue = parseNumber(displayValue);
		if (numericValue > 0) {
			setDisplayValue(formatNumber(numericValue));
		} else {
			setDisplayValue("");
		}
	}

	// Show formatted value when not focused, or the display value when editing
	const shownValue = isFocused ? displayValue : formatNumber(value);

	return (
		<Input
			type="text"
			inputMode="decimal"
			placeholder="0"
			value={shownValue}
			onChange={handleChange}
			onFocus={handleFocus}
			onBlur={handleBlur}
			className={cn(className)}
		/>
	);
}
