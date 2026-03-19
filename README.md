//////////////////////////////English Below///////////////////////////////
# TELEGRAM MULTI-PURPOSE CONTROL BOT (V30)

## 1. TỔNG QUAN DỰ ÁN
Dự án cung cấp một giải pháp quản lý tự động tích hợp đa chức năng trên nền tảng Telegram, sử dụng Google Apps Script (GAS) làm trung tâm xử lý dữ liệu. Hệ thống biến Google Sheets thành một cơ sở dữ liệu quan hệ đơn giản và Google Drive thành kho lưu trữ tệp tin đám mây.

Bot được tối ưu hóa cho các nhu cầu cá nhân và nhóm nhỏ, giúp số hóa việc ghi chép tài chính, lưu trữ hóa đơn, tra cứu dữ liệu và nhắc nhở thông tin quan trọng.

## 2. KIẾN TRÚC KỸ THUẬT (SYSTEM ARCHITECTURE)

### 2.1. Sơ đồ luồng dữ liệu (Data Workflow)
1.  **Giao diện người dùng (Frontend)**: Người dùng gửi yêu cầu qua Telegram Bot.
2.  **Cổng tiếp nhận (Gateway)**: Telegram API gửi Webhook (POST request) đến URL Google Apps Script.
3.  **Xử lý trung tâm (Core Logic)**:
    * Hàm `doPost(e)` tiếp nhận và phân giải JSON.
    * Hàm `uploadPhotoToDrive` xử lý các tệp phương tiện nếu có.
    * Các Module chức năng thực hiện truy vấn/ghi dữ liệu vào SpreadsheetApp.
4.  **Cơ sở dữ liệu (Database)**: Các trang tính (Sheets) được phân tách theo chức năng: `Log Message`, `Thu Chi`, `Cần Đòi Nợ`, `Super Voucher`, `Biển Số Xe`, `GenQRBarCode`.

### 2.2. Bảo mật và Cấu hình
Dự án sử dụng `PropertiesService` để tách biệt mã nguồn và thông tin nhạy cảm. Điều này giúp ngăn chặn việc lộ Token hoặc ID khi chia sẻ script.

## 3. CÁC MODULE CHỨC NĂNG CHI TIẾT

### 3.1. Quản lý Tài chính (Finance Module)
* **Ghi chép giao dịch (/c)**: Ghi lại số tiền, nội dung và thời gian thực hiện.
* **Hỗ trợ minh chứng**: Nếu gửi kèm hình ảnh, bot tự động tải ảnh lên Google Drive và lưu liên kết vào cột "Hình Ảnh Bill".
* **Tính toán tự động**: Sử dụng công thức mảng để tự động tính số dư lũy kế ngay trên trang tính.
* **Báo cáo trực quan (/chart)**: Tự động tổng hợp dữ liệu Thu/Chi và vẽ biểu đồ tròn thông qua QuickChart API.

### 3.2. Quản lý Voucher (Voucher Management System)
* **Lưu trữ (/voucher)**: Ghi nhận Giá trị, Mã, Hạn sử dụng và Thương hiệu.
* **Trạng thái sử dụng (/use)**: Đánh dấu mã đã dùng để loại bỏ khỏi danh sách nhắc nhở.
* **Truy vấn thông minh (/checkvoucher)**: Lọc và hiển thị các mã sắp hết hạn trong vòng 14 ngày.
* **Hệ thống Trigger hàng ngày**: Tự động quét toàn bộ danh sách vào khung giờ cố định và gửi cảnh báo nếu voucher còn 30, 14, 7 hoặc 1 ngày.

### 3.3. Quản lý Công nợ (Debt Tracking)
* **Ghi nợ (/n)**: Lưu thông tin người nợ và nội dung chi tiết.
* **Danh sách tổng hợp (/nlist)**: Hiển thị danh sách nợ hiện tại, hỗ trợ lọc theo tên từng cá nhân và tính tổng nợ cuối bảng.
* **Quản lý dữ liệu (/ndelete)**: Xóa bỏ dòng nợ dựa trên STT hiển thị trong danh sách.

