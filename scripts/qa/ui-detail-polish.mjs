#!/usr/bin/env node
/** Fixture-backed UI acceptance. Never talks to the real API or Windy. */
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const arg = process.argv.indexOf("--base-url");
const baseURL = process.argv[arg + 1] || "http://localhost:3100";
if (arg < 0 && process.argv.length > 2) throw new Error("Usage: node scripts/qa/ui-detail-polish.mjs --base-url http://localhost:3100");
const origin = new URL(baseURL).origin;
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) throw new Error("QA must run on a loopback app origin");
const out = path.resolve(process.env.QA_OUTPUT || `docs/qa-results/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(out, { recursive: true });
const results = [];
const unexpected = [];
const pageErrors = [];
const hydrationErrors = [];
const requests = [];
const token = `${Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url")}.${Buffer.from(JSON.stringify({ username: "qa-admin", first_name: "QA", last_name: "Admin" })).toString("base64url")}.fixture-only`;
const users = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1, username: i === 0 ? "qa-admin" : `qa-user-${String(i + 1).padStart(2, "0")}`,
  first_name: i === 0 ? "QA" : "Nguyễn", middle_name: i === 0 ? "" : "Thị", last_name: i === 0 ? "Admin" : `Kiểm thử ${i + 1}`,
  email: `fixture-${i + 1}@example.test`, role: i === 0 ? "admin" : i % 3 === 0 ? "operator" : "citizen",
  phone: "0900000000", province: "Đà Nẵng", ward: "Phường kiểm thử", address_line: "Địa chỉ dữ liệu giả lập — không phải tài khoản thật.", created_at: "2026-11-01T08:00:00+07:00",
}));
const browser = await chromium.launch({ headless: true });

async function setup({ width = 1440, height = 900, auth = true, state = "populated", login = "error", reducedMotion = "no-preference", colorScheme = "light" } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion, colorScheme, serviceWorkers: "block" });
  if (auth) await context.addCookies([{ name: "vietflood_access_token", value: token, url: origin }]);
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.startsWith("/auth/")) {
      requests.push({ method: req.method(), path: url.pathname, fixture: true });
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", "access-control-allow-headers": "Authorization, Content-Type", "access-control-allow-methods": "GET, POST, DELETE, OPTIONS" } });
      const headers = { "access-control-allow-origin": origin, "access-control-allow-credentials": "true" };
      const respond = (body, status = 200) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(body) });
      if (url.pathname === "/auth/all") {
        await new Promise((resolve) => setTimeout(resolve, state === "loading" ? 2500 : 150));
        const records = state === "long" ? users.map((user, index) => index ? user : { ...user, first_name: "Nguyễn Thị Thanh Huyền Kiểm Thử Nội Dung Tiếng Việt Rất Dài", last_name: "QA", email: `${"long-fixture-".repeat(8)}@example.test`, province: "Tỉnh dữ liệu cũ QA", ward: "Phườngkiểmthử".repeat(12), address_line: "Địa chỉ giả lập với nội dung tiếng Việt dài. ".repeat(25) }) : users;
        return respond(state === "error" ? { message: "Lỗi giả lập QA: không thể tải người dùng." } : state === "empty" ? [] : records, state === "error" ? 503 : 200);
      }
      if (url.pathname === "/auth/sign_in") {
        await new Promise((resolve) => setTimeout(resolve, 700));
        return login === "error" ? respond({ message: "Lỗi đăng nhập giả lập QA. Vui lòng thử lại." }, 401) : respond({ accessToken: token });
      }
      if (url.pathname === "/auth/profile") return respond({ username: "qa-admin", role: login === "denied" ? "citizen" : "admin" });
      if (url.pathname === "/auth/update") return respond({ ok: true });
      if (url.pathname.startsWith("/auth/delete/")) return respond({ ok: true });
      unexpected.push(`${req.method()} undeclared API ${url.pathname}`);
      return route.abort();
    }
    if (url.hostname === "embed.windy.com") return route.fulfill({ contentType: "text/html; charset=utf-8", body: '<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>body{margin:0;background:#dbe8eb;color:#294859;font:14px system-ui}main{height:100vh;display:grid;place-content:center;background-image:linear-gradient(#c9dce144 1px,transparent 1px),linear-gradient(90deg,#c9dce144 1px,transparent 1px);background-size:48px 48px}p{background:#ffffffcc;padding:14px 20px;border-radius:12px}</style></head><body><main><p>QA fixture · Windy network isolated</p></main></body></html>' });
    if (url.origin === origin && ["GET", "HEAD"].includes(req.method()) && !url.pathname.startsWith("/_next/image")) return route.continue();
    if (["data:", "blob:"].includes(url.protocol)) return route.continue();
    unexpected.push(`${req.method()} ${url.origin}${url.pathname}`);
    return route.abort();
  });
  await context.routeWebSocket("**/*", (socket) => {
    if (new URL(socket.url()).host === new URL(origin).host) socket.connectToServer();
    else { unexpected.push(`WebSocket ${socket.url()}`); socket.close(); }
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (msg) => { if (/hydration|did not match|cannot be a descendant|cannot contain a nested/i.test(msg.text())) hydrationErrors.push(msg.text()); });
  page.setDefaultTimeout(9000);
  return { page, context };
}
async function bounds(page) {
  const dimensions = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, width: innerWidth }));
  expect(dimensions.doc).toBeLessThanOrEqual(dimensions.width + 1);
}
async function shot(page, name) { await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true, animations: "disabled" }); }
async function run(name, fn) {
  try { await fn(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, error: error.stack }); console.error(`FAIL ${name}: ${error.message}`); }
  await writeFile(path.join(out, "results.json"), JSON.stringify({ fixtureBacked: true, baseURL, results, unexpected, pageErrors, hydrationErrors, requests }, null, 2));
}

