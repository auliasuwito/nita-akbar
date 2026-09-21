/**
 * GOOGLE APPS SCRIPT BACKEND
 * Spreadsheet columns:
 * A = Timestamp
 * B = Name
 * C = Attendance
 * D = Message
 *
 * 1. Create a Google Spreadsheet.
 * 2. Open Extensions > Apps Script.
 * 3. Paste this code.
 * 4. Replace SHEET_NAME if needed.
 * 5. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Copy the Web App URL into CONFIG.API_URL in index.html.
 */

const SHEET_NAME = "RSVP";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Attendance", "Message"]);
  }
  return sheet;
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "list";
  if (action !== "list") {
    return json_({ ok: false, message: "Unknown action." });
  }

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return json_({ ok: true, data: [] });

  const data = values.slice(1)
    .filter(row => row[1])
    .map(row => ({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      name: String(row[1]),
      attendance: String(row[2] || ""),
      message: String(row[3] || "")
    }))
    .reverse(); // newest first => page 1 contains latest 5

  return json_({ ok: true, data });
}

function doPost(e) {
  try {
    const p = e.parameter || {};
    const name = sanitize_(p.name, 80);
    const attendance = sanitize_(p.attendance, 30);
    const message = sanitize_(p.message, 500);

    if (!name || !attendance || !message) {
      return json_({ ok: false, message: "Nama, kehadiran, dan pesan wajib diisi." });
    }

    const allowed = ["Hadir", "Tidak Hadir", "Masih Ragu"];
    if (allowed.indexOf(attendance) === -1) {
      return json_({ ok: false, message: "Status kehadiran tidak valid." });
    }

    getSheet_().appendRow([new Date(), name, attendance, message]);
    return json_({ ok: true, message: "RSVP berhasil disimpan." });
  } catch (err) {
    return json_({ ok: false, message: String(err) });
  }
}

function sanitize_(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
