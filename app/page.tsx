import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-server";
import { ArrowRight, ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default async function LandingPage() {
	const user = await getUser();

	if (user) {
		redirect("/dashboard");
	}

	return (
		<main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
			<div className="max-w-2xl text-center space-y-8">
				<div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
					<ChartLineUp size={40} className="text-primary" weight="duotone" />
				</div>
				<h1 className="text-5xl font-black tracking-tight text-foreground">FinTrack</h1>
				<p className="text-xl text-muted-foreground leading-relaxed">
					Property financial management made simple. Track income, expenses, and generate beautiful
					reports.
				</p>
				<Link
					href="/login"
					className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 active:scale-100"
				>
					Get Started
					<ArrowRight size={20} weight="bold" />
				</Link>
			</div>
		</main>
	);
}

