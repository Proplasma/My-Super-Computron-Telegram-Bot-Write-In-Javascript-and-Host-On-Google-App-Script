/**
  * ============================================================================
 * PHẦN 1: CẤU HÌNH (SETUP) - v29
 * ============================================================================
 */

function AutoSetUpBot() {
  setupEnvironment();
  setWebhook();
}

/**
 * QUAN TRỌNG: Chỉ chạy hàm này MỘT LẦN sau khi thay thông tin bên dưới.
 * Sau khi chạy xong, hãy xóa các giá trị nhạy cảm trong file này trước khi share.
 */
function setupEnvironment() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'BOT_TOKEN': 'YOUR_BOT_TOKEN_HERE',       // Nhận từ @BotFather
    'SHEET_ID': 'YOUR_SPREADSHEET_ID_HERE',    // ID của Google Sheet
    'WEBAPP_URL': 'YOUR_WEBAPP_URL_HERE'      // URL sau khi Deploy Web App
  });
  Logger.log("✅ Đã lưu cấu hình vào Script Properties.");
}

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    token: props.getProperty('BOT_TOKEN'),
    ssId: props.getProperty('SHEET_ID'),
    webAppUrl: props.getProperty('WEBAPP_URL'),
    lastChatId: props.getProperty('LAST_CHAT_ID') // Lấy ID chat gần nhất để gửi thông báo tự động
  };
}

function getTelegramUrl() {
  return "https://api.telegram.org/bot" + getConfig().token;
}

/**
 * ============================================================================
 * PHẦN 2: CÁC HÀM GỬI TIN NHẮN (TEXT & PHOTO & AUDIO)
 * ============================================================================
 */

// Gửi tin nhắn văn bản
function sendText(chatId, text) {
  const url = getTelegramUrl() + "/sendMessage?chat_id=" + chatId + "&text=" + encodeURIComponent(text) + "&parse_mode=HTML";
  try { UrlFetchApp.fetch(url); } catch (e) { Logger.log("Lỗi sendText: " + e); }
}

// Gửi hình ảnh
function sendPhoto(chatId, photoUrl, caption) {
  try {
    var imageBlob = UrlFetchApp.fetch(photoUrl).getBlob();
    var url = getTelegramUrl() + "/sendPhoto";
    var payload = {
      'chat_id': chatId + "",
      'photo': imageBlob,
      'caption': caption
    };
    var options = {
      'method': 'post',
      'payload': payload,
      'muteHttpExceptions': true
    };
    UrlFetchApp.fetch(url, options);
  } catch (e) { 
    Logger.log("Lỗi sendPhoto: " + e); 
    sendText(chatId, "❌ Có lỗi khi gửi ảnh: " + e.toString());
  }
}

// Gửi Audio (Voice)
function sendAudio(chatId, audioBlob, caption) {
  try {
    var url = getTelegramUrl() + "/sendAudio";
    var payload = {
      'chat_id': chatId + "",
      'audio': audioBlob,
      'caption': caption
    };
    var options = {
      'method': 'post',
      'payload': payload,
      'muteHttpExceptions': true
    };
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Lỗi sendAudio: " + e);
    sendText(chatId, "❌ Không thể gửi giọng nói.");
  }
}

/**
 * ============================================================================
 * PHẦN 3: MODULE LOG MESSAGE (NHẬT KÝ CHAT)
 * ============================================================================
 */
function createLogSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  if (ss.getSheetByName("Log Message")) return;
  const sheet = ss.insertSheet("Log Message");
  sheet.appendRow(["Time", "Ngày", "User", "Nội Dung"]);
  sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#ccc");
  sheet.setFrozenRows(1);
  sheet.getRange("A2:A").setNumberFormat("HH:mm:ss");
  sheet.getRange("B2:B").setNumberFormat("dd/MM/yyyy");
}

function saveLog(user, text) {
  try {
    const ss = SpreadsheetApp.openById(getConfig().ssId);
    let sheet = ss.getSheetByName("Log Message");
    if (!sheet) { createLogSheet(); sheet = ss.getSheetByName("Log Message"); }
    const now = new Date();
    sheet.appendRow([now, now, user, text]);
  } catch (e) {}
}

/**
 * ============================================================================
 * PHẦN 4: MODULE GENERATOR (QR & BARCODE)
 * ============================================================================
 */

function createGenSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheetName = "GenQRBarCode";
  if (ss.getSheetByName(sheetName)) return;

  const sheet = ss.insertSheet(sheetName);
  const headers = ["Time", "User", "Loại", "Nội Dung", "Ảnh Preview (Link)"];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#f1c232").setHorizontalAlignment("center");
  
  sheet.setFrozenRows(1);
  sheet.getRange("A2:A").setNumberFormat("dd/MM/yyyy HH:mm:ss");
  sheet.setDefaultRowHeight(100); 
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 150);
}

function logGenRequest(user, type, content, imageUrl) {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  let sheet = ss.getSheetByName("GenQRBarCode");
  if (!sheet) { createGenSheet(); sheet = ss.getSheetByName("GenQRBarCode"); }
  const now = new Date();
  sheet.appendRow([now, user, type, content, `=IMAGE("${imageUrl}")`]);
}

