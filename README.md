# VietFlood Insight FE

Frontend dự án phân tích tình hình lũ lụt tại Việt Nam, xây dựng bằng Next.js App Router.

## Chạy dự án

```bash
npm install
npm run dev
```

Truy cập `http://localhost:3000`.

## Cấu hình API đăng nhập

Mặc định frontend gọi API:

- `http://localhost:8081/auth/sign_in`

Bạn có thể đổi base URL bằng biến môi trường:

```bash
NEXT_PUBLIC_AUTH_API_BASE_URL=http://localhost:8081
```

Ví dụ file `.env.local`:

```bash
NEXT_PUBLIC_AUTH_API_BASE_URL=http://localhost:8081
```

## Tuyến trang hiện có

- `/trang-chu`: Trang chính hiển thị dashboard tổng quan về nguy cơ lũ.
- `/dang-nhap`: Trang đăng nhập hệ thống.

## Cấu trúc thư mục chuẩn (dễ mở rộng)

```text
src/
	app/
		(public)/
			trang-chu/
				page.tsx
			layout.tsx
		(auth)/
			dang-nhap/
				page.tsx
			layout.tsx
		globals.css
		layout.tsx
		page.tsx
	components/
		navigation/
			site-header.tsx
	features/
		auth/
			api/
				sign-in.ts
			components/
				auth-form-card.tsx
				login-form.tsx
			lib/
				auth-storage.ts
			types/
				auth.ts
		home/
			components/
				flood-dashboard.tsx
	lib/
		site-config.ts
	types/
		navigation.ts
```

## Nguyên tắc mở rộng

- Tách theo `features` khi có logic nghiệp vụ riêng (vd: cảnh báo, bản đồ, báo cáo).
- `components` chỉ chứa UI dùng lại nhiều nơi, không phụ thuộc nghiệp vụ cụ thể.
- `lib` chứa hằng số, helper, cấu hình dùng chung toàn app.
- Mỗi route mới đặt trong `app/(group)/<route>/page.tsx` để kiểm soát layout linh hoạt.
