"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEventHandler, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

type TriggerProps = {
    ref: RefObject<HTMLButtonElement | null>;
    onClick: () => void;
    onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
    "aria-expanded": boolean;
    "aria-controls": string;
    "aria-haspopup": "dialog";
};

type PopoverProps = {
    trigger: (props: TriggerProps) => ReactNode;
    children: (close: () => void) => ReactNode;
    label: string;
    className?: string;
};

const focusable = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]';

/** Non-modal, portalled dialog. Tab exits into the trigger's document order. */
export function Popover({ trigger, children, label, className = "" }: PopoverProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const id = useId();

    const [focusRequest, requestFocus] = useState(0);
    const close = useCallback(() => {
        setOpen(false);
        requestFocus((request) => request + 1);
    }, []);

    // Render-prop consumers receive a state-only callback; DOM focus stays
    // in an effect after the panel has unmounted, not in the render path.
    useEffect(() => {
        if (focusRequest > 0) triggerRef.current?.focus();
    }, [focusRequest]);

    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        const button = triggerRef.current;
        if (!panel || !button) return;
        let frame = 0;
        function position() {
            if (!panel || !button) return;
            const viewport = window.visualViewport;
            const leftEdge = viewport?.offsetLeft ?? 0;
            const topEdge = viewport?.offsetTop ?? 0;
            const width = viewport?.width ?? window.innerWidth;
            const height = viewport?.height ?? window.innerHeight;
            const rect = button.getBoundingClientRect();
            panel.style.maxWidth = `${Math.max(0, width - 24)}px`;
            panel.style.maxHeight = `${Math.max(0, height - 24)}px`;
            // Layout dimensions are stable while the entry animation scales the panel.
            const box = { width: panel.offsetWidth, height: panel.offsetHeight };
            const left = Math.max(leftEdge + 12, Math.min(rect.right - box.width, leftEdge + width - box.width - 12));
            const below = rect.bottom + 8;
            const top = below + box.height <= topEdge + height - 12 ? below : Math.max(topEdge + 12, rect.top - box.height - 8);
            panel.style.left = `${left}px`;
            panel.style.top = `${Math.min(top, topEdge + height - box.height - 12)}px`;
            panel.style.visibility = "visible";
        }
        function schedule() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(position);
        }
        function outside(event: PointerEvent | FocusEvent) {
            if (event.target instanceof Node && !panel!.contains(event.target) && !button!.contains(event.target)) setOpen(false);
        }
        function keydown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                button!.focus();
            }
            if (event.key !== "Tab") return;
            const items = Array.from(panel!.querySelectorAll<HTMLElement>(focusable)).filter((item) => item.getClientRects().length > 0);
            if (event.shiftKey && document.activeElement === items[0]) {
                event.preventDefault();
                setOpen(false);
                button!.focus();
            } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
                event.preventDefault();
                const documentItems = Array.from(document.querySelectorAll<HTMLElement>(focusable)).filter((item) => !panel!.contains(item) && item.getClientRects().length > 0 && !item.closest("[inert]"));
                const next = documentItems[documentItems.indexOf(button!) + 1];
                setOpen(false);
                (next ?? button!).focus();
            }
        }
        position();
        (panel.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), textarea:not(:disabled)") ?? panel.querySelector<HTMLElement>(focusable) ?? panel).focus();
        document.addEventListener("pointerdown", outside);
        document.addEventListener("focusin", outside);
        panel.addEventListener("keydown", keydown);
        window.addEventListener("scroll", schedule, true);
        window.addEventListener("resize", schedule);
        window.visualViewport?.addEventListener("resize", schedule);
        window.visualViewport?.addEventListener("scroll", schedule);
        const observer = new ResizeObserver(schedule);
        observer.observe(panel);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("focusin", outside);
            panel.removeEventListener("keydown", keydown);
            window.removeEventListener("scroll", schedule, true);
            window.removeEventListener("resize", schedule);
            window.visualViewport?.removeEventListener("resize", schedule);
            window.visualViewport?.removeEventListener("scroll", schedule);
        };
    }, [open]);

    return <>
        {trigger({
            ref: triggerRef,
            onClick: () => setOpen((value) => !value),
            onKeyDown: (event) => {
                if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); }
                if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); }
            },
            "aria-expanded": open,
            "aria-controls": id,
            "aria-haspopup": "dialog",
        })}
        {open && createPortal(<div ref={panelRef} id={id} role="dialog" aria-label={label} tabIndex={-1}
            className={`ui-popover fixed z-[100] w-72 overflow-auto rounded-[18px] border border-slate-200 bg-white p-4 text-sm font-normal normal-case tracking-normal text-slate-800 shadow-2xl ${className}`}
            style={{ visibility: "hidden" }}>
            {children(close)}
        </div>, document.body)}
    </>;
}