/**
 * ============================================================================
 * PHẦN 5: MODULE TÀI CHÍNH (THU CHI & LƯƠNG CỦA BÀ)
 * ============================================================================
 */

function createFinanceSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  if (ss.getSheetByName("Thu Chi")) return;
  const sheet = ss.insertSheet("Thu Chi");
  // [UPDATE] Thêm cột Hình Ảnh Bill
  const headers = ["STT", "Thời Gian", "Ngày", "Người Thực Hiện", "Số Tiền", "Tổng Số Dư", "Ghi Chú", "Hình Ảnh Bill"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#2c3e50").setFontColor("white");
  sheet.setFrozenRows(1);
  sheet.getRange("B2:B").setNumberFormat("HH:mm:ss");
  sheet.getRange("C2:C").setNumberFormat("dd/MM/yyyy");
  sheet.getRange("E2:F").setNumberFormat("#,##0"); 
  sheet.getRange("A2").setFormula('=IFERROR(ARRAYFORMULA(IF(C2:C<>"",ROW(C2:C)-1,"")),"")');
}

// [UPDATE] Thêm tham số billUrl
function logTransaction(user, amount, note, billUrl = "") {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  let sheet = ss.getSheetByName("Thu Chi");
  if (!sheet) { createFinanceSheet(); sheet = ss.getSheetByName("Thu Chi"); }

  const now = new Date();
  const nextRow = sheet.getLastRow() + 1; 
  const formula = `=N(F${nextRow - 1}) + E${nextRow}`; 

  // [UPDATE] Ghi thêm cột billUrl
  sheet.appendRow(["", now, now, user, amount, formula, note, billUrl]);
   SpreadsheetApp.flush();
  return sheet.getRange(sheet.getLastRow(), 6).getValue();
}

function createLCBSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  if (ss.getSheetByName("Lương Của Bà")) return; 
  
  const sheet = ss.insertSheet("Lương Của Bà");
  // [UPDATE] Thêm cột Hình Ảnh Bill
  const headers = ["STT", "Thời Gian", "Ngày", "Người Thực Hiện", "Số Tiền", "Tổng Số Dư", "Ghi Chú", "Hình Ảnh Bill"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#8e44ad").setFontColor("white");
  sheet.setFrozenRows(1);
  sheet.getRange("B2:B").setNumberFormat("HH:mm:ss");
  sheet.getRange("C2:C").setNumberFormat("dd/MM/yyyy");
  sheet.getRange("E2:F").setNumberFormat("#,##0"); 
  sheet.getRange("A2").setFormula('=IFERROR(ARRAYFORMULA(IF(C2:C<>"",ROW(C2:C)-1,"")),"")');
}

// [UPDATE] Thêm tham số billUrl
function logLCBTransaction(user, amount, note, billUrl = "") {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  let sheet = ss.getSheetByName("Lương Của Bà");
  if (!sheet) { createLCBSheet(); sheet = ss.getSheetByName("Lương Của Bà"); }

  const now = new Date();
  const nextRow = sheet.getLastRow() + 1; 
  const formula = `=N(F${nextRow - 1}) + E${nextRow}`;

  // [UPDATE] Ghi thêm cột billUrl
  sheet.appendRow(["", now, now, user, amount, formula, note, billUrl]);
  SpreadsheetApp.flush();
  return sheet.getRange(sheet.getLastRow(), 6).getValue();
}

/**
 * ============================================================================
 * PHẦN 6: MODULE GOOGLE DRIVE (AUTO UPLOAD)
 * ============================================================================
 */

function getTelegramImageFolder() {
  const folderName = "TelegramImage";
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

function uploadPhotoToDrive(fileId, caption) {
  try {
    const token = getConfig().token;
    const response = UrlFetchApp.fetch(getTelegramUrl() + "/getFile?file_id=" + fileId);
    const json = JSON.parse(response.getContentText());
    
    if (!json.ok) return null;
    
    const filePath = json.result.file_path;
    const fileUrl = "https://api.telegram.org/file/bot" + token + "/" + filePath;
    const blob = UrlFetchApp.fetch(fileUrl).getBlob();
    
    let fileName;
    if (caption) {
      const cleanCaption = caption.replace(/[^a-zA-Z0-9-_ àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựýỳỵỷỹ]/g, "_"); 
      fileName = cleanCaption + ".jpg";
    } else {
      fileName = "IMG_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
    }
    blob.setName(fileName);
    
    const folder = getTelegramImageFolder();
    const file = folder.createFile(blob);
    return file.getUrl(); 
  } catch (e) {
    Logger.log("Lỗi upload Drive: " + e);
    return null;
  }
}

/**
 * ============================================================================
 * PHẦN 7: MODULE FAKE VOUCHER (GENWEBCODE)
 * ============================================================================
 */

function createGenWebCodeSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheetName = "GenWebCode";
  if (ss.getSheetByName(sheetName)) return;

  const sheet = ss.insertSheet(sheetName);
  const headers = ["Time", "User", "STT Mã", "Mã Voucher", "Số Tiền", "Link Ảnh", "Link Triển Khai Mã"];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#e67e22").setFontColor("white")
    .setHorizontalAlignment("center");
  
  sheet.setFrozenRows(1);
  sheet.getRange("A2:A").setNumberFormat("dd/MM/yyyy HH:mm:ss");
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(6, 200);
  sheet.setColumnWidth(7, 300);
}

