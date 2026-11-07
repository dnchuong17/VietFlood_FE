"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserColumnControl } from "./user-column-control";

import { getAccessToken, getAuthIdentity } from "@/features/auth/lib/auth-storage";

const DEFAULT_AUTH_API_BASE_URL = "http://localhost:8081";

const AUTH_API_BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? DEFAULT_AUTH_API_BASE_URL;
const USERS_PER_PAGE = 20;

const PROVINCE_OPTIONS = [
    "An Giang",
    "Bắc Ninh",
    "Cao Bằng",
    "Cà Mau",
    "Cần Thơ",
    "Đà Nẵng",
    "Đắk Lắk",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Nội",
    "Hà Tĩnh",
    "Hải Phòng",
    "Hưng Yên",
    "Huế",
    "Khánh Hòa",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Nghệ An",
    "Ninh Bình",
    "Phú Thọ",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sơn La",
    "Tây Ninh",
    "Thanh Hóa",
    "Thái Nguyên",
    "Tuyên Quang",
    "Vĩnh Long",
    "TP.HCM",
];

type User = {
    id?: number;
    username?: string;
    email?: string;
    phone?: string;
    address_line?: string;
    role?: string;
    first_name?: string;
    middle_name?: string | null;
    last_name?: string;
    province?: string;
    district?: string;
    ward?: string;
    created_at?: string;
};

type SortKey = "id" | "fullName" | "username" | "email" | "role" | "created_at";

type FilterState = {
    id: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
};

function formatFullName(user: User): string {
    const parts = [user.first_name, user.middle_name ?? "", user.last_name]
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean);

    if (parts.length === 0) {
        return user.username?.trim() || "Chưa có thông tin";
    }

    return parts.join(" ");
}

