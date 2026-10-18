# Giao diện mẫu 03 — Vehicle Overview

## Chạy bản project này

1. Giải nén ZIP vào một thư mục mới.
2. Mở thư mục `va-fullstack-assessment` bằng VS Code.
3. Mở Docker Desktop, đợi Docker khởi động.
4. Mở terminal tại thư mục có `docker-compose.yml` rồi chạy:

```bash
docker compose up --build
```

5. Mở http://localhost:3000 để xem dashboard.

Nếu bản project cũ đang chạy, hãy chạy `docker compose down` ở thư mục cũ trước để giải phóng các cổng 3000, 3001 và 4000.

## Các phần trong mẫu 03

- Nền tối và màu cyan; hình xe nhìn từ trên xuống ở giữa.
- Bên trái: tốc độ xe, góc lái, áp suất phanh trước.
- Bốn ô áp suất lốp FL, FR, RL, RR đặt quanh xe và nối bằng đường chỉ dẫn.
- Bên phải: nhiệt độ pin, nhiệt độ motor, mức pin, điện áp và dòng điện.
- Trên cùng: trạng thái API, emulator, số lượng sensor và thời gian dữ liệu gần nhất.
- Tab Sensors: bảng sensor, tìm kiếm theo tên/ID, lọc trạng thái, sắp xếp theo tên hoặc thời gian cập nhật, bốn biểu đồ.
- Tab Trends: biểu đồ riêng cho từng sensor; ô tìm kiếm cũng áp dụng ở đây.
- Tab System: trạng thái kết nối, thông tin thu thập dữ liệu và các sensor cần chú ý.
- Bố cục tự điều chỉnh trên màn hình nhỏ.

## Dữ liệu thật và trạng thái

Dashboard dùng metadata từ `/sensors` để ánh xạ ID sang tên và đơn vị; lấy reading mới nhất từ `/telemetry` khoảng mỗi giây. Health được kiểm tra mỗi 5 giây. Khi một request chậm, request tiếp theo chờ request trước hoàn thành để tránh chồng lặp.

Không có dữ liệu số hoặc biểu đồ giả trong giao diện. Biểu đồ tích lũy các reading nhận được trong trình duyệt, giữ cửa sổ 60 giây và xóa khi tải lại trang. Cần đợi một lúc sau khi mở trang để thấy đường biểu đồ. Đây là các mẫu lấy từ API, không phải toàn bộ stream gốc của emulator.

Reading quá 5 giây chuyển thành `Stale`. Giá trị ngoài khoảng hợp lệ hiển thị `Out of range`; giá trị cuối ngoài khoảng vẫn có màu đỏ kể cả khi đã stale. Sensor chưa có reading hiển thị `No data` và dấu `—`. Khi API lỗi, dữ liệu cuối được giữ lại cùng thời gian cập nhật, thông báo lỗi và cơ chế tự thử lại.

`/health` hiện kiểm tra khả năng truy cập metadata của emulator; trạng thái stream được suy ra thêm từ độ mới của reading. Không có số Hz hoặc tốc độ truyền giả định như trong ảnh concept.

## Cập nhật vào project đang có Git

Nếu muốn giữ repository và lịch sử Git hiện tại, hãy copy **nội dung thư mục `frontend/`** của bản mới vào thư mục `frontend/` trong project của bạn, cho phép ghi đè file. Sau đó chạy lại `docker compose up --build`. ZIP không chứa `.git`, `node_modules` hoặc các bản build.

Backend, emulator, OpenAPI và justification giữ nguyên nội dung từ ZIP bạn gửi. Đây là bản triển khai frontend theo bố cục mẫu 03; hình xe là minh họa tạo riêng, không phải hình kỹ thuật của xe Redback thật. File Figma chưa được tạo trong lần cập nhật này.

## Các file frontend chính

- `src/app/page.tsx`: bố cục, header, tab và tìm kiếm.
- `src/app/globals.css`: màu sắc, kích thước, bố cục responsive.
- `src/hooks/use-telemetry.ts`: metadata, polling, retry, cleanup và lịch sử.
- `src/lib/api-client.ts`: request có timeout và hủy khi đóng trang.
- `src/lib/telemetry.ts`: giới hạn hợp lệ, status, đơn vị và history.
- `src/components/dashboard/`: metric cards, sơ đồ xe, bảng sensor, biểu đồ và system panel.
- `public/vehicle-top.png`: hình xe trang trí tạo bằng công cụ tạo ảnh, từ mô tả: “Top-down Formula Student electric racing car, black carbon fibre, thin cyan accents, four slick tyres, full vehicle, transparent background, no UI, labels or logos.”

Thông số API và mô hình dữ liệu vẫn tương thích với backend hiện có. Không cần cài thêm thư viện chart.
