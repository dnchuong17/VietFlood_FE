"use client";

import { useId } from "react";
import { Popover } from "@/components/ui/popover";

type UserColumnControlProps = {
    label: string;
    value: string;
    onFilterChange: (value: string) => void;
    onSort: (direction: "asc" | "desc") => void;
    direction?: "asc" | "desc";
    placeholder?: string;
};

export function UserColumnControl({ label, value, onFilterChange, onSort, direction, placeholder }: UserColumnControlProps) {
    const inputId = useId();
    return <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <Popover label={`Tùy chỉnh ${label}`} trigger={(props) => <button {...props} type="button" data-column-trigger
            className={`ui-icon-button h-11 w-11 shrink-0 rounded-xl border transition duration-[180ms] ${value || direction ? "border-blue-200 bg-blue-50 text-blue-700" : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white"}`}
            aria-label={`Tùy chỉnh ${label}${value ? ", đang lọc" : ""}`} title={`Tùy chỉnh ${label}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M4 17h16" /><path d="M9 4v6M15 14v6" />
            </svg>
        </button>}>
            {(close) => <div data-column-menu className="space-y-4">
                <p className="font-semibold">Tùy chỉnh {label}</p>
                <div className="grid grid-cols-2 gap-2">
                    {(["asc", "desc"] as const).map((order) => <button key={order} type="button" aria-pressed={direction === order}
                        className={`ui-button min-h-11 rounded-xl text-xs ${direction === order ? "ui-button-primary" : "ui-button-secondary"}`}
                        onClick={() => onSort(order)}>{order === "asc" ? "↑ Tăng dần" : "↓ Giảm dần"}</button>)}
                </div>
                <div className="space-y-2">
                    <label htmlFor={inputId} className="block text-xs font-semibold">Lọc {label}</label>
                    <input id={inputId} type="text" value={value} onChange={(event) => onFilterChange(event.target.value)} className="ui-input w-full rounded-xl" placeholder={placeholder ?? `Lọc ${label.toLowerCase()}...`} />
                </div>
                <div className="flex justify-between gap-2 border-t border-slate-200 pt-3">
                    <button type="button" className="ui-button ui-button-secondary text-xs" disabled={!value} onClick={() => onFilterChange("")}>Xóa bộ lọc</button>
                    <button type="button" className="ui-button ui-button-secondary text-xs" onClick={close}>Đóng</button>
                </div>
            </div>}
        </Popover>
    </div>;
}
