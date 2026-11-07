import type { ReactNode } from "react";

import { SiteHeader } from "@/components/navigation/site-header";

type PublicLayoutProps = { children: ReactNode };

export default function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="relative min-h-0 flex-1 outline-none">{children}</main>
        </div>
    );
}