### 3.4. Module Tiện ích và Tra cứu
* **Quản lý Biển số (/bsx)**: Tìm kiếm thông tin chủ xe trong cơ sở dữ liệu nội bộ hoặc thêm mới dữ liệu xe.
* **Tạo mã vạch/QR (/qr, /barcode)**: Tạo mã QR cho văn bản hoặc dữ liệu SMS; tạo Barcode chuẩn Code128.
* **Dịch thuật và Voice (/dich, /noi)**: Tích hợp Google Translation và Text-to-Speech để hỗ trợ giao tiếp và chuyển đổi ngôn ngữ.
* **Đếm ngày (/demngay)**: Tính toán chính xác khoảng thời gian (quá khứ hoặc tương lai) so với ngày hiện tại.

## 4. QUY TRÌNH TRIỂN KHAI (DEPLOYMENT)

### Bước 1: Khởi tạo Bot và Spreadsheet
1.  Tạo Bot qua @BotFather và lấy `BOT_TOKEN`.
2.  Tạo Google Sheet mới và lấy `SHEET_ID` từ thanh địa chỉ.
3.  Tạo thư mục Google Drive để lưu ảnh.

### Bước 2: Cài đặt mã nguồn
1.  Mở Apps Script từ Google Sheets.
2.  Dán mã nguồn vào tệp `Code.gs`.
3.  Cấu hình thông tin vào hàm `setupEnvironment`:
    * `BOT_TOKEN`: Token của bạn.
    * `SHEET_ID`: ID của Sheet.
    * `WEBAPP_URL`: URL sau khi Deploy (Sẽ cập nhật ở bước sau).

### Bước 3: Deploy và Cấp quyền
1.  Nhấn **Deploy** > **New Deployment** > **Web App**.
2.  Cấu hình: `Execute as: Me` và `Who has access: Anyone`.
3.  Sao chép URL nhận được và cập nhật vào `WEBAPP_URL` trong code.

### Bước 4: Kích hoạt hệ thống
1.  Chạy hàm `AutoSetUpBot` để thiết lập môi trường và đăng ký Webhook.
2.  Thiết lập **Trigger** cho hàm `autoScanVoucherExpiry` chạy theo thời gian (Daily).

## 5. DANH SÁCH LỆNH ĐIỀU KHIỂN (COMMAND LIST)

| Nhóm chức năng | Lệnh | Cú pháp ví dụ |
| :--- | :--- | :--- |
| **Hệ thống** | `/start` | Hiển thị menu hướng dẫn |
| **Tài chính** | `/c` | `/c -50000 Tiền xăng` |
| **Voucher** | `/voucher` | `/voucher 50k KM123 20/05/2026 Grab` |
| **Voucher** | `/checkvoucher` | Xem danh sách mã sắp hết hạn |
| **Ghi nợ** | `/n` | `/n 100000 An Tiền cơm` |
| **Ghi nợ** | `/nlist` | `/nlist An` (Lọc nợ theo tên) |
| **Biển số xe** | `/bsx` | `/bsx 29A12345 Nguyễn Văn B` |
| **Công cụ** | `/qr` | `/qr Nội dung cần tạo mã` |
| **Dịch thuật** | `/dich` | `/dich Hello world` |
| **Đếm ngày** | `/demngay` | `/demngay 01/01/2026` |

---
**Lưu ý quan trọng**: Tuyệt đối không chia sẻ tệp script chứa Token thật. Hãy luôn sử dụng hàm `setupEnvironment` để lưu cấu hình và xóa trắng dữ liệu nhạy cảm trong code trước khi công khai.






**/////////////////////////////////**English**//////////////////////////////////
**


# TELEGRAM MULTI-PURPOSE CONTROL BOT (V30)

## 1. PROJECT OVERVIEW
This project provides an automated multi-functional management solution on the Telegram platform, utilizing Google Apps Script (GAS) as the central data processing hub. The system transforms Google Sheets into a simple relational database and Google Drive into a cloud-based file storage repository.

The bot is optimized for personal and small group needs, helping to digitize financial recording, receipt storage, data lookup, and critical information reminders.

## 2. SYSTEM ARCHITECTURE

### 2.1. Data Workflow
1.  **Frontend**: Users send requests via the Telegram Bot interface.
2.  **Gateway**: The Telegram API sends a Webhook (POST request) to the Google Apps Script Web App URL.
3.  **Central Processing (Core Logic)**:
    * The `doPost(e)` function receives and parses the incoming JSON data.
    * The `uploadPhotoToDrive` function handles media files if present.
    * Functional modules perform data queries or entries into the SpreadsheetApp.
