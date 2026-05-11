import { ReactNode } from "react";

import { PlanBadge } from "@/components/PlanBadge";
import { useAuthStore } from "@/store/auth";

type PageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function Page({ title, description, children }: PageProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              InvoiceFlow
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              {description}
            </p>
          </div>
          {user ? <PlanBadge plan={user.plan} className="self-start" /> : null}
        </div>
        {children}
      </section>
    </main>
  );
}
