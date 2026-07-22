export const GoogleAppsScriptCode = `/**
 * =========================================================================
 * KODE GOOGLE APPS SCRIPT (Code.gs) UNTUK INTEGRASI DATABASE BOSP SPREADSHEET
 * =========================================================================
 * 
 * LANGKAH DOKUMENTASI & CARA MEMASANG:
 * 1. Buka Google Sheets Anda di https://sheets.google.com (Buat Spreadsheet Baru)
 * 2. Klik menu "Ekstensi" -> "Apps Script" (Extension -> Apps Script)
 * 3. Hapus semua kode default, lalu COPAS (Paste) seluruh kode di bawah ini ke editor.
 * 4. Klik ikon Simpan (Diskette) / Ctrl+S.
 * 5. Klik tombol "Terapkan" -> "Penerapan baru" (Deploy -> New deployment)
 * 6. Pilih jenis: "Aplikasi Web" (Web App)
 *    - Deskripsi: API Database BOSP SD
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Yang memiliki akses (Who has access): Siapa saja (Anyone) -> SANGAT PENTING!
 * 7. Klik "Terapkan" (Deploy), lalu Berikan Izin Akses (Grant Access).
 * 8. Salin URL Aplikasi Web (Web App URL) yang dihasilkan (berakhiran /exec).
 * 9. Tempelkan (Paste) URL tersebut pada aplikasi Si-Standing BOSP.
 */

/**
 * =========================================================================
 * FUNGSI SETUP DATABASE MANUAL (Bisa dijalankan langsung di Apps Script)
 * =========================================================================
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, "DATABASE_TRANSAKSI");
  
  var headers = [
    "NO", "TANGGAL", "TIPE TRANSAKSI", "JENIS TRANSAKSI", "NO. SURAT",
    "NAMA PENERIMA", "NO. REK PENERIMA", "NAMA BANK", "PPh", "PPN",
    "NETTO", "SIPLAH", "NO. PO", "KETERANGAN", "VENDOR",
    "STATUS SI", "BULAN", "TAHUN", "DESKRIPSI FULL", "KATEGORI"
  ];
  
  // Jika sheet masih kosong, isi dengan header
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    // Timpa baris pertama dengan header yang benar
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  // Format Header Row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1e293b");
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
  
  // Bekukan baris pertama (Freeze header)
  sheet.setFrozenRows(1);
  
  SpreadsheetApp.getUi().alert("✅ Database BOSP Berhasil Disiapkan!\nSheet 'DATABASE_TRANSAKSI' siap digunakan.");
  return "Setup Berhasil";
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Si-Standing BOSP")
    .addItem("Inisialisasi / Setup Database", "setupDatabase")
    .addToUi();
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("DATABASE_TRANSAKSI");
    
    if (!sheet) {
      return responseJSON({ status: "success", count: 0, data: [] });
    }
    
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return responseJSON({ status: "success", count: 0, data: [] });
    }
    
    var headers = values[0];
    var data = [];
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0] && !row[1] && !row[4]) continue; // skip empty rows
      
      var item = {
        no: Number(row[0]) || i,
        tanggal: row[1] ? formatDate(row[1]) : "",
        tipeTransaksi: row[2] || "KELUAR",
        jenisTransaksi: row[3] || "",
        noSurat: row[4] || "",
        namaPenerima: row[5] || "",
        noRekPenerima: String(row[6] || "").replace(/^'/, ""),
        namaBank: row[7] || "BJB",
        pph: Number(row[8]) || 0,
        ppn: Number(row[9]) || 0,
        netto: Number(row[10]) || 0,
        siplah: row[11] || "Non Siplah",
        noPo: row[12] || "",
        keterangan: row[13] || "",
        vendor: row[14] || "NON SIPLAH",
        statusSi: row[15] || "BELUM CETAK",
        bulan: row[16] || "",
        tahun: String(row[17] || "2024"),
        deskripsiFull: row[18] || "",
        kategori: row[19] || "JASA KANTOR"
      };
      
      data.push(item);
    }
    
    return responseJSON({ status: "success", count: data.length, data: data });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action || "sync_all";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "sync_all" || action === "save_transactions") {
      var transactions = postData.transactions || [];
      var sheet = getOrCreateSheet(ss, "DATABASE_TRANSAKSI");
      
      // Setup Headers
      var headers = [
        "NO", "TANGGAL", "TIPE TRANSAKSI", "JENIS TRANSAKSI", "NO. SURAT",
        "NAMA PENERIMA", "NO. REK PENERIMA", "NAMA BANK", "PPh", "PPN",
        "NETTO", "SIPLAH", "NO. PO", "KETERANGAN", "VENDOR",
        "STATUS SI", "BULAN", "TAHUN", "DESKRIPSI FULL", "KATEGORI"
      ];
      
      sheet.clearContents();
      sheet.appendRow(headers);
      
      // Format Header Row
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1e293b");
      headerRange.setFontColor("#ffffff");
      
      if (transactions.length > 0) {
        var rows = transactions.map(function(t, idx) {
          return [
            t.no || (idx + 1),
            t.tanggal || "",
            t.tipeTransaksi || "KELUAR",
            t.jenisTransaksi || "",
            t.noSurat || "",
            t.namaPenerima || "",
            "'" + (t.noRekPenerima || ""), // add single quote to force string in Excel/Sheets
            t.namaBank || "BJB",
            t.pph || 0,
            t.ppn || 0,
            t.netto || 0,
            t.siplah || "Non Siplah",
            t.noPo || "",
            t.keterangan || "",
            t.vendor || "NON SIPLAH",
            t.statusSi || "BELUM CETAK",
            t.bulan || "",
            t.tahun || "2024",
            t.deskripsiFull || "",
            t.kategori || "JASA KANTOR"
          ];
        });
        
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      
      return responseJSON({
        status: "success",
        message: "Berhasil menyinkronkan " + transactions.length + " data transaksi ke Google Spreadsheet!",
        updatedAt: new Date().toISOString()
      });
    }
    
    return responseJSON({ status: "error", message: "Aksi tidak dikenali" });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatDate(val) {
  if (val instanceof Date) {
    var d = val.getDate();
    var m = val.getMonth() + 1;
    var y = val.getFullYear();
    return (d < 10 ? "0" + d : d) + "/" + (m < 10 ? "0" + m : m) + "/" + y;
  }
  return String(val);
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
