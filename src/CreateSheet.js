/**
 * Chỉ dùng khi bot không thể tự tạo bảng, hệ thống dự phòng
 * Dùng để tụe độngt ảo các bảng nếu mã nguồn bot bị lỗi
 * 
 * Hàm setup bảng Thu Chi chuyên nghiệp
 * Chức năng: Tạo sheet, header, định dạng cột tiền tệ, ngày giờ và tự động STT
 */
function createFinanceSheet() {
  // 1. Lấy thông tin Spreadsheet (Dùng lại hàm getConfig ở bài trước)
  const config = getConfig(); 
  if (!config.ssId) {
    Logger.log("❌ Lỗi: Chưa có ID Spreadsheet. Hãy chạy setupEnvironment() trước.");
    return;
  }
  
  const ss = SpreadsheetApp.openById(config.ssId);
  const sheetName = "Thu Chi";
  
  // 2. Kiểm tra xem sheet đã tồn tại chưa
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    Logger.log("⚠️ Sheet '" + sheetName + "' đã tồn tại. Tôi sẽ không ghi đè để tránh mất dữ liệu cũ.");
    return;
  }

  // 3. Nếu chưa có thì tạo mới
  sheet = ss.insertSheet(sheetName);
  
  // 4. Danh sách các cột tiêu đề
  const headers = [
    "STT",                        // Cột A
    "Thời Gian (Giờ:Phút:Giây)",  // Cột B
    "Ngày",                       // Cột C
    "Thực Hiện Bởi",              // Cột D
    "Số Tiền Xử Lí",              // Cột E
    "Tổng Số Dư",                 // Cột F
    "Ghi Chú"                     // Cột G
  ];

  // 5. Ghi Header vào dòng 1
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // =======================================================
  // PHẦN FORMAT CHUYÊN NGHIỆP (Make it look Professional)
  // =======================================================

  // A. Format giao diện Header
  headerRange.setFontWeight("bold");              // In đậm
  headerRange.setBackground("#4a86e8");           // Màu nền xanh dương (dễ nhìn)
  headerRange.setFontColor("white");              // Chữ trắng
  headerRange.setHorizontalAlignment("center");   // Căn giữa
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);                      // Tăng chiều cao dòng tiêu đề
  sheet.setFrozenRows(1);                         // Đóng băng dòng tiêu đề (khi cuộn không bị mất)

  // B. Format định dạng dữ liệu (Quan trọng)
  
  // Cột B: Thời gian (Giờ:Phút:Giây)
  sheet.getRange("B2:B").setNumberFormat("HH:mm:ss");
  
  // Cột C: Ngày (dd/MM/yyyy)
  sheet.getRange("C2:C").setNumberFormat("dd/MM/yyyy");
  
  // Cột E và F: Số tiền (Có dấu phân cách ngàn, không số thập phân) -> Ví dụ: 100,000
  sheet.getRange("E2:F").setNumberFormat("#,##0"); 

  // C. Tự động hóa cột STT (Cột A)
 
  // D. Chỉnh độ rộng cột cho đẹp
  sheet.setColumnWidth(1, 50);  // STT nhỏ thôi
  sheet.setColumnWidth(2, 100); // Thời gian
  sheet.setColumnWidth(3, 100); // Ngày
  sheet.setColumnWidth(4, 150); // Người thực hiện (dài chút)
  sheet.setColumnWidth(5, 120); // Số tiền
  sheet.setColumnWidth(6, 120); // Tổng dư
  sheet.setColumnWidth(7, 200); // Ghi chú (dài nhất)

  Logger.log("✅ Đã tạo và format sheet 'Thu Chi' thành công!");
}