4.  **Database**: Spreadsheets are partitioned by function: `Log Message`, `Thu Chi` (Income/Expense), `Cần Đòi Nợ` (Debt Tracking), `Super Voucher`, `Biển Số Xe` (License Plates), and `GenQRBarCode`.

### 2.2. Security and Configuration
The project utilizes `PropertiesService` to decouple the source code from sensitive information. This prevents accidental exposure of Tokens or IDs when sharing the script.

## 3. DETAILED FUNCTIONAL MODULES

### 3.1. Finance Management
* **Transaction Recording (/c)**: Records the amount, content, and timestamp of transactions.
* **Evidence Support**: If an image is attached, the bot automatically uploads the file to Google Drive and saves the access link in the "Bill Image" column.
* **Automated Calculations**: Uses array formulas to calculate cumulative balances directly within the spreadsheet.
* **Visual Reporting (/chart)**: Automatically aggregates Income/Expense data and renders a pie chart via the QuickChart API.

### 3.2. Voucher Management System
* **Storage (/voucher)**: Records Value, Code, Expiry Date, and Brand.
* **Usage Status (/use)**: Marks codes as "Used" to remove them from the active reminder list.
* **Smart Query (/checkvoucher)**: Filters and displays vouchers expiring within the next 14 days.
* **Daily Trigger System**: Automatically scans the entire list at a fixed time daily and sends alerts if a voucher has 30, 14, 7, or 1 day of validity remaining.

### 3.3. Debt Tracking
* **Record Debt (/n)**: Saves debtor information and specific transaction details.
* **Summary List (/nlist)**: Displays the current debt list, supporting filters by individual names and calculating the total debt at the end of the report.
* **Data Management (/ndelete)**: Removes debt entries based on the index (STT) displayed in the list.

### 3.4. Utilities and Lookup
* **License Plate Management (/bsx)**: Searches for vehicle owner information in the internal database or adds new vehicle data.
* **QR/Barcode Generation (/qr, /barcode)**: Generates QR codes for text or SMS data; generates standard Code128 barcodes.
* **Translation and Voice (/dich, /noi)**: Integrates Google Translation and Text-to-Speech to support communication and language conversion.
* **Day Counter (/demngay)**: Precisely calculates the duration (past or future) relative to the current date.

## 4. DEPLOYMENT PROCESS

### Step 1: Initialize Bot and Spreadsheet
1.  Create a Bot via @BotFather and obtain the `BOT_TOKEN`.
2.  Create a new Google Sheet and copy the `SHEET_ID` from the address bar.
3.  Create a Google Drive folder for image storage.

### Step 2: Script Installation
1.  Open Apps Script from your Google Sheet.
2.  Paste the source code into the `Code.gs` file.
3.  Configure information in the `setupEnvironment` function:
    * `BOT_TOKEN`: Your bot token.
    * `SHEET_ID`: Your sheet ID.
    * `WEBAPP_URL`: Your URL after deployment (updated in the next step).

### Step 3: Deployment and Authorization
1.  Click **Deploy** > **New Deployment** > **Web App**.
2.  Configuration: `Execute as: Me` and `Who has access: Anyone`.
3.  Copy the resulting URL and update the `WEBAPP_URL` variable in your code.

### Step 4: System Activation
1.  Run the `AutoSetUpBot` function to initialize the environment and register the Webhook.
2.  Set up a **Trigger** for the `autoScanVoucherExpiry` function to run on a daily time-driven basis.

## 5. COMMAND LIST

| Category | Command | Example Syntax |
| :--- | :--- | :--- |
| **System** | `/start` | Display the instruction menu |
| **Finance** | `/c` | `/c -50000 Gas money` |
| **Voucher** | `/voucher` | `/voucher 50k KM123 20/05/2026 Grab` |
| **Voucher** | `/checkvoucher` | View vouchers nearing expiry |
| **Debt** | `/n` | `/n 100000 John Lunch money` |
| **Debt** | `/nlist` | `/nlist John` (Filter debt by name) |
| **License Plate** | `/bsx` | `/bsx 29A12345 John Doe` |
| **Tools** | `/qr` | `/qr Content to encode` |
| **Translation** | `/dich` | `/dich Hello world` |
| **Day Counter** | `/demngay` | `/demngay 01/01/2026` |

---
**Important Note**: Never share the script file containing your actual Token. Always use the `setupEnvironment` function to save configurations and clear sensitive data from the code before making it public.