function logFakeVoucher(user, sttMa, maVoucher, soTien, linkAnh) {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  let sheet = ss.getSheetByName("GenWebCode");
  if (!sheet) { createGenWebCodeSheet(); sheet = ss.getSheetByName("GenWebCode"); }
  const now = new Date();
  const formulaLink = '=CoreBotInfor!B1 & "?row=" & ROW()';
  sheet.appendRow([now, user, sttMa, maVoucher, soTien, linkAnh, formulaLink]);
  SpreadsheetApp.flush();
  return sheet.getRange(sheet.getLastRow(), 7).getValue();
}

/**
 * ============================================================================
 * PHẦN 9: MODULE QUẢN LÝ BIỂN SỐ XE (BSX)
 * ============================================================================
 */

function createBSXSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheetName = "Biển Số Xe";
  if (ss.getSheetByName(sheetName)) return;

  const sheet = ss.insertSheet(sheetName);
  const headers = ["Thời Gian", "Người Nhập", "Biển Số", "Tên Chủ Xe"];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#3498db").setFontColor("white")
    .setHorizontalAlignment("center");
  
  sheet.setFrozenRows(1);
  sheet.getRange("A2:A").setNumberFormat("dd/MM/yyyy HH:mm:ss");
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 250);
}

function xuLyBienSoXe(chatId, userTelegram, noiDung) {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  let sheet = ss.getSheetByName("Biển Số Xe");
  if (!sheet) { createBSXSheet(); sheet = ss.getSheetByName("Biển Số Xe"); }

  const mangThongTin = noiDung.trim().split(" ");
  
  if (mangThongTin.length === 0 || noiDung.trim() === "") {
    sendText(chatId, "⚠️ Vui lòng nhập thông tin. Ví dụ:\n- Tìm: /bsx 29S12345\n- Thêm: /bsx 29S12345 Nguyễn Văn A");
    return;
  }

  const bienSo = mangThongTin[0];
  
  // TRƯỜNG HỢP 1: THÊM MỚI
  if (mangThongTin.length > 1) {
    const tenChuXe = mangThongTin.slice(1).join(" ");
    const now = new Date();
    sheet.appendRow([now, userTelegram, bienSo, tenChuXe]);
    sendText(chatId, `✅ <b>Đã thêm biển số xe!</b>\n\n🚗 Biển: <code>${bienSo}</code>\n👤 Tên: ${tenChuXe}`);
  } 
  
  // TRƯỜNG HỢP 2: TÌM KIẾM
  else {
    const data = sheet.getDataRange().getValues();
    let ketQua = [];
    const tuKhoa = bienSo.toUpperCase();

    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      let rowBienSo = String(row[2]).toUpperCase();
      if (rowBienSo === tuKhoa || (tuKhoa.length > 3 && rowBienSo.includes(tuKhoa))) {
        ketQua.push(row);
      }
    }

    if (ketQua.length > 0) {
      let msg = `🔍 <b>Tìm thấy ${ketQua.length} kết quả:</b>\n`;
      for (let k = 0; k < ketQua.length; k++) {
        let timeStr = Utilities.formatDate(new Date(ketQua[k][0]), "GMT+7", "dd/MM/yyyy HH:mm:ss");
        msg += `----------------\n`;
        msg += `🚗 <b>${ketQua[k][2]}</b>\n`;
        msg += `👤 ${ketQua[k][3]}\n`;
        msg += `🕒 ${timeStr}\n`;
      }
      sendText(chatId, msg);
    } else {
      sendText(chatId, `❌ Không tìm thấy thông tin cho biển số: ${bienSo}`);
    }
  }
}

/**
 * ============================================================================
 * PHẦN 10: MODULE GHI NỢ (CẦN ĐÒI NỢ)
 * ============================================================================
 */

function createDebtSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheetName = "Cần Đòi Nợ";
  if (ss.getSheetByName(sheetName)) return;

  const sheet = ss.insertSheet(sheetName);
  const headers = ["STT", "Thời Gian", "Ngày", "Người Ghi", "Người Nợ", "Số Tiền", "Ghi Chú"];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#c0392b").setFontColor("white")
    .setHorizontalAlignment("center");
  
  sheet.setFrozenRows(1);
  sheet.getRange("B2:B").setNumberFormat("HH:mm:ss");
  sheet.getRange("C2:C").setNumberFormat("dd/MM/yyyy");
  sheet.getRange("F2:F").setNumberFormat("#,##0"); 
  sheet.getRange("A2").setFormula('=IFERROR(ARRAYFORMULA(IF(C2:C<>"",ROW(C2:C)-1,"")),"")');
}

function logDebt(user, amount, debtor, note) {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  let sheet = ss.getSheetByName("Cần Đòi Nợ");
  if (!sheet) { createDebtSheet(); sheet = ss.getSheetByName("Cần Đòi Nợ"); }

  const now = new Date();
  sheet.appendRow(["", now, now, user, debtor, amount, note]);
  SpreadsheetApp.flush();
}

