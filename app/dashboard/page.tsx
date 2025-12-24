import { Dashboard } from "@/components/dashboard";
import { getUser } from "@/lib/auth-server";
import { getProperties } from "@/lib/actions/properties";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
	const user = await getUser();

	if (!user) {
		redirect("/login");
	}

	const { data: properties } = await getProperties();

	return <Dashboard user={user} initialProperties={properties || []} />;
}
