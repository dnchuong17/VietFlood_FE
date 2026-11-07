import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
    title: "Đăng nhập | VietFlood Insight",
};

export default function LoginPage() {
    return (
        <AuthFormCard
            title="Đăng nhập hệ thống"
            description="Truy cập bảng điều hành cảnh báo lũ lụt và dữ liệu phân tích theo khu vực."
            note="Đây là tính năng dành riêng cho quản trị viên"
        >
            <LoginForm />
        </AuthFormCard>
    );
}