/**
 * ============================================================================
 * PHẦN 11: MODULE SUPER VOUCHER (QUẢN LÝ MÃ GIẢM GIÁ)
 * ============================================================================
 */

function createVoucherSheet() {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheetName = "Super Voucher";
  if (ss.getSheetByName(sheetName)) return;

  const sheet = ss.insertSheet(sheetName);
  // Thêm cột "Trạng Thái" để quản lý đã dùng hay chưa
  const headers = ["Thời Gian", "Người Nhập", "Giá Trị", "Mã Voucher", "Hạn SD", "Nhãn Hàng", "Trạng Thái"];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#16a085").setFontColor("white")
    .setHorizontalAlignment("center");
  
  sheet.setFrozenRows(1);
  sheet.getRange("A2:A").setNumberFormat("dd/MM/yyyy HH:mm:ss");
  sheet.getRange("E2:E").setNumberFormat("dd/MM/yyyy"); // Định dạng cột Hạn SD
  sheet.setColumnWidth(4, 150); // Mã
  sheet.setColumnWidth(6, 150); // Brand
}

// Hàm thêm Voucher mới
function addVoucher(user, value, code, dateStr, brand) {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  let sheet = ss.getSheetByName("Super Voucher");
  if (!sheet) { createVoucherSheet(); sheet = ss.getSheetByName("Super Voucher"); }

  const now = new Date();
  
  // Parse ngày từ chuỗi dd/mm/yyyy
  const parts = dateStr.split("/");
  if(parts.length !== 3) return false;
  
  const expiryDate = new Date(parts[2], parts[1] - 1, parts[0]); // yyyy, mm-1, dd
  
  sheet.appendRow([now, user, value, code, expiryDate, brand, "Active"]); // Mặc định là Active
  return true;
}

// Hàm đổi trạng thái sang đã dùng
function markVoucherUsed(chatId, code) {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheet = ss.getSheetByName("Super Voucher");
  if (!sheet) {
    sendText(chatId, "❌ Chưa có dữ liệu Voucher.");
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  // Duyệt ngược để tìm mã mới nhất nếu có trùng
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][3]).trim() === String(code).trim() && data[i][6] === "Active") {
      sheet.getRange(i + 1, 7).setValue("Used"); // Cập nhật cột G (cột 7)
      sendText(chatId, `✅ Đã đánh dấu mã <b>${code}</b> là ĐÃ SỬ DỤNG.`);
      found = true;
      break; 
    }
  }
  
  if (!found) {
    sendText(chatId, `⚠️ Không tìm thấy mã <b>${code}</b> hoặc mã đã được sử dụng.`);
  }
}

// Hàm kiểm tra voucher sắp hết hạn (Cho lệnh /checkvoucher)
function checkExpiringVouchers(chatId) {
  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheet = ss.getSheetByName("Super Voucher");
  if (!sheet) {
    sendText(chatId, "📂 Danh sách Voucher trống.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let list = [];

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let expiry = new Date(row[4]);
    expiry.setHours(0,0,0,0);
    let status = row[6];

    if (status === "Active") {
      let diffTime = expiry - today;
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Lấy những mã còn hạn hoặc hết hạn nhưng chưa quá lâu, và dưới 14 ngày
      if (diffDays <= 14) {
        list.push({
          val: row[2],
          code: row[3],
          date: row[4],
          brand: row[5],
          days: diffDays
        });
      }
    }
  }

  // Sắp xếp theo ngày hết hạn tăng dần (gần hết hạn lên đầu)
  list.sort((a, b) => a.days - b.days);

  if (list.length === 0) {
    sendText(chatId, "✅ Không có Voucher nào sắp hết hạn (trong 2 tuần tới).");
  } else {
    let msg = "🎫 <b>DANH SÁCH VOUCHER SẮP HẾT HẠN</b>\n\n";
    let limit = Math.min(list.length, 20); // Tối đa 20 mã
    
    for (let k = 0; k < limit; k++) {
      let v = list[k];
      let dateStr = Utilities.formatDate(new Date(v.date), "GMT+7", "dd/MM/yyyy");
      let icon = v.days < 0 ? "💀" : (v.days <= 3 ? "🔴" : "🟡");
      let statusText = v.days < 0 ? `Đã quá hạn ${Math.abs(v.days)} ngày` : `Còn ${v.days} ngày`;
      
      msg += `${icon} <b>${v.brand}</b> (${v.val})\n`;
      msg += `   Code: <code>${v.code}</code>\n`;
      msg += `   Hạn: ${dateStr} (${statusText})\n\n`;
    }
    sendText(chatId, msg);
  }
}

// --- HÀM TRIGGER TỰ ĐỘNG (AUTO SCAN) ---
// Chạy hàm này bằng Time-Driven Trigger (Ví dụ: 8h sáng hàng ngày)
function autoScanVoucherExpiry() {
  // Lấy Chat ID đã lưu lần cuối cùng tương tác để gửi báo cáo
  const targetChatId = getConfig().lastChatId;
  if (!targetChatId) {
    Logger.log("Chưa có Chat ID để gửi báo cáo.");
    return;
  }

  const ss = SpreadsheetApp.openById(getConfig().ssId);
  const sheet = ss.getSheetByName("Super Voucher");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let reportMsg = "";
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let expiry = new Date(row[4]);
    expiry.setHours(0,0,0,0);
    let status = row[6];
    let brand = row[5];
    let code = row[3];

    if (status === "Active") {
      let diffTime = expiry - today;
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Logic báo: 1 tháng (30 ngày), 2 tuần (14 ngày), 1 tuần (7 ngày), 1 ngày
      if ([30, 14, 7, 1].includes(diffDays)) {
        reportMsg += `⏰ <b>${brand}</b> - Còn ${diffDays} ngày\n   Code: <code>${code}</code>\n`;
        count++;
      }
    }
  }

  if (count > 0) {
    sendText(targetChatId, `🔔 <b>NHẮC NHỞ HẠN VOUCHER</b>\nCó ${count} mã cần lưu ý hôm nay:\n\n${reportMsg}\n👉 Dùng lệnh /checkvoucher để xem chi tiết.`);
  }
}

