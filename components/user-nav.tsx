"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SignOutIcon, UserIcon } from "@phosphor-icons/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserNav({ email }: { email: string | undefined }) {
	const supabase = createClient();
	const router = useRouter();

	async function handleLogout() {
		await supabase.auth.signOut();
		router.refresh();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="relative h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/50">
				<UserIcon size={20} className="text-primary" weight="bold" />
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 rounded-xl" align="end">
				<div className="flex flex-col space-y-1 p-2">
					<p className="text-sm font-medium leading-none">Account</p>
					<p className="text-xs leading-none text-muted-foreground">{email}</p>
				</div>
				<DropdownMenuItem
					className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
					onClick={handleLogout}
				>
					<SignOutIcon className="mr-2 h-4 w-4" />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
