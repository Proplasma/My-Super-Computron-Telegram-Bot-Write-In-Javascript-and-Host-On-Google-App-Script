/**
 * ============================================================================
 * ⚠️ LƯU Ý QUAN TRỌNG CHO NGƯỜI MỚI:
 * 1. Cột F (Link Ảnh) trong Sheet bắt buộc phải là LINK ẢNH TRỰC TIẾP.
 * -> Link đúng thường có đuôi: .jpg, .png, .jpeg
 * -> KHÔNG dùng link Google Drive (trừ khi đã chuyển đổi).
 * -> KHÔNG dùng link trang web chứa ảnh.
 * 2. Tên Sheet bên dưới phải trùng khớp 100% với tên tab trong Google Sheet.
 * ============================================================================
 */

/**
 * ============================================================================
 * ⚠️ LƯU Ý QUAN TRỌNG (ĐỌC KỸ TRƯỚC KHI DÙNG):
 * 1. Cột F (Link Ảnh) trong Google Sheet phải là LINK ẢNH TRỰC TIẾP (.jpg, .png).
 * -> KHÔNG PHẢI địa chỉ liên kết trang web.
 * -> KHÔNG PHẢI link Google Drive (trừ khi đã convert sang direct link).
 * -> Cách test: Copy link đó dán vào tab mới, nếu chỉ hiện mỗi cái ảnh là ĐÚNG.
 * * 2. Tên Sheet dữ liệu phải chính xác là "GenWebCode".
 * ============================================================================
 */

// Cấu hình tên Sheet cần lấy dữ liệu
var SHEET_NAME = "GenWebCode"; 

function doGet(e) {
  try {
    // --- BƯỚC 1: LẤY THAM SỐ TỪ URL ---
    // Lấy số dòng từ link (Ví dụ: .../exec?row=2)
    var row = e.parameter.row;
    
    // Nếu không có tham số row, báo lỗi hướng dẫn
    if (!row) return HtmlService.createHtmlOutput("<h3>Lỗi: Thiếu tham số dòng (?row=...)</h3>");

    // --- BƯỚC 2: KẾT NỐI GOOGLE SHEET ---
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // Nếu không tìm thấy tab Sheet tên là "GenWebCode"
    if (!sheet) return HtmlService.createHtmlOutput("<h3>Lỗi: Không tìm thấy Sheet có tên '" + SHEET_NAME + "'</h3>");

    // --- BƯỚC 3: LẤY DỮ LIỆU TỪ CỘT C ĐẾN F ---
    // Cấu trúc: getRange(dòng, cột_bắt_đầu, số_dòng_lấy, số_cột_lấy)
    // Cột C là cột thứ 3. Ta lấy 1 dòng và 4 cột (C, D, E, F)
    var dataRange = sheet.getRange(row, 3, 1, 4); 
    var data = dataRange.getValues()[0];

    // Gán dữ liệu vào biến (Mảng bắt đầu từ 0)
    var sttMa       = data[0]; // Cột C: STT
    var maVoucher   = data[1]; // Cột D: Mã Voucher (Dùng để tạo QR)
    var soTien      = data[2]; // Cột E: Số Tiền
    var linkAnh     = data[3]; // Cột F: Link Ảnh (Quan trọng)

    // --- BƯỚC 4: XỬ LÝ DỮ LIỆU ---
    // Format số tiền sang dạng Tiền Việt (Ví dụ: 100000 -> 100.000 ₫)
    var hienThiTien = soTien; 
    if (typeof soTien === 'number') {
       hienThiTien = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(soTien);
    }

    // Tạo Link API tạo mã QR (Dùng API qrserver)
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + maVoucher;
    
    // Tạo Link API tạo mã Barcode chuẩn Code128 (Dùng API bwip-js)
    var barcodeUrl = "https://bwipjs-api.metafloor.com/?bcid=code128&text=" + maVoucher + "&scale=2&height=10&includetext"; 

    // --- BƯỚC 5: TRUYỀN DỮ LIỆU SANG FILE HTML ---
    var template = HtmlService.createTemplateFromFile('index');
    
    // Đẩy các biến sang bên giao diện
    template.soTien     = hienThiTien;
    template.maVoucher  = maVoucher;
    template.qrUrl      = qrUrl;      // Link ảnh QR tự tạo
    template.barcodeUrl = barcodeUrl; // Link ảnh Barcode tự tạo
    template.linkAnh    = linkAnh;    // Link ảnh lấy từ Sheet

    // --- BƯỚC 6: TRẢ VỀ TRANG WEB HOÀN CHỈNH ---
    return template.evaluate()
        .setTitle('Voucher: ' + maVoucher) // Đặt tiêu đề cho Tab trình duyệt
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, user-scalable=1'); // Hỗ trợ mobile

  } catch (error) {
    // Báo lỗi hệ thống nếu có gì sai sót
    return HtmlService.createHtmlOutput("Lỗi hệ thống: " + error.toString());
  }
}
