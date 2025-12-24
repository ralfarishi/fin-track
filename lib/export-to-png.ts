import { domToPng } from "modern-screenshot";

export async function exportToPng(element: HTMLElement, filename: string = "export.png") {
	if (!element) return;

	// Store original styles for the main element
	const originalOverflow = element.style.overflow;
	const originalWidth = element.style.width;
	const originalMaxWidth = element.style.maxWidth;
	const originalBorderRadius = element.style.borderRadius;

	// Find all nested elements with overflow (table containers, etc.)
	const overflowElements = element.querySelectorAll<HTMLElement>(
		'[data-slot="table-container"], [class*="overflow"]'
	);
	const originalOverflowStyles: {
		element: HTMLElement;
		overflow: string;
		width: string;
		maxWidth: string;
	}[] = [];

	// Store and fix overflow on nested elements
	overflowElements.forEach((el) => {
		originalOverflowStyles.push({
			element: el,
			overflow: el.style.overflow,
			width: el.style.width,
			maxWidth: el.style.maxWidth,
		});
		el.style.overflow = "visible";
		el.style.width = "auto";
		el.style.maxWidth = "none";
	});

	// Fix main element overflow and remove border-radius to prevent corner clipping
	element.style.overflow = "visible";
	element.style.width = "auto";
	element.style.maxWidth = "none";
	element.style.borderRadius = "0";

	// Add temporary padding to ensure edge content is fully captured
	// Get computed padding and add extra buffer
	const computedStyle = window.getComputedStyle(element);
	const currentPaddingRight = parseFloat(computedStyle.paddingRight) || 0;
	const originalPaddingRight = element.style.paddingRight;
	element.style.paddingRight = `${currentPaddingRight + 16}px`;

	// Force reflow to get accurate dimensions
	const fullWidth = element.scrollWidth;
	const fullHeight = element.scrollHeight;

	const dataUrl = await domToPng(element, {
		scale: 2,
		backgroundColor: "#ffffff",
		width: fullWidth,
		height: fullHeight,
	});

	// Restore padding
	element.style.paddingRight = originalPaddingRight;

	// Restore original styles for nested elements
	originalOverflowStyles.forEach(({ element: el, overflow, width, maxWidth }) => {
		el.style.overflow = overflow;
		el.style.width = width;
		el.style.maxWidth = maxWidth;
	});

	// Restore main element styles
	element.style.overflow = originalOverflow;
	element.style.width = originalWidth;
	element.style.maxWidth = originalMaxWidth;
	element.style.borderRadius = originalBorderRadius;

	const link = document.createElement("a");
	link.download = filename;
	link.href = dataUrl;
	link.click();
}
