import { unstable_noStore as noStore } from "next/cache";

import { ParentDashboard } from "@/components/ParentDashboard";
import { getRepository } from "@/lib/sheets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParentPage() {
  noStore();
  const repository = getRepository();
  const data = await repository.getParentDashboard();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <ParentDashboard initialData={data} />
      </div>
    </main>
  );
}
