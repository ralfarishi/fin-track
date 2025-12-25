"use client";

import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
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
	if (cleaned === "" || cleaned === ".") return 0;
	const parsed = parseFloat(cleaned);
	return isNaN(parsed) ? 0 : parsed;
}

export function AmountInput({ value, onChange, className }: AmountInputProps) {
	const [displayValue, setDisplayValue] = useState(() => formatNumber(value));

	// Sync display value when the value prop changes (e.g. form reset)
	useEffect(() => {
		if (value === 0) {
			setDisplayValue("");
		} else {
			const numericDisplay = parseNumber(displayValue);
			if (numericDisplay !== value) {
				setDisplayValue(formatNumber(value));
			}
		}
		// We only want to sync when 'value' changes from outside (like reset)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const inputValue = e.target.value;

		// Allow only numbers, commas, and decimal point
		const cleaned = inputValue.replace(/[^0-9.]/g, "");

		if (cleaned === "") {
			setDisplayValue("");
			onChange(0);
			return;
		}

		// Handle multiple decimal points
		const parts = cleaned.split(".");
		const sanitized = parts[0] + (parts.length > 1 ? "." + parts[1] : "");

		// Update display with commas while typing
		const numericValue = parseNumber(sanitized);
		if (sanitized.endsWith(".")) {
			setDisplayValue(formatNumber(numericValue) + ".");
		} else if (parts.length > 1 && parts[1].length > 0) {
			// Don't format decimal part while typing
			setDisplayValue(formatNumber(parseInt(parts[0])) + "." + parts[1]);
		} else {
			setDisplayValue(formatNumber(numericValue));
		}

		onChange(numericValue);
	}

	function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
		// Just select the text for easier editing instead of changing the format
		e.target.select();
	}

	function handleBlur() {
		if (displayValue !== "") {
			const numericValue = parseNumber(displayValue);
			setDisplayValue(formatNumber(numericValue));
		}
	}

	return (
		<Input
			type="text"
			inputMode="decimal"
			placeholder="0"
			value={displayValue}
			onChange={handleChange}
			onFocus={handleFocus}
			onBlur={handleBlur}
			className={cn(className)}
		/>
	);
}
