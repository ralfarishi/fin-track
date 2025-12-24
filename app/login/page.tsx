"use client";

import { useState, useTransition } from "react";
import { login } from "./actions";
import { motion } from "framer-motion";
import {
	FingerprintIcon,
	ArrowRightIcon,
	CircleNotchIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LoginPage() {
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);

	function handleSubmit(formData: FormData) {
		startTransition(async () => {
			const result = await login(formData);
			if (result?.error) {
				toast.error(result.error);
			}
		});
	}

	return (
		<div className="flex min-h-screen bg-background text-foreground overflow-hidden">
			{/* Branding side */}
			<div className="hidden lg:flex w-1/2 bg-primary items-center justify-center relative">
				<motion.div
					initial={{ opacity: 0, x: -50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					className="flex flex-col select-none"
				>
					<span className="text-[14vw] leading-none font-black text-primary-foreground tracking-tighter opacity-20">
						FIN
					</span>
					<span className="text-[14vw] leading-none font-black text-primary-foreground tracking-tighter -mt-4">
						TRACK
					</span>
				</motion.div>
				<div className="absolute bottom-12 left-12 flex items-center gap-3">
					<div className="w-12 h-1 px-1 bg-primary-foreground/30 rounded-full overflow-hidden">
						<motion.div
							initial={{ x: "-100%" }}
							animate={{ x: "0%" }}
							transition={{ duration: 1.5, ease: "easeInOut" }}
							className="w-full h-full bg-primary-foreground"
						/>
					</div>
					<p className="text-primary-foreground/60 font-medium text-sm">Secure Portal v1.0</p>
				</div>
			</div>

			{/* Login Form side */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-card relative">
				<div className="max-w-md w-full space-y-12">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="space-y-4"
					>
						<div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-8">
							<FingerprintIcon size={32} className="text-primary" weight="duotone" />
						</div>
						<h1 className="text-4xl font-bold tracking-tight">Access Dashboard</h1>
					</motion.div>

					<motion.form
						action={handleSubmit}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="space-y-6"
					>
						<div className="space-y-5">
							<div className="space-y-2">
								<label className="text-sm font-semibold ml-1">Email</label>
								<Input
									name="email"
									type="email"
									placeholder="user@mail.com"
									required
									className="h-14 px-6 mt-1 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-primary transition-all text-lg"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-semibold ml-1">Password</label>
								<div className="relative group">
									<Input
										name="password"
										type={showPassword ? "text" : "password"}
										placeholder="••••••••"
										required
										className="h-14 px-6 mt-1 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-primary transition-all text-lg pr-14"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 focus:outline-none"
										aria-label={showPassword ? "Hide password" : "Show password"}
									>
										{showPassword ? (
											<EyeSlashIcon size={24} weight="duotone" />
										) : (
											<EyeIcon size={24} weight="duotone" />
										)}
									</button>
								</div>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isPending}
							className="w-full h-16 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all group overflow-hidden relative text-zinc-100"
						>
							<span
								className={cn(
									"flex items-center gap-2 transition-transform duration-300",
									isPending ? "opacity-0" : "opacity-100"
								)}
							>
								Login
								<ArrowRightIcon
									size={20}
									weight="bold"
									className="group-hover:translate-x-1 transition-transform"
								/>
							</span>
							{isPending && (
								<div className="absolute inset-0 flex items-center justify-center">
									<CircleNotchIcon size={28} className="animate-spin" />
								</div>
							)}
						</Button>
					</motion.form>
				</div>
			</div>
		</div>
	);
}
