"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { type MapOverlay, useHomeDisplayState } from "../state/home-display-state";

const OVERLAYS: { value: MapOverlay; label: string; icon: IconName }[] = [
    { value: "rain", label: "Mưa", icon: "rain" },
    { value: "wind", label: "Gió", icon: "wind" },
    { value: "temp", label: "Nhiệt độ", icon: "temp" },
    { value: "rh", label: "Độ ẩm", icon: "rh" },
    { value: "clouds", label: "Mây", icon: "clouds" },
    { value: "pressure", label: "Áp suất", icon: "pressure" },
];

export function Tools() {
    const { state, dispatch } = useHomeDisplayState();
    const [isOpen, setIsOpen] = useState(false);
    const toolRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const overlay = OVERLAYS.find((option) => option.value === state.overlay) ?? OVERLAYS[0];
    const weatherLabel = state.isWeatherStatsVisible ? "Ẩn bảng số liệu thời tiết" : "Hiển thị bảng số liệu thời tiết";

    function closeMenu(restoreFocus = false) {
        setIsOpen(false);
        if (restoreFocus) triggerRef.current?.focus();
    }

    useEffect(() => {
        if (!isOpen) return;
        const frame = requestAnimationFrame(() => {
            menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
        });
        function outside(event: PointerEvent) {
            if (!toolRef.current?.contains(event.target as Node)) setIsOpen(false);
        }
        // Clicks inside the cross-origin map do not bubble to this document.
        function blur() {
            if (document.activeElement?.tagName === "IFRAME") setIsOpen(false);
        }
        document.addEventListener("pointerdown", outside);
        window.addEventListener("blur", blur);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener("pointerdown", outside);
            window.removeEventListener("blur", blur);
        };
    }, [isOpen]);

    function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeMenu(true);
            return;
        }
        if (event.key === "Tab") {
            // Restore the anchor before normal sequential focus continues.
            triggerRef.current?.focus();
            setIsOpen(false);
            return;
        }
        const options = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
        const index = options.indexOf(document.activeElement as HTMLButtonElement);
        let next: number;
        if (event.key === "ArrowDown") next = (index + 1) % options.length;
        else if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = options.length - 1;
        else return;
        event.preventDefault();
        options[next]?.focus();
    }

    return (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
            <div className="m-4 flex w-fit flex-col items-start gap-3 sm:m-6">
                <button type="button" onClick={() => dispatch({ type: "toggleWeatherStatsVisibility" })} className="ui-icon-button map-tool pointer-events-auto" aria-label={weatherLabel} aria-pressed={state.isWeatherStatsVisible} title={weatherLabel}>
                    <Icon name="sliders" size="lg" />
                </button>
                <div ref={toolRef} className="pointer-events-auto relative" onKeyDown={(event) => {
                    if (isOpen && event.key === "Tab") {
                        triggerRef.current?.focus();
                        setIsOpen(false);
                    }
                    if (isOpen && event.key === "Escape") {
                        event.preventDefault();
                        closeMenu(true);
                    }
                }} onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOpen(false);
                }}>
                    <button ref={triggerRef} type="button" onClick={() => setIsOpen((previous) => !previous)} onKeyDown={(event) => {
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                            event.preventDefault();
                            setIsOpen(true);
                        }
                    }} className="ui-icon-button map-tool" aria-label={`Chọn lớp bản đồ. Lớp hiện tại: ${overlay.label}`} aria-expanded={isOpen} aria-haspopup="menu" aria-controls={isOpen ? menuId : undefined} title={`Lớp bản đồ: ${overlay.label}`}>
                        <Icon name="layers" size="lg" />
                    </button>
                    {isOpen ? (
                        <div ref={menuRef} id={menuId} className="ui-popover absolute left-full top-0 ml-3 max-h-[calc(100dvh-180px)] w-56 max-w-[calc(100vw-100px)] overflow-y-auto" role="menu" aria-label="Chọn lớp bản đồ" onKeyDown={handleMenuKey}>
                            <p className="mb-2 border-b border-slate-100 px-3 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500" role="presentation">Lớp thời tiết</p>
                            {OVERLAYS.map((option) => (
                                <button key={option.value} type="button" role="menuitemradio" aria-checked={state.overlay === option.value} tabIndex={state.overlay === option.value ? 0 : -1} onClick={() => {
                                    dispatch({ type: "setOverlay", payload: option.value });
                                    closeMenu(true);
                                }} className="overlay-option">
                                    <Icon name={option.icon} />
                                    <span className="flex-1 text-left">{option.label}</span>
                                    {state.overlay === option.value ? <Icon name="check" size="sm" /> : null}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
                <span className="pointer-events-none rounded-lg border border-white/70 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm" aria-live="polite">{overlay.label}</span>
            </div>
        </div>
    );
}
