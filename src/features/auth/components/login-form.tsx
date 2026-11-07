"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { signIn } from "@/features/auth/api/sign-in";
import { persistAuthTokens } from "@/features/auth/lib/auth-storage";

export function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSubmitting) return;
        if (!username.trim() || !password.trim()) {
            setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
            return;
        }
        try {
            setIsSubmitting(true);
            setErrorMessage(null);
            const tokens = await signIn({ username: username.trim(), password });
            persistAuthTokens(tokens);
            router.replace("/trang-chu");
            router.refresh();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form className="grid gap-5" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="grid gap-2">
                <label htmlFor="username" className="text-sm font-semibold text-slate-700">Tên đăng nhập</label>
                <div className="relative">
                    <Icon name="user" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input id="username" name="username" type="text" placeholder="Nhập tên đăng nhập" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} className="ui-input pl-11" aria-describedby={errorMessage ? "login-error" : undefined} required />
                </div>
            </div>
            <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Mật khẩu</label>
                <div className="relative">
                    <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Nhập mật khẩu" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="ui-input pl-11 pr-14" aria-describedby={errorMessage ? "login-error" : undefined} required />
                    <button type="button" className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700" onClick={() => setShowPassword((previous) => !previous)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword}>
                        <Icon name={showPassword ? "eyeOff" : "eye"} />
                    </button>
                </div>
            </div>
            {errorMessage ? (
                <p id="login-error" role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800"><Icon name="alert" className="mt-0.5" /><span>{errorMessage}</span></p>
            ) : null}
            <button type="submit" className="ui-button ui-button-primary mt-1 min-h-12 w-full" disabled={isSubmitting}>
                <Icon name={isSubmitting ? "spinner" : "login"} className={isSubmitting ? "ui-spinner" : ""} />
                <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
                {!isSubmitting ? <Icon name="arrow" size="sm" className="ml-auto" /> : null}
            </button>
        </form>
    );
}