function formatDate(value?: string): string {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function formatRole(role?: string): string {
    const normalized = role?.trim().toLowerCase();
    if (normalized === "admin") {
        return "Quản trị viên";
    }
    if (normalized === "operator") {
        return "Điều phối viên";
    }
    if (normalized === "citizen") {
        return "Người dân";
    }
    return role?.trim() || "-";
}

export function UsersOverview() {
    const [users, setUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<FilterState>({
        id: "",
        fullName: "",
        username: "",
        email: "",
        role: "",
        created_at: "",
    });
    const [sortConfig, setSortConfig] = useState<{
        key: SortKey;
        direction: "asc" | "desc";
    }>({
        key: "id",
        direction: "asc",
    });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        phone: "",
        province: "",
        ward: "",
        address_line: "",
        password: "",
    });

    useEffect(() => {
        async function loadUsers() {
            try {
                setIsLoading(true);
                setErrorMessage(null);

                const accessToken = getAccessToken();
                if (!accessToken) {
                    setErrorMessage("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
                    setUsers([]);
                    return;
                }

                const response = await fetch(`${AUTH_API_BASE_URL}/auth/all`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    cache: "no-store",
                });

                const data: unknown = await response.json().catch(() => null);

                if (!response.ok) {
                    const fallback = "Không thể tải danh sách người dùng.";
                    if (typeof data === "object" && data !== null && "message" in data) {
                        const message = (data as { message?: unknown }).message;
                        if (typeof message === "string" && message.trim().length > 0) {
                            throw new Error(message);
                        }
                    }

                    throw new Error(fallback);
                }

                const nextUsers = Array.isArray(data) ? (data as User[]) : [];
                setUsers(nextUsers);
                setCurrentPage(1);
            } catch (error) {
                setUsers([]);
                setCurrentPage(1);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Không thể tải danh sách người dùng.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadUsers();
    }, []);

    const totalUsers = users.length;
    const adminCount = useMemo(
        () => users.filter((user) => user.role?.toLowerCase() === "admin").length,
        [users],
    );
    const filteredAndSortedUsers = useMemo(() => {
        const nextUsers = users.filter((user) => {
            const fullName = formatFullName(user).toLowerCase();
            const username = (user.username ?? "").toLowerCase();
            const email = (user.email ?? "").toLowerCase();
            const role = formatRole(user.role).toLowerCase();
            const createdAt = formatDate(user.created_at).toLowerCase();
            const id = String(user.id ?? "").toLowerCase();

            return (
                id.includes(filters.id.trim().toLowerCase()) &&
                fullName.includes(filters.fullName.trim().toLowerCase()) &&
                username.includes(filters.username.trim().toLowerCase()) &&
                email.includes(filters.email.trim().toLowerCase()) &&
                role.includes(filters.role.trim().toLowerCase()) &&
                createdAt.includes(filters.created_at.trim().toLowerCase())
            );
        });

        const sortedUsers = [...nextUsers].sort((first, second) => {
            let firstValue: number | string = "";
            let secondValue: number | string = "";

            switch (sortConfig.key) {
                case "id":
                    firstValue = first.id ?? 0;
                    secondValue = second.id ?? 0;
                    break;
                case "fullName":
                    firstValue = formatFullName(first).toLowerCase();
                    secondValue = formatFullName(second).toLowerCase();
                    break;
                case "username":
                    firstValue = (first.username ?? "").toLowerCase();
                    secondValue = (second.username ?? "").toLowerCase();
                    break;
                case "email":
                    firstValue = (first.email ?? "").toLowerCase();
                    secondValue = (second.email ?? "").toLowerCase();
                    break;
                case "role":
                    firstValue = formatRole(first.role).toLowerCase();
                    secondValue = formatRole(second.role).toLowerCase();
                    break;
                case "created_at":
                    firstValue = first.created_at ? new Date(first.created_at).getTime() : 0;
                    secondValue = second.created_at ? new Date(second.created_at).getTime() : 0;
                    break;
                default:
                    break;
            }

            if (typeof firstValue === "number" && typeof secondValue === "number") {
                return sortConfig.direction === "asc"
                    ? firstValue - secondValue
                    : secondValue - firstValue;
            }

            const comparison = String(firstValue).localeCompare(String(secondValue), "vi");
            return sortConfig.direction === "asc" ? comparison : -comparison;
        });

        return sortedUsers;
    }, [filters, sortConfig, users]);
    const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / USERS_PER_PAGE));
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        return filteredAndSortedUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [filteredAndSortedUsers, currentPage]);
    const pageStartRecord = filteredAndSortedUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
    const pageEndRecord = Math.min(currentPage * USERS_PER_PAGE, filteredAndSortedUsers.length);
    const authIdentity = getAuthIdentity();
    const canEditSelectedUser =
        !!selectedUser &&
        !!authIdentity?.username &&
        selectedUser.username === authIdentity.username;

    const dialogRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const busyRef = useRef(false);
    const isModalOpen = selectedUser !== null;

    useEffect(() => { busyRef.current = isSaving || isDeleting; }, [isSaving, isDeleting]);

    useEffect(() => {
        if (!isModalOpen) return;
        const dialog = dialogRef.current;
        const overlay = overlayRef.current;
        if (!dialog || !overlay) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        const siblings = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay && !element.contains(overlay));
        const inertStates = siblings.map((element) => ({ element, inert: element.inert }));
        inertStates.forEach(({ element }) => { element.inert = true; });
        document.body.style.overflow = "hidden";
        dialog.focus();
        function handleKey(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                if (!busyRef.current) setSelectedUser(null);
            }
            if (event.key === "Tab") {
                const controls = Array.from(dialog!.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
                const first = controls[0];
                const last = controls.at(-1);
                if (!first) { event.preventDefault(); dialog!.focus(); return; }
                if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
            }
        }
        function keepFocus(event: FocusEvent) {
            if (event.target instanceof Node && !dialog!.contains(event.target)) dialog!.focus();
        }
        document.addEventListener("keydown", handleKey, true);
        document.addEventListener("focusin", keepFocus);
        return () => {
            document.removeEventListener("keydown", handleKey, true);
            document.removeEventListener("focusin", keepFocus);
            inertStates.forEach(({ element, inert }) => { element.inert = inert; });
            document.body.style.overflow = previousOverflow;
            if (previousFocus?.isConnected) previousFocus.focus();
            else document.getElementById("users-heading")?.focus();
        };
    }, [isModalOpen]);

    useEffect(() => {
        if (!isModalOpen) return;
        if (isEditing) document.getElementById("user-edit-phone")?.focus();
        else if (!dialogRef.current?.contains(document.activeElement)) dialogRef.current?.focus();
    }, [isEditing, isModalOpen]);

    function openUser(user: User) {
        setEditForm({ phone: user.phone ?? "", province: user.province ?? "", ward: user.ward ?? "", address_line: user.address_line ?? "", password: "" });
        setIsEditing(false);
        setSaveMessage(null);
        setSaveError(null);
        setSelectedUser(user);
    }

    useEffect(() => {
        // Keep the visible page valid after deletion changes the result count.
        setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
    }, [totalPages]);

    async function handleSaveUserDetail() {
        if (!selectedUser) {
            return;
        }

        try {
            setIsSaving(true);
            setSaveMessage(null);
            setSaveError(null);

            const accessToken = getAccessToken();
            if (!accessToken) {
                throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            }

            const payload: Record<string, string> = {
                phone: editForm.phone.trim(),
                province: editForm.province.trim(),
                ward: editForm.ward.trim(),
                address_line: editForm.address_line.trim(),
            };

            if (editForm.password.trim().length > 0) {
                payload.password = editForm.password.trim();
            }

            const response = await fetch(`${AUTH_API_BASE_URL}/auth/update`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            const data: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                if (typeof data === "object" && data !== null && "message" in data) {
                    const message = (data as { message?: unknown }).message;
                    if (typeof message === "string" && message.trim().length > 0) {
                        throw new Error(message);
                    }
                }

                throw new Error("Cập nhật người dùng thất bại.");
            }

            const updatedUser: User = {
                ...selectedUser,
                phone: payload.phone,
                province: payload.province,
                ward: payload.ward,
                address_line: payload.address_line,
            };

            setSelectedUser(updatedUser);
            setUsers((prevUsers) =>
                prevUsers.map((user) => {
                    if (user.id !== updatedUser.id) {
                        return user;
                    }

                    return {
                        ...user,
                        phone: updatedUser.phone,
                        province: updatedUser.province,
                        ward: updatedUser.ward,
                        address_line: updatedUser.address_line,
                    };
                }),
            );
            setEditForm((prev) => ({ ...prev, password: "" }));
            setIsEditing(false);
            setSaveMessage("Cập nhật thông tin người dùng thành công.");
        } catch (error) {
            setSaveError(
                error instanceof Error ? error.message : "Cập nhật người dùng thất bại.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteUser() {
        if (!selectedUser?.id) {
            setSaveError("Không tìm thấy ID người dùng để xóa.");
            return;
        }

        if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
            return;
        }

        try {
            setIsDeleting(true);
            setSaveMessage(null);
            setSaveError(null);

            const accessToken = getAccessToken();
            if (!accessToken) {
                throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
            }

            const response = await fetch(
                `${AUTH_API_BASE_URL}/auth/delete/${selectedUser.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            const data: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                if (typeof data === "object" && data !== null && "message" in data) {
                    const message = (data as { message?: unknown }).message;
                    if (typeof message === "string" && message.trim().length > 0) {
                        throw new Error(message);
                    }
                }

                throw new Error("Xóa người dùng thất bại.");
            }

            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id));
            setSelectedUser(null);
        } catch (error) {
            setSaveError(
                error instanceof Error ? error.message : "Xóa người dùng thất bại.",
            );
        } finally {
            setIsDeleting(false);
        }
    }

    function handleSort(column: SortKey, direction?: "asc" | "desc") {
        setSortConfig((prev) => {
            if (direction) {
                return {
                    key: column,
                    direction,
                };
            }

            if (prev.key === column) {
                return {
                    key: column,
                    direction: prev.direction === "asc" ? "desc" : "asc",
                };
            }

            return {
                key: column,
                direction: "asc",
            };
        });
    }

    function handleFilterChange(column: keyof FilterState, value: string) {
        setFilters((prev) => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    }

    return (
        <section aria-labelledby="users-heading" className="ui-enter h-full overflow-auto bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="ui-surface relative mb-6 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[24px] border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 shadow-[0_12px_36px_-20px_rgba(30,64,175,0.35)] sm:p-8">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Quản lý hệ thống</p>
                        <h1 id="users-heading" tabIndex={-1} className="[font-family:var(--font-heading)] text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Danh sách người dùng
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                            Tra cứu tài khoản, thông tin liên hệ và vai trò trong hệ thống.
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
                        <article className="min-w-0 rounded-[18px] sm:min-w-32 border border-white bg-white/80 px-5 py-4 shadow-lg shadow-blue-900/5">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Người dùng</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{isLoading || errorMessage ? "—" : totalUsers}</p>
                        </article>
                        <article className="min-w-0 rounded-[18px] sm:min-w-32 border border-white bg-white/80 px-5 py-4 shadow-lg shadow-blue-900/5">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Quản trị viên</p>
                            <p className="mt-1 text-2xl font-bold text-teal-700">{isLoading || errorMessage ? "—" : adminCount}</p>
                        </article>
                    </div>
                </header>

                {isLoading ? (
                    <div role="status" className="ui-surface flex min-h-48 items-center justify-center gap-3 rounded-[24px] border border-slate-200 bg-white p-8 text-slate-600">
                        <span className="ui-spinner h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-600" aria-hidden="true" />
                        Đang tải danh sách người dùng...
                    </div>
                ) : null}

                {errorMessage ? (
                    <div role="alert" className="rounded-[18px] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
                        <p className="mb-2 font-semibold">Không thể tải người dùng</p>
                        {errorMessage}
                    </div>
                ) : null}

                {!isLoading && !errorMessage ? (
                    <div className="ui-surface overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_48px_-28px_rgba(15,23,42,0.35)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                            <div><h2 className="font-bold text-slate-900">Tất cả tài khoản</h2><p className="mt-1 text-xs text-slate-500">Chọn tên để xem chi tiết · Tùy chỉnh từng cột để lọc và sắp xếp</p></div>
                            {Object.values(filters).some(Boolean) ? <button type="button" className="ui-button ui-button-secondary" onClick={() => { setFilters({ id: "", fullName: "", username: "", email: "", role: "", created_at: "" }); setCurrentPage(1); }}>Xóa tất cả bộ lọc</button> : <span className="ui-badge border border-blue-200 bg-blue-50 text-blue-700">{totalUsers} tài khoản</span>}
                        </div>
                        <div role="region" aria-label="Bảng danh sách người dùng" tabIndex={0} className="overflow-x-auto overflow-y-visible focus-visible:outline-2 focus-visible:outline-blue-600">
                            <table className="min-w-full divide-y divide-slate-200 text-left">
                                <caption className="sr-only">Danh sách người dùng. Lọc và sắp xếp bằng nút tùy chỉnh ở mỗi tiêu đề cột.</caption>
                                <thead className="bg-slate-50/90">
                                    <tr>
                                        {([
                                            ["id", "ID"], ["fullName", "Họ tên"], ["username", "Username"],
                                            ["email", "Email"], ["role", "Vai trò"], ["created_at", "Ngày tạo"],
                                        ] as const).map(([column, label]) => (
                                            <th key={column} scope="col" aria-sort={sortConfig.key === column ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-600">
                                                <UserColumnControl label={label} value={filters[column]} onFilterChange={(value) => handleFilterChange(column, value)} onSort={(direction) => handleSort(column, direction)} direction={sortConfig.key === column ? sortConfig.direction : undefined} placeholder={column === "created_at" ? "Lọc dd/mm/yyyy" : undefined} />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedUsers.map((user) => {
                                        return (
                                            <tr
                                                key={user.id ?? `${user.username ?? "user"}-${user.email ?? ""}`}
                                                className="cursor-pointer transition-colors duration-[180ms] hover:bg-blue-50/70 focus-within:bg-blue-50/70"
                                                onClick={(event) => { event.currentTarget.querySelector("button")?.focus(); openUser(user); }}
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{user.id ?? "-"}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900"><button type="button" className="ui-button min-h-11 rounded-xl text-left hover:text-blue-700" aria-label={`Xem thông tin ${formatFullName(user)}`} onClick={(event) => { event.stopPropagation(); openUser(user); }}>{formatFullName(user)}</button></td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{user.username ?? "-"}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{user.email ?? "-"}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm"><span className={`ui-badge border ${user.role?.toLowerCase() === "admin" ? "border-blue-200 bg-blue-50 text-blue-800" : user.role?.toLowerCase() === "operator" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-100 text-slate-700"}`}>{formatRole(user.role)}</span></td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{formatDate(user.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                    {paginatedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-14 text-center text-sm text-slate-600">
                                                {users.length === 0 ? "Chưa có người dùng trong hệ thống." : "Không có người dùng phù hợp với bộ lọc hiện tại."}
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4">
                            <p role="status" aria-atomic="true" className="text-sm text-slate-600">
                                Hiển thị {pageStartRecord}-{pageEndRecord} / {filteredAndSortedUsers.length} người dùng
                            </p>
                            <nav aria-label="Phân trang người dùng" className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="ui-button ui-button-secondary min-h-11 rounded-xl"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Trước
                                </button>
                                <span className="text-sm font-semibold text-slate-700">
                                    Trang {currentPage}/{totalPages}
                                </span>
                                <button
                                    type="button"
                                    className="ui-button ui-button-secondary min-h-11 rounded-xl"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Sau
                                </button>
                            </nav>
                        </div>
                    </div>
                ) : null}

                {selectedUser ? createPortal(
                    <div
                        ref={overlayRef}
                        className="ui-scrim fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-4 backdrop-blur-sm"
                        onClick={() => {
                            if (!isSaving && !isDeleting) {
                                setSelectedUser(null);
                            }
                        }}
                    >
                        <div
                            className="ui-dialog flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl outline-none [overflow-wrap:anywhere]"
                            onClick={(event) => event.stopPropagation()}
                            ref={dialogRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-busy={isSaving || isDeleting}
                            aria-modal="true"
                            aria-labelledby="user-dialog-title"
                        >
                            <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-teal-50 px-5 py-5">
                                <div className="min-w-0 flex-1 basis-48">
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">Chi tiết người dùng</p>
                                    <h2 id="user-dialog-title" className="mt-1 text-xl font-bold text-slate-900">{formatFullName(selectedUser)}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            className="ui-icon-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            onClick={() => {
                                                setIsEditing(true);
                                                setSaveMessage(null);
                                                setSaveError(null);
                                            }}
                                            disabled={!canEditSelectedUser || isDeleting}
                                            aria-label="Chỉnh sửa"
                                            title="Chỉnh sửa"
                                        >
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9" />
                                                <path d="m16.5 3.5 4 4L7 21l-4 1 1-4L16.5 3.5Z" />
                                            </svg>
                                        </button>
                                    ) : null}
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            className="ui-icon-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            onClick={() => void handleDeleteUser()}
                                            disabled={isSaving || isDeleting}
                                            aria-label={isDeleting ? "Đang xóa người dùng" : "Xóa người dùng"}
                                            title="Xóa người dùng"
                                        >
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18" />
                                                <path d="M8 6V4h8v2" />
                                                <path d="M19 6l-1 14H6L5 6" />
                                                <path d="M10 10v6" />
                                                <path d="M14 10v6" />
                                            </svg>
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="ui-icon-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={() => setSelectedUser(null)}
                                        disabled={isSaving || isDeleting}
                                        aria-label="Đóng"
                                        title="Đóng"
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                            <path d="M6 6l12 12" />
                                            <path d="M18 6 6 18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-0 overflow-y-auto overscroll-contain">
                            {!canEditSelectedUser ? (
                                <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    API auth/update chỉ cho phép cập nhật tài khoản đang đăng nhập.
                                </div>
                            ) : null}

                            {isDeleting ? <p role="status" className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-800"><span aria-hidden="true" className="ui-spinner h-4 w-4 rounded-full border-2 border-blue-200 border-t-blue-700" />Đang xóa người dùng...</p> : null}

                            {saveMessage ? (
                                <div role="status" className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                    {saveMessage}
                                </div>
                            ) : null}

                            {saveError ? (
                                <div role="alert" className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    {saveError}
                                </div>
                            ) : null}

                            <div className="px-5 py-4">
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <div className="flex flex-col gap-4">
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Mã user</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{selectedUser.id ?? "-"}</p>
                                        </article>
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Username</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{selectedUser.username ?? "-"}</p>
                                        </article>
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <label htmlFor="user-edit-phone" className="block text-xs uppercase tracking-wide text-slate-500">Số điện thoại</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    id="user-edit-phone"
                                                    value={editForm.phone}
                                                    onChange={(event) =>
                                                        setEditForm((prev) => ({ ...prev, phone: event.target.value }))
                                                    }
                                                    className="ui-input mt-2 w-full rounded-xl"
                                                    placeholder="Nhập số điện thoại"
                                                    disabled={isSaving}
                                                />
                                            ) : (
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedUser.phone ?? "-"}</p>
                                            )}
                                        </article>
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <label htmlFor="user-edit-province" className="block text-xs uppercase tracking-wide text-slate-500">Tỉnh/Thành phố</label>
                                            {isEditing ? (
                                                <select
                                                    id="user-edit-province"
                                                    value={editForm.province}
                                                    onChange={(event) =>
                                                        setEditForm((prev) => ({ ...prev, province: event.target.value }))
                                                    }
                                                    className="ui-input mt-2 w-full rounded-xl"
                                                    disabled={isSaving}
                                                >
                                                    <option value="">Chọn tỉnh/thành phố</option>
                                                    {!PROVINCE_OPTIONS.includes(editForm.province) && editForm.province ? (
                                                        <option value={editForm.province}>{editForm.province}</option>
                                                    ) : null}
                                                    {PROVINCE_OPTIONS.map((province) => (
                                                        <option key={province} value={province}>
                                                            {province}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedUser.province ?? "-"}</p>
                                            )}
                                        </article>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Vai trò</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatRole(selectedUser.role)}</p>
                                        </article>
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                                            <p className="mt-1 break-all text-sm font-semibold text-slate-900">{selectedUser.email ?? "-"}</p>
                                        </article>
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Ngày tạo</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(selectedUser.created_at)}</p>
                                        </article>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <label htmlFor="user-edit-ward" className="block text-xs uppercase tracking-wide text-slate-500">Phường/Xã</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    id="user-edit-ward"
                                                    value={editForm.ward}
                                                    onChange={(event) =>
                                                        setEditForm((prev) => ({ ...prev, ward: event.target.value }))
                                                    }
                                                    className="ui-input mt-2 w-full rounded-xl"
                                                    placeholder="Nhập phường/xã"
                                                    disabled={isSaving}
                                                />
                                            ) : (
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedUser.ward ?? "-"}</p>
                                            )}
                                        </article>
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <label htmlFor="user-edit-password" className="block text-xs uppercase tracking-wide text-slate-500">Đổi mật khẩu</label>
                                            {isEditing ? (
                                                <input
                                                    type="password"
                                                    id="user-edit-password"
                                                    value={editForm.password}
                                                    onChange={(event) =>
                                                        setEditForm((prev) => ({ ...prev, password: event.target.value }))
                                                    }
                                                    className="ui-input mt-2 w-full rounded-xl"
                                                    placeholder="Để trống nếu không đổi"
                                                    disabled={isSaving}
                                                />
                                            ) : (
                                                <p className="mt-1 text-sm font-semibold text-slate-900">********</p>
                                            )}
                                        </article>
                                        <article className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
                                            <label htmlFor="user-edit-address_line" className="block text-xs uppercase tracking-wide text-slate-500">Địa chỉ chi tiết</label>
                                            {isEditing ? (
                                                <textarea
                                                    rows={2}
                                                    id="user-edit-address_line"
                                                    value={editForm.address_line}
                                                    onChange={(event) =>
                                                        setEditForm((prev) => ({ ...prev, address_line: event.target.value }))
                                                    }
                                                    className="ui-input mt-2 min-h-24 w-full rounded-xl"
                                                    placeholder="Nhập số nhà, đường..."
                                                    disabled={isSaving}
                                                />
                                            ) : (
                                                <p className="mt-1 min-h-10 whitespace-pre-wrap text-sm font-semibold text-slate-900">{selectedUser.address_line ?? "-"}</p>
                                            )}
                                        </article>
                                    </div>
                                </div>
                            </div>

                            </div>
                            {isEditing ? (
                                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
                                    <button
                                        type="button"
                                        className="ui-button ui-button-secondary min-h-11 rounded-xl"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setSaveError(null);
                                            setSaveMessage(null);
                                            setEditForm({
                                                phone: selectedUser.phone ?? "",
                                                province: selectedUser.province ?? "",
                                                ward: selectedUser.ward ?? "",
                                                address_line: selectedUser.address_line ?? "",
                                                password: "",
                                            });
                                        }}
                                        disabled={isSaving}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        className="ui-button ui-button-primary min-h-11 rounded-xl"
                                        onClick={() => void handleSaveUserDetail()}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>, document.body
                ) : null}
            </div>
        </section>
    );
}
