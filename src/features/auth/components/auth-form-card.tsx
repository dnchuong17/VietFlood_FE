import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

type AuthFormCardProps = { title: string; description: string; note?: string; children: ReactNode };

export function AuthFormCard({ title, description, note, children }: AuthFormCardProps) {
    return (
        <main id="main-content" className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
            <div aria-hidden="true" className="pointer-events-none absolute -top-52 right-[-12rem] -z-10 size-[36rem] rounded-full bg-sky-100/80 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 left-[-14rem] -z-10 size-[36rem] rounded-full bg-teal-100/70 blur-3xl" />
            <Link href="/trang-chu" className="mb-8 inline-flex min-h-11 items-center gap-3 rounded-xl font-bold text-slate-800">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-sky-700 to-teal-700 text-white shadow-lg shadow-sky-900/15"><Icon name="waves" size="lg" /></span>
                VietFlood Insight
            </Link>
            <section className="ui-surface ui-enter relative w-full max-w-[480px] overflow-hidden p-6 sm:p-9" style={{ boxShadow: "var(--ui-shadow-floating)" }} aria-label={title}>
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-600 to-teal-600" />
                <header className="mb-7">
                    <span className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700"><Icon name="shield" size="lg" /></span>
                    <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
                </header>
                {children}
                {note ? <p className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-relaxed text-slate-500"><Icon name="lock" size="sm" className="mt-0.5" /><span>{note}</span></p> : null}
            </section>
            <Link href="/trang-chu" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:text-sky-700"><Icon name="arrow" size="sm" className="rotate-180" />Quay về trang chủ</Link>
        </main>
    );
}
