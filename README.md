# MediCare - Hệ thống đặt lịch khám bệnh trực tuyến

## 📝 Giới thiệu
MediCare là đồ án xây dựng hệ thống đặt lịch khám bệnh cho phòng khám đa khoa. Hệ thống giúp bệnh nhân chủ động đặt lịch, giảm thời gian chờ đợi và giúp bác sĩ quản lý ca làm việc, lịch hẹn một cách dễ dàng.

## 🚀 Công nghệ sử dụng
*   **Backend:** Java 17, Spring Boot 3, Spring Security (JWT), Hibernate/JPA.
*   **Frontend:** ReactJS (Vite), Tailwind CSS, Axios, React Router.
*   **Database:** MySQL 8.
*   **Tính năng phụ:** Spring Mail (Gửi email qua Mailtrap).

## ✨ Chức năng chính
*   **Bệnh nhân:** Đăng ký/đăng nhập, kiểm tra triệu chứng (Symptom Checker), tìm bác sĩ, đặt/đổi/hủy lịch hẹn, xem lịch sử khám.
*   **Bác sĩ:** Quản lý ca làm việc linh hoạt (thêm/sửa/xóa), xem danh sách lịch hẹn, xác nhận, check-in, hoàn thành hoặc đánh dấu vắng mặt.
*   **Quản trị viên:** Quản lý tài khoản bác sĩ, xem báo cáo thống kê, quản lý toàn bộ lịch khám của phòng khám.
*   **Hệ thống:** Chống trùng lịch (Optimistic Locking + Unique Constraint), Máy trạng thái (State Machine), Gửi email thông báo tự động.

## 🛠️ Hướng dẫn cài đặt và chạy dự án

### 1. Chuẩn bị Database
*   Tạo database trong MySQL: `CREATE DATABASE medicare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
*   Cấu hình lại thông tin kết nối DB bằng biến môi trường.

### 2. Chạy Backend (Spring Boot)
*   Mở thư mục gốc bằng IntelliJ IDEA.
*   Đợi Maven tải dependencies.
*   Chạy file `MedicareApplication.java`.
*   Backend sẽ chạy ở cổng `http://localhost:8080`.

### 3. Chạy Frontend (ReactJS)
*   Mở Terminal, di chuyển vào thư mục `medicare-frontend`.
*   Cài đặt thư viện: `npm install`
*   Chạy dự án: `npm run dev`
*   Truy cập `http://localhost:5173`.

## 🔑 Tài khoản Test
*   **Quản trị viên (Admin):** `admin@medicare.local` / `admin12345`
*   **Bác sĩ:** `bacsi.test@gmail.com` / `12345678`
*   **Bệnh nhân:** `benhnhan1@gmail.com` / `12345678`

---
*Đồ án được thực hiện bởi Phan Văn Sáng.*