/**
 * ============================================================================
 * PHẦN 8: LOGIC BOT (MAIN)
 * ============================================================================
 */
function setWebhook() {
  const url = getTelegramUrl() + "/setWebhook?url=" + getConfig().webAppUrl;
  Logger.log(UrlFetchApp.fetch(url).getContentText());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.message) return;

    const chatId = data.message.chat.id;
    const name = (data.message.chat.first_name + " " + (data.message.chat.last_name || "")).trim();

    // --- [NEW] LƯU CHAT ID ĐỂ DÙNG CHO AUTO TRIGGER ---
    PropertiesService.getScriptProperties().setProperty('LAST_CHAT_ID', String(chatId));

    sendText(chatId, "⏳ Loading...");
    
    let text = data.message.text || data.message.caption || "";
    const photoArray = data.message.photo;

    // 1. GHI LOG 
    let logContent = text;
    if (photoArray) { logContent = "[HÌNH ẢNH] " + logContent; }
    saveLog(name, logContent);

    // 2. PHÂN LOẠI LỆNH
    
    // --- [UPDATE] XỬ LÝ ẢNH (UPLOAD & BILL) ---
    let uploadedPhotoUrl = "";
    if (photoArray) {
      const largestPhoto = photoArray[photoArray.length - 1];
      const fileId = largestPhoto.file_id;
      uploadedPhotoUrl = uploadPhotoToDrive(fileId, text); 
      
      // Nếu có ảnh nhưng KHÔNG phải là lệnh Thu Chi (/c, /lcb), thì báo đã lưu ảnh và dừng.
      // Nếu là lệnh Thu Chi, thì tiếp tục chạy xuống dưới để ghi sổ với link ảnh.
      const isBillCommand = text.toLowerCase().startsWith("/c ") || text.toLowerCase().startsWith("/lcb ");

      if (!isBillCommand) {
        if (uploadedPhotoUrl) {
          sendText(chatId, `✅ <b>Đã lưu ảnh!</b>\n📂 TelegramImage\n🔗 <a href="${uploadedPhotoUrl}">Xem Drive</a>`);
        } else {
          sendText(chatId, "❌ Lỗi lưu ảnh.");
        }
        return; 
      }
    }

    const command = text.toLowerCase();

    // --- [FEATURE 1] VẼ BIỂU ĐỒ (/chart, /bieudo) ---
    if (command === "/chart" || command === "/bieudo") {
      const ss = SpreadsheetApp.openById(getConfig().ssId);
      const sheet = ss.getSheetByName("Thu Chi");
      if (!sheet) {
        sendText(chatId, "❌ Chưa có dữ liệu 'Thu Chi'.");
      } else {
        const data = sheet.getDataRange().getValues();
        let tongThu = 0, tongChi = 0;
        for (let i = 1; i < data.length; i++) {
          let soTien = parseInt(data[i][4]); 
          if (!isNaN(soTien)) {
            if (soTien > 0) tongThu += soTien; else tongChi += Math.abs(soTien);
          }
        }
        if (tongThu === 0 && tongChi === 0) {
          sendText(chatId, "⚠️ Chưa có dữ liệu.");
        } else {
          const chartConfig = {
            type: 'pie',
            data: {
              labels: ['Tổng Thu', 'Tổng Chi'],
              datasets: [{ data: [tongThu, tongChi], backgroundColor: ['#2ecc71', '#e74c3c'] }]
            },
            options: { plugins: { datalabels: { color: 'white', font: { weight: 'bold', size: 20 } } } }
          };
          const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`;
          sendPhoto(chatId, chartUrl, `📊 <b>BÁO CÁO TÀI CHÍNH</b>\n🟢 Thu: ${tongThu.toLocaleString()}\n🔴 Chi: ${tongChi.toLocaleString()}`);
        }
      }
    }

    // --- [FEATURE 2] RANDOM QUYẾT ĐỊNH (/random) ---
    else if (command.startsWith("/random ")) {
      const luaChon = text.substring(8).split(",");
      if (luaChon.length < 2) {
        sendText(chatId, "⚠️ Nhập ít nhất 2 lựa chọn cách nhau bởi dấu phẩy.\nVí dụ: /random Cơm, Phở");
      } else {
        const result = luaChon[Math.floor(Math.random() * luaChon.length)].trim();
        sendText(chatId, `🎲 <b>KẾT QUẢ:</b>\n\n🎉 <b>${result}</b> 🎉`);
      }
    }

    // --- [FEATURE 3] GOOGLE TRANSLATE (/dich, /translate) ---
    else if (command.startsWith("/dich ") || command.startsWith("/translate ")) {
      var content = text.split(" ").slice(1).join(" ");
      if (content) {
        try {
          var translated = LanguageApp.translate(content, 'auto', 'vi');
          if (translated.toLowerCase() === content.toLowerCase()) {
             translated = LanguageApp.translate(content, 'auto', 'en');
          }
          sendText(chatId, "🔤 <b>Dịch:</b> " + translated);
        } catch (e) { sendText(chatId, "❌ Lỗi dịch."); }
      }
    }

    // --- [FEATURE 4] VOICE - CHUYỂN TEXT THÀNH GIỌNG NÓI (/noi, /voice) ---
    else if (command.startsWith("/noi ") || command.startsWith("/voice ")) {
      var content = text.split(" ").slice(1).join(" ");
      if (content) {
        var ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=" + encodeURIComponent(content);
        var blob = UrlFetchApp.fetch(ttsUrl).getBlob().setName("voice.mp3");
        sendAudio(chatId, blob, "🗣 <b>Bot nói:</b> " + content);
      }
    }

    // --- [FEATURE 5] ĐẾM NGÀY (/demngay, /countday) ---
    else if (command.startsWith("/demngay ") || command.startsWith("/countday ")) {
      var dateStr = text.split(" ")[1]; // Lấy phần ngày
      // Regex check dd/mm/yyyy
      var dateParts = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      
      if (dateParts) {
        var day = parseInt(dateParts[1], 10);
        var month = parseInt(dateParts[2], 10) - 1; // Tháng trong JS bắt đầu từ 0
        var year = parseInt(dateParts[3], 10);
        var targetDate = new Date(year, month, day);
        var today = new Date();
        
        // Reset giờ về 0 để tính chính xác số ngày
        targetDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        
        var diffTime = today - targetDate;
        var diffDays = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
        
        if (diffTime > 0) {
          sendText(chatId, `📆 Từ <b>${dateStr}</b> đến nay đã trôi qua:\n👉 <b>${diffDays} ngày</b>`);
        } else if (diffTime < 0) {
          sendText(chatId, `⏳ Còn <b>${diffDays} ngày</b> nữa là đến <b>${dateStr}</b>`);
        } else {
          sendText(chatId, `🎉 Hôm nay chính là ngày <b>${dateStr}</b>!`);
        }
      } else {
        sendText(chatId, "⚠️ Sai định dạng ngày. Vui lòng nhập: dd/MM/yyyy\nVí dụ: /demngay 01/01/2025");
      }
    }

    // --- [NEW FEATURE] SUPER VOUCHER ---
    
    // 1. Thêm Voucher: /voucher [Value] [Code] [Date] [Brand]
    else if (command.startsWith("/voucher ")) {
      const parts = text.split(" ");
      // Cấu trúc mong đợi: /voucher [1:Value] [2:Code] [3:Date] [4...:Brand]
      if (parts.length >= 5) {
        const val = parts[1];
        const code = parts[2];
        const dateStr = parts[3];
        const brand = parts.slice(4).join(" ");
        
        const success = addVoucher(name, val, code, dateStr, brand);
        if (success) {
          sendText(chatId, `✅ <b>Đã thêm Voucher!</b>\n\n🔖 <b>${brand}</b>\n💰 Trị giá: ${val}\n🔢 Code: <code>${code}</code>\n📅 Hạn: ${dateStr}`);
        } else {
          sendText(chatId, "⚠️ Lỗi ngày tháng. Hãy nhập đúng định dạng dd/mm/yyyy");
        }
      } else {
        sendText(chatId, "⚠️ Sai cú pháp.\nVD: /voucher 50k UB123 12/02/2025 Circle K");
      }
    }

    // 2. Check Voucher sắp hết hạn
    else if (command === "/checkvoucher") {
      checkExpiringVouchers(chatId);
    }

    // 3. Đánh dấu đã dùng: /use [Code]
    else if (command.startsWith("/use ")) {
      const codeToUse = text.split(" ")[1];
      if (codeToUse) {
        markVoucherUsed(chatId, codeToUse);
      } else {
        sendText(chatId, "⚠️ Vui lòng nhập mã. VD: /use UB123");
      }
    }

    // --- CÁC LỆNH CŨ (BSX, QR, THU CHI...) ---

    else if (command.startsWith("/bsx ")) {
      xuLyBienSoXe(chatId, name, text.substring(5));
    }

    else if (command.startsWith("/qr ")) {
      const content = text.substring(4).trim();
      if (content) {
        const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(content)}&size=300`;
        logGenRequest(name, "QR Code", content, qrUrl);
        sendPhoto(chatId, qrUrl, `✅ QR Code: "${content}"`);
      }
    }

    else if (command.startsWith("/qrdata ")) {
      const rawContent = text.substring(8).trim();
      if (rawContent) {
        const finalContent = "sms:5698?body=" + rawContent;
        const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(finalContent)}&size=300`;
        logGenRequest(name, "QR SMS Data", finalContent, qrUrl);
        sendPhoto(chatId, qrUrl, `✅ <b>QR SMS Data Created!</b>\n\nNội dung gốc:\n<code>${rawContent}</code>\n\nNội dung mã hóa:\n<code>${finalContent}</code>`);
      } else {
        sendText(chatId, "⚠️ Vui lòng nhập nội dung. Ví dụ: /qrdata NAPDATA 123456");
      }
    }
    
    else if (command.startsWith("/barcode ")) {
      const content = text.substring(9).trim();
      if (content) {
        const barUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(content)}&scale=3&rotate=N&includetext`;
        logGenRequest(name, "Barcode", content, barUrl);
        sendPhoto(chatId, barUrl, `✅ Barcode: "${content}"`);
      }
    }

    // --- [UPDATE] LỆNH THU CHI CÓ ẢNH BILL (/c) ---
    else if (command.startsWith("/c ")) {
      const match = text.match(/^\/c\s+([+\-]?[\d\.,]+)\s*(.*)/i);
      if (match) {
        let amount = parseInt(match[1].replace(/[\.,]/g, ""));
        let note = match[2] || "Không ghi chú";
        
        if (!isNaN(amount)) {
          // Gọi hàm với tham số uploadedPhotoUrl
          const bal = logTransaction(name, amount, note, uploadedPhotoUrl);
          
          const icon = amount >= 0 ? "🟢 THU" : "🔴 CHI";
          let msg = `[QUỸ CHUNG]\n${icon}: ${amount.toLocaleString()} đ\n📝 ${note}\n💰 Dư: ${bal.toLocaleString()} đ`;
          if (uploadedPhotoUrl) msg += `\n📎 <b>Đã đính kèm Bill</b>`;
          
          sendText(chatId, msg);
        }
      }
    }

    // --- [UPDATE] LỆNH LƯƠNG CỦA BÀ CÓ ẢNH BILL (/lcb) ---
    else if (command.startsWith("/lcb ")) {
      const match = text.match(/^\/lcb\s+([+\-]?[\d\.,]+)\s*(.*)/i);
      if (match) {
        let amount = parseInt(match[1].replace(/[\.,]/g, ""));
        let note = match[2] || "Không ghi chú";
        if (!isNaN(amount)) {
          // Gọi hàm với tham số uploadedPhotoUrl
          const bal = logLCBTransaction(name, amount, note, uploadedPhotoUrl);
          
          const icon = amount >= 0 ? "👵 THU" : "👵 CHI";
          let msg = `[LƯƠNG CỦA BÀ]\n${icon}: ${amount.toLocaleString()} đ\n📝 ${note}\n💰 Dư: ${bal.toLocaleString()} đ`;
          if (uploadedPhotoUrl) msg += `\n📎 <b>Đã đính kèm Bill</b>`;

          sendText(chatId, msg);
        }
      }
    }
    
    else if (command.startsWith("/fakevoucher ")) {
      const args = text.substring(12).trim().split(/\s+/);
      if (args.length >= 4) {
        const generatedLink = logFakeVoucher(name, args[0], args[1], args[2], args[3]);
        sendText(chatId, `✅ <b>Đã lưu Voucher!</b>\n📌 STT: ${args[0]}\n🎟 Mã: ${args[1]}\n💵 Tiền: ${args[2]}\n🌐 <b>Link:</b>\n${generatedLink}`);
      } else {
        sendText(chatId, "⚠️ Thiếu thông tin: /fakevoucher [STT] [Mã] [Tiền] [Link]");
      }
    }
    
    else if (command.startsWith("/teleforming")) {
      let rawContent = text.substring(12).trim();
      if (rawContent) {
        let lines = rawContent.split(/\r?\n/).filter(line => line.trim() !== "");
        let prefix = "";
        if (lines.length > 0 && lines[0].trim().startsWith('"') && lines[0].trim().endsWith('"')) {
          prefix = lines[0].trim().slice(1, -1);
          lines.shift();
        }
        for (let i = 0; i < lines.length; i++) {
          sendText(chatId, `<code>${prefix}${lines[i].trim()}</code>`);
          Utilities.sleep(50); 
        }
      }
    }

    else if (command.startsWith("/n ")) {
      const match = text.match(/^\/n\s+([\d\.,]+)\s+(\S+)\s*(.*)/i);
      if (match) {
        let amount = parseInt(match[1].replace(/[\.,]/g, ""));
        let debtor = match[2];
        let note = match[3] || "";
        
        if (!isNaN(amount)) {
          logDebt(name, amount, debtor, note);
          sendText(chatId, `📓 <b>ĐÃ GHI NỢ</b>\n\n👤 <b>${debtor}</b>\n💸 Số tiền: ${amount.toLocaleString()} đ\n📝 Ghi chú: ${note}`);
        } else {
          sendText(chatId, "❌ Số tiền không hợp lệ.");
        }
      } else {
          sendText(chatId, "⚠️ Cú pháp sai. Vui lòng nhập: /n [Tiền] [Tên] [Ghi Chú]\nVí dụ: /n 100.000 Phát Tiền ăn");
      }
    }

    // --- [UPDATE] LỆNH XEM DANH SÁCH NỢ (/nlist [Filter]) ---
    else if (command.startsWith("/nlist")) {
      const ss = SpreadsheetApp.openById(getConfig().ssId);
      const sheet = ss.getSheetByName("Cần Đòi Nợ");
      
      // Lấy từ khóa lọc (nếu có)
      const searchName = text.substring(6).trim().toLowerCase(); 

      if (!sheet || sheet.getLastRow() <= 1) {
        sendText(chatId, "📂 Danh sách nợ trống.");
      } else {
        const data = sheet.getDataRange().getValues();
        let msg = searchName 
                  ? `📓 <b>DANH SÁCH NỢ: ${searchName.toUpperCase()}</b>\n\n` 
                  : "📓 <b>DANH SÁCH CẦN ĐÒI NỢ</b>\n\n";
        
        let totalDebt = 0;
        let count = 0;
        let displayedItems = 0;

        for (let i = 1; i < data.length; i++) {
          let row = data[i];
          let debtor = row[4];
          let amount = parseInt(row[5]);
          let note = row[6] ? `(${row[6]})` : "";
          
          // [LOGIC FILTER] Nếu có searchName mà tên không chứa từ khóa -> bỏ qua
          if (searchName && !String(debtor).toLowerCase().includes(searchName)) {
             continue; 
          }

          if (!isNaN(amount)) {
            totalDebt += amount;
            count++;
            
            // Giới hạn hiển thị tránh spam tin nhắn quá dài (chỉ hiện 15 dòng gần nhất thỏa mãn)
            if (displayedItems < 15) {
               msg += `${i}. <b>${debtor}:</b> ${amount.toLocaleString()} đ ${note}\n`;
               displayedItems++;
            }
          }
        }

        if (count > 15) {
            msg += `... (và ${count - 15} khoản khác)\n`; 
        }

        if (count === 0) {
            msg += "✅ Không tìm thấy khoản nợ nào.";
        } else {
            msg += `\n----------------------\n💰 <b>TỔNG NỢ: ${totalDebt.toLocaleString()} đ</b>`;
        }
        
        sendText(chatId, msg);
      }
    }

    else if (command.startsWith("/ndelete ")) {
      const indexToDelete = parseInt(text.split(" ")[1]);
      
      if (!isNaN(indexToDelete) && indexToDelete > 0) {
        const ss = SpreadsheetApp.openById(getConfig().ssId);
        const sheet = ss.getSheetByName("Cần Đòi Nợ");
        const rowInSheet = indexToDelete + 1;
        const lastRow = sheet.getLastRow();

        if (rowInSheet <= lastRow) {
          const dataRow = sheet.getRange(rowInSheet, 1, 1, 7).getValues()[0];
          const debtor = dataRow[4];
          const amount = parseInt(dataRow[5]).toLocaleString();
          const note = dataRow[6];

          sheet.deleteRow(rowInSheet);
          
          sendText(chatId, `🗑 <b>ĐÃ XÓA NỢ THÀNH CÔNG!</b>\n\nSTT: ${indexToDelete}\n👤 <b>${debtor}</b>\n💸 Số tiền: ${amount} đ\n📝 ${note}\n\n⚠️ Danh sách đã được cập nhật lại.`);
        } else {
          sendText(chatId, "❌ Số thứ tự không tồn tại trong danh sách.");
        }
      } else {
        sendText(chatId, "⚠️ Vui lòng nhập số thứ tự. Ví dụ: /ndelete 6");
      }
    }
    
    else if (command === "/start") {
      sendText(chatId, "🔥 <b>Bot Đa Năng V29 - Super Voucher & Photo Bill</b>\n\n" +
               "🎫 <b>Voucher:</b> <code>/voucher [Tiền] [Code] [Ngày] [Hãng]</code>\n" +
               "👉 VD: /voucher 50k CODE123 12/02/2025 Circle K\n" +
               "--------------------------\n" +
               "💰 <b>Quỹ Chung:</b> <code>/c +50k...</code> (Gửi kèm ảnh để lưu Bill)\n" +
               "👵 <b>Lương Bà:</b> <code>/lcb +50k...</code> (Gửi kèm ảnh để lưu Bill)\n" +
               "--------------------------\n" +
               "📓 <b>Ghi Nợ:</b> <code>/n 100k Phát...</code>\n" +
               "📓 <b>Xem Nợ:</b> <code>/nlist</code> hoặc <code>/nlist Phát</code>\n" +
               "🗑 <b>Xoá Nợ:</b> <code>/ndelete [STT]</code>\n" +
               "--------------------------\n" +
               "📸 <b>Lưu ảnh:</b> Gửi ảnh vào chat.");
    }

  } catch (err) {
    // Silent fail
  }
}