try {
  for (const width of [375, 768, 1024, 1440]) for (const route of ["trang-chu", "tong-quan", "dang-nhap"]) {
    await run(`layout-${route}-${width}`, async () => {
      const { page, context } = await setup({ width, auth: route !== "dang-nhap" });
      try {
        await page.goto(`${origin}/${route}`);
        if (route === "tong-quan") await expect(page.getByText("fixture-1@example.test", { exact: true })).toBeVisible();
        if (route === "dang-nhap") await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
        if (route === "trang-chu") {
          await expect(page.getByRole("button", { name: /Chọn lớp bản đồ/ })).toBeVisible();
          await expect(page.frameLocator("iframe").getByText("QA fixture · Windy network isolated", { exact: true })).toBeVisible();
        }
        await bounds(page);
        if (route !== "dang-nhap") {
          const header = await page.locator("header").first().boundingBox();
          const main = await page.locator("main").first().boundingBox();
          expect(main.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
        }
        await shot(page, `${route}-${width}`);
      } finally { await context.close(); }
    });
  }
  await run("map-menu-keyboard-all-overlays", async () => {
    const { page, context } = await setup({ width: 375 });
    try {
      await page.goto(`${origin}/trang-chu`);
      const trigger = page.getByRole("button", { name: /Chọn lớp bản đồ/ });
      const weather = page.getByRole("button", { name: /bảng số liệu thời tiết/ });
      const before = await page.locator("iframe").getAttribute("src");
      await weather.click();
      await expect(page.locator("iframe")).not.toHaveAttribute("src", before);
      for (const [label, value] of [["Mưa", "rain"], ["Gió", "wind"], ["Nhiệt độ", "temp"], ["Độ ẩm", "rh"], ["Mây", "clouds"], ["Áp suất", "pressure"]]) {
        await trigger.click();
        await page.getByRole("menuitemradio", { name: label, exact: true }).click();
        await expect(page.locator("iframe")).toHaveAttribute("src", new RegExp(`overlay=${value}&`));
        await expect(trigger).toBeFocused();
      }
      await trigger.press("ArrowDown");
      await expect(page.getByRole("menuitemradio", { name: "Áp suất", exact: true })).toBeFocused();
      await page.keyboard.press("Home");
      await expect(page.getByRole("menuitemradio", { name: "Mưa", exact: true })).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menuitemradio", { name: "Gió", exact: true })).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.getByRole("menuitemradio", { name: "Áp suất", exact: true })).toBeFocused();
      await expect(page.frameLocator("iframe").getByText("QA fixture · Windy network isolated", { exact: true })).toBeVisible();
      await shot(page, "map-dropdown-mobile");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(page.getByRole("menu")).toHaveCount(0);
      await trigger.click();
      await weather.click();
      await expect(page.getByRole("menu")).toHaveCount(0);
      await trigger.click();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("menu")).toHaveCount(0);
      await bounds(page);
    } finally { await context.close(); }
  });
  await run("users-filter-sort-pagination-dialog-edit", async () => {
    const { page, context } = await setup();
    try {
      await page.goto(`${origin}/tong-quan`);
      await expect(page.getByText("fixture-1@example.test", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: /Sau/, exact: false }).click();
      await expect(page.getByText("fixture-25@example.test", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: /Trước/, exact: false }).click();
      const column = page.getByRole("button", { name: "Tùy chỉnh ID", exact: true });
      await column.click();
      const filter = page.getByLabel("Lọc ID", { exact: true });
      await expect(filter).toBeFocused();
      await page.getByRole("button", { name: /Giảm dần/ }).click();
      await page.keyboard.press("Escape");
      await expect(column).toBeFocused();
      await expect(page.locator("tbody tr").first()).toContainText("fixture-25@example.test");
      await column.click();
      await page.getByRole("button", { name: /Tăng dần/ }).click();
      await filter.fill("999");
      await expect(page.getByText(/Không có người dùng phù hợp/)).toBeVisible();
      await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
      await page.getByRole("button", { name: "Đóng", exact: true }).click();
      await expect(column).toBeFocused();
      await page.getByText("fixture-1@example.test", { exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "QA Admin", exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
      await expect(dialog.getByRole("combobox")).toBeVisible();
      await dialog.getByRole("combobox").selectOption("Hà Nội");
      await expect(dialog.getByRole("combobox")).toHaveValue("Hà Nội");
      await dialog.getByLabel("Số điện thoại", { exact: true }).fill("0912345678");
      await dialog.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
      await expect(dialog.getByText("0912345678", { exact: true })).toBeVisible();
      await shot(page, "user-dialog-desktop");
      for (let i = 0; i < 16; i++) { await page.keyboard.press("Tab"); expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true); }
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      // Preserve edit permission and native destructive-action confirmation.
      await page.getByText("fixture-2@example.test", { exact: true }).click();
      const otherDialog = page.getByRole("dialog", { name: "Nguyễn Thị Kiểm thử 2", exact: true });
      await expect(otherDialog.getByRole("button", { name: "Chỉnh sửa", exact: true })).toBeDisabled();
      const deleteRequestsBefore = requests.filter((request) => request.method === "DELETE").length;
      const confirmation = page.waitForEvent("dialog").then(async (nativeDialog) => {
        expect(nativeDialog.type()).toBe("confirm");
        await nativeDialog.dismiss();
      });
      await Promise.all([confirmation, otherDialog.getByRole("button", { name: "Xóa người dùng", exact: true }).click()]);
      await expect(otherDialog).toBeVisible();
      expect(requests.filter((request) => request.method === "DELETE").length).toBe(deleteRequestsBefore);
      await page.keyboard.press("Escape");
      // Portalled filter stays inside viewport when its table has horizontal scroll.
      await page.setViewportSize({ width: 375, height: 812 });
      const last = page.getByRole("button", { name: "Tùy chỉnh Ngày tạo", exact: true });
      await last.click();
      const popup = page.getByRole("dialog", { name: "Tùy chỉnh Ngày tạo", exact: true });
      await expect(popup).toBeVisible();
      const box = await popup.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(375);
      await shot(page, "table-dropdown-mobile");
      await page.keyboard.press("Escape");
      await page.getByText("fixture-1@example.test", { exact: true }).click();
      await expect(dialog).toBeVisible();
      const modalBox = await dialog.boundingBox();
      expect(modalBox.y).toBeGreaterThanOrEqual(0); expect(modalBox.y + modalBox.height).toBeLessThanOrEqual(813);
      await shot(page, "user-dialog-mobile");
      await page.keyboard.press("Escape");
    } finally { await context.close(); }
  });
  await run("login-password-loading-error", async () => {
    const { page, context } = await setup({ width: 375, auth: false });
    try {
      await page.goto(`${origin}/dang-nhap`);
      await page.getByLabel("Tên đăng nhập", { exact: true }).fill("qa-admin");
      await page.getByLabel("Mật khẩu", { exact: true }).fill("fixture-not-a-real-password");
      await page.getByRole("button", { name: "Hiện mật khẩu", exact: true }).click();
      await expect(page.locator("#password")).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: "Ẩn mật khẩu", exact: true }).click();
      await expect(page.locator("#password")).toHaveAttribute("type", "password");
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      await expect(page.getByRole("button", { name: "Đang đăng nhập...", exact: true })).toBeDisabled();
      await expect(page.getByRole("alert").filter({ hasText: "Lỗi đăng nhập giả lập QA" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
      await shot(page, "login-error-mobile");
    } finally { await context.close(); }
  });
  for (const state of ["empty", "error", "loading"]) await run(`users-${state}`, async () => {
    const { page, context } = await setup({ width: 375, state });
    try {
      await page.goto(`${origin}/tong-quan`);
      if (state === "error") await expect(page.getByRole("alert").filter({ hasText: "Lỗi giả lập QA: không thể tải người dùng." })).toBeVisible();
      if (state === "empty") await expect(page.getByText(/Chưa có người dùng/)).toBeVisible();
      if (state === "loading") await expect(page.getByText("Đang tải danh sách người dùng...", { exact: true })).toBeVisible();
      await shot(page, `users-${state}-mobile`);
      await bounds(page);
    } finally { await context.close(); }
  });
  await run("reduced-motion-system-dark-landscape", async () => {
    const { page, context } = await setup({ width: 812, height: 375, reducedMotion: "reduce", colorScheme: "dark" });
    try {
      await page.goto(`${origin}/trang-chu`);
      await page.getByRole("button", { name: /Chọn lớp bản đồ/ }).click();
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      const style = await menu.evaluate((el) => ({ animationDuration: getComputedStyle(el).animationDuration, colorScheme: getComputedStyle(document.documentElement).colorScheme }));
      expect(parseFloat(style.animationDuration)).toBeLessThan(0.001);
      expect(style.colorScheme).toBe("light");
      const menuBox = await menu.boundingBox();
      expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(375);
      await bounds(page);
      await shot(page, "map-reduced-motion-landscape");
    } finally { await context.close(); }
  });
  await run("long-vietnamese-dialog-scroll-legacy-province", async () => {
    const { page, context } = await setup({ width: 375, height: 667, state: "long" });
    try {
      await page.goto(`${origin}/tong-quan`);
      const rowButton = page.getByRole("button", { name: /Xem thông tin Nguyễn Thị Thanh Huyền/ });
      await rowButton.click();
      const dialog = page.getByRole("dialog", { name: /Nguyễn Thị Thanh Huyền/ });
      await expect(dialog).toBeVisible();
      await dialog.getByText("Phườngkiểmthử".repeat(12), { exact: true }).scrollIntoViewIfNeeded();
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await dialog.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
      await expect(dialog.getByLabel("Tỉnh/Thành phố", { exact: true })).toHaveValue("Tỉnh dữ liệu cũ QA");
      await dialog.getByLabel("Địa chỉ chi tiết", { exact: true }).scrollIntoViewIfNeeded();
      await expect(dialog.getByRole("button", { name: "Lưu thay đổi", exact: true })).toBeInViewport();
      await shot(page, "user-dialog-long-vietnamese-mobile");
      await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(rowButton).toBeFocused();
      await bounds(page);
    } finally { await context.close(); }
  });
  for (const login of ["success", "denied"]) await run(`login-${login}-preserves-policy`, async () => {
    const { page, context } = await setup({ width: 768, auth: false, login });
    try {
      await page.goto(`${origin}/dang-nhap`);
      await page.getByLabel("Tên đăng nhập", { exact: true }).fill("qa-admin");
      await page.getByLabel("Mật khẩu", { exact: true }).fill("fixture-not-a-real-password");
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
      if (login === "success") {
        await expect(page).toHaveURL(`${origin}/trang-chu`);
        await page.getByRole("link", { name: "Tổng quan", exact: true }).click();
        await expect(page.getByText("fixture-1@example.test", { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
        await expect(page).toHaveURL(`${origin}/trang-chu`);
        await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
        expect((await context.cookies()).some((cookie) => cookie.name === "vietflood_access_token")).toBe(false);
      } else {
        await expect(page.getByRole("alert").filter({ hasText: "Tài khoản không có quyền quản trị" })).toBeVisible();
        expect((await context.cookies()).some((cookie) => cookie.name === "vietflood_access_token")).toBe(false);
      }
    } finally { await context.close(); }
  });
} finally {
  await browser.close();
}
const summary = { cases: results.length, passed: results.filter((r) => r.passed).length, failed: results.filter((r) => !r.passed).length, unexpectedRequests: unexpected.length, pageErrors: pageErrors.length, hydrationErrors: hydrationErrors.length };
await writeFile(path.join(out, "results.json"), JSON.stringify({ fixtureBacked: true, baseURL, summary, results, unexpected, pageErrors, hydrationErrors, requests }, null, 2));
console.log(JSON.stringify({ out, ...summary }, null, 2));
if (summary.cases !== 22 || summary.failed || unexpected.length || pageErrors.length || hydrationErrors.length) process.exitCode = 1;
