"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { clearAuthTokens, getAuthIdentity, type AuthIdentity } from "@/features/auth/lib/auth-storage";
import { siteConfig } from "@/lib/site-config";

function subscribeToStorage(callback: () => void) {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
}

export function SiteHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const identity = useSyncExternalStore<AuthIdentity | null>(subscribeToStorage, getAuthIdentity, () => null);

    function handleAuthAction() {
        if (identity) {
            clearAuthTokens();
            // Notify this tab as well as the next route render.
            window.dispatchEvent(new Event("storage"));
            router.push("/trang-chu");
            router.refresh();
            return;
        }
        router.push("/dang-nhap");
    }

    return (
        <header className="relative z-40 border-b border-slate-200 bg-white/95 shadow-[0_4px_24px_-12px_rgba(15,55,85,0.25)] backdrop-blur-xl">
            <a href="#main-content" className="skip-link">Đến nội dung chính</a>
            <div className="mx-auto flex h-[var(--navbar-height)] max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <Link href="/trang-chu" className="flex min-h-11 min-w-0 shrink-0 items-center gap-3 rounded-xl" aria-label="Trang chủ VietFlood Insight">
                    <span className="flex size-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-linear-to-br from-sky-700 to-teal-700 text-white shadow-[0_6px_16px_-5px_rgba(3,105,161,0.5)]"><Icon name="waves" size="lg" /></span>
                    <span className="hidden min-[420px]:block">
                        <span className="block text-base font-bold tracking-tight text-slate-900">{siteConfig.name}</span>
                        <span className="hidden text-xs font-medium text-slate-500 sm:block">Theo dõi thời tiết · Kết nối cộng đồng</span>
                    </span>
                </Link>
                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                    {identity ? (
                        <nav className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-1" aria-label="Điều hướng chính">
                            <Link href="/trang-chu" className="site-nav-link" aria-current={pathname === "/trang-chu" ? "page" : undefined}><Icon name="home" /><span className="hidden min-[480px]:inline">Trang chủ</span><span className="sr-only min-[480px]:hidden">Trang chủ</span></Link>
                            <Link href="/tong-quan" className="site-nav-link" aria-current={pathname === "/tong-quan" ? "page" : undefined}><Icon name="users" /><span className="hidden min-[480px]:inline">Tổng quan</span><span className="sr-only min-[480px]:hidden">Tổng quan</span></Link>
                        </nav>
                    ) : null}
                    <button type="button" className={`ui-button ${identity ? "ui-button-secondary" : "ui-button-primary"}`} onClick={handleAuthAction}>
                        <Icon name={identity ? "logout" : "login"} />
                        <span>{identity ? "Đăng xuất" : "Đăng nhập"}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
