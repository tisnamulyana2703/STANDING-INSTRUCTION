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

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. DATABASE_TRANSAKSI
  var sheetTx = getOrCreateSheet(ss, "DATABASE_TRANSAKSI");
  var headersTx = [
    "NO", "TANGGAL", "TIPE TRANSAKSI", "JENIS TRANSAKSI", "NO. SURAT",
    "NAMA PENERIMA", "NO. REK PENERIMA", "NAMA BANK", "PPh", "PPN",
    "NETTO", "SIPLAH", "NO. PO", "KETERANGAN", "VENDOR",
    "STATUS SI", "BULAN", "TAHUN", "DESKRIPSI FULL", "KATEGORI"
  ];
  setSheetHeader(sheetTx, headersTx);

  // 2. INFORMASI_SEKOLAH
  var sheetInfo = getOrCreateSheet(ss, "INFORMASI_SEKOLAH");
  var headersInfo = ["PROPERTY", "VALUE"];
  setSheetHeader(sheetInfo, headersInfo);

  // 3. DATABASE_VENDOR
  var sheetVendor = getOrCreateSheet(ss, "DATABASE_VENDOR");
  var headersVendor = ["ID", "NAMA_VENDOR", "ALAMAT", "NO_HP", "NPWP"];
  setSheetHeader(sheetVendor, headersVendor);
  
  SpreadsheetApp.getUi().alert("✅ Database BOSP Berhasil Disiapkan!\nSheet 'DATABASE_TRANSAKSI', 'INFORMASI_SEKOLAH', & 'DATABASE_VENDOR' siap digunakan.");
  return "Setup Berhasil";
}

function setSheetHeader(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1e293b");
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
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
    
    // --- 1. DATA TRANSAKSI ---
    var sheetTx = ss.getSheetByName("DATABASE_TRANSAKSI");
    var transactions = [];
    if (sheetTx) {
      var valuesTx = sheetTx.getDataRange().getValues();
      for (var i = 1; i < valuesTx.length; i++) {
        var row = valuesTx[i];
        if (!row[0] && !row[1] && !row[4]) continue;
        transactions.push({
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
        });
      }
    }

    // --- 2. INFORMASI SEKOLAH ---
    var sheetInfo = ss.getSheetByName("INFORMASI_SEKOLAH");
    var schoolSettings = null;
    if (sheetInfo) {
      var valuesInfo = sheetInfo.getDataRange().getValues();
      if (valuesInfo.length > 1) {
        var kv = {};
        for (var j = 1; j < valuesInfo.length; j++) {
          var k = String(valuesInfo[j][0] || "").trim();
          var v = String(valuesInfo[j][1] || "");
          if (k) kv[k] = v;
        }
        if (Object.keys(kv).length > 0) {
          schoolSettings = {
            pemerintah: kv["PEMERINTAH"] || "",
            namaSekolah: kv["NAMA_SEKOLAH"] || "",
            alamatSekolah: kv["ALAMAT_SEKOLAH"] || "",
            bankTarget: kv["BANK_TARGET"] || "",
            bankBranch: kv["BANK_BRANCH"] || "",
            noRekeningUtama: kv["NO_REKENING_UTAMA"] || "",
            atasNamaRekening: kv["ATAS_NAMA_REKENING"] || "",
            sumberDana: kv["SUMBER_DANA"] || "",
            kotaSurat: kv["KOTA_SURAT"] || "",
            logoKabupatenUrl: kv["LOGO_KABUPATEN_URL"] || "",
            logoSekolahUrl: kv["LOGO_SEKOLAH_URL"] || "",
            kepalaSekolah: {
              nama: kv["KEPALA_SEKOLAH_NAMA"] || "",
              jabatan: kv["KEPALA_SEKOLAH_JABATAN"] || "",
              nip: kv["KEPALA_SEKOLAH_NIP"] || "",
              nik: kv["KEPALA_SEKOLAH_NIK"] || "",
              hp: kv["KEPALA_SEKOLAH_HP"] || "",
              alamat: kv["KEPALA_SEKOLAH_ALAMAT"] || ""
            },
            bendahara: {
              nama: kv["BENDAHARA_NAMA"] || "",
              jabatan: kv["BENDAHARA_JABATAN"] || "",
              nip: kv["BENDAHARA_NIP"] || "",
              nik: kv["BENDAHARA_NIK"] || "",
              hp: kv["BENDAHARA_HP"] || "",
              alamat: kv["BENDAHARA_ALAMAT"] || ""
            }
          };
        }
      }
    }

    // --- 3. DATABASE VENDOR ---
    var sheetVendor = ss.getSheetByName("DATABASE_VENDOR");
    var vendors = [];
    if (sheetVendor) {
      var valuesVendor = sheetVendor.getDataRange().getValues();
      for (var k = 1; k < valuesVendor.length; k++) {
        var vRow = valuesVendor[k];
        if (!vRow[0] && !vRow[1]) continue;
        vendors.push({
          id: String(vRow[0] || ("vendor-" + k)),
          nama: String(vRow[1] || ""),
          alamat: String(vRow[2] || ""),
          hp: String(vRow[3] || "").replace(/^'/, ""),
          npwp: String(vRow[4] || "").replace(/^'/, "")
        });
      }
    }

    return responseJSON({
      status: "success",
      count: transactions.length,
      data: transactions,
      transactions: transactions,
      schoolSettings: schoolSettings,
      vendors: vendors
    });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action || "sync_all";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // --- SAVE TRANSACTIONS ---
    if (action === "sync_all" || action === "save_all" || action === "save_transactions") {
      if (postData.transactions && Array.isArray(postData.transactions)) {
        var sheetTx = getOrCreateSheet(ss, "DATABASE_TRANSAKSI");
        var headersTx = [
          "NO", "TANGGAL", "TIPE TRANSAKSI", "JENIS TRANSAKSI", "NO. SURAT",
          "NAMA PENERIMA", "NO. REK PENERIMA", "NAMA BANK", "PPh", "PPN",
          "NETTO", "SIPLAH", "NO. PO", "KETERANGAN", "VENDOR",
          "STATUS SI", "BULAN", "TAHUN", "DESKRIPSI FULL", "KATEGORI"
        ];
        sheetTx.clearContents();
        setSheetHeader(sheetTx, headersTx);
        
        if (postData.transactions.length > 0) {
          var rowsTx = postData.transactions.map(function(t, idx) {
            return [
              t.no || (idx + 1),
              t.tanggal || "",
              t.tipeTransaksi || "KELUAR",
              t.jenisTransaksi || "",
              t.noSurat || "",
              t.namaPenerima || "",
              "'" + (t.noRekPenerima || ""),
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
          sheetTx.getRange(2, 1, rowsTx.length, headersTx.length).setValues(rowsTx);
        }
      }
    }

    // --- SAVE INFORMASI SEKOLAH ---
    if (action === "sync_all" || action === "save_all" || action === "save_school_settings") {
      if (postData.schoolSettings) {
        var s = postData.schoolSettings;
        var sheetInfo = getOrCreateSheet(ss, "INFORMASI_SEKOLAH");
        var headersInfo = ["PROPERTY", "VALUE"];
        sheetInfo.clearContents();
        setSheetHeader(sheetInfo, headersInfo);

        var infoRows = [
          ["PEMERINTAH", s.pemerintah || ""],
          ["NAMA_SEKOLAH", s.namaSekolah || ""],
          ["ALAMAT_SEKOLAH", s.alamatSekolah || ""],
          ["BANK_TARGET", s.bankTarget || ""],
          ["BANK_BRANCH", s.bankBranch || ""],
          ["NO_REKENING_UTAMA", s.noRekeningUtama || ""],
          ["ATAS_NAMA_REKENING", s.atasNamaRekening || ""],
          ["SUMBER_DANA", s.sumberDana || ""],
          ["KOTA_SURAT", s.kotaSurat || ""],
          ["LOGO_KABUPATEN_URL", s.logoKabupatenUrl || ""],
          ["LOGO_SEKOLAH_URL", s.logoSekolahUrl || ""],
          ["KEPALA_SEKOLAH_NAMA", s.kepalaSekolah ? s.kepalaSekolah.nama : ""],
          ["KEPALA_SEKOLAH_JABATAN", s.kepalaSekolah ? s.kepalaSekolah.jabatan : ""],
          ["KEPALA_SEKOLAH_NIP", s.kepalaSekolah ? s.kepalaSekolah.nip : ""],
          ["KEPALA_SEKOLAH_NIK", s.kepalaSekolah ? s.kepalaSekolah.nik : ""],
          ["KEPALA_SEKOLAH_HP", s.kepalaSekolah ? s.kepalaSekolah.hp : ""],
          ["KEPALA_SEKOLAH_ALAMAT", s.kepalaSekolah ? s.kepalaSekolah.alamat : ""],
          ["BENDAHARA_NAMA", s.bendahara ? s.bendahara.nama : ""],
          ["BENDAHARA_JABATAN", s.bendahara ? s.bendahara.jabatan : ""],
          ["BENDAHARA_NIP", s.bendahara ? s.bendahara.nip : ""],
          ["BENDAHARA_NIK", s.bendahara ? s.bendahara.nik : ""],
          ["BENDAHARA_HP", s.bendahara ? s.bendahara.hp : ""],
          ["BENDAHARA_ALAMAT", s.bendahara ? s.bendahara.alamat : ""]
        ];

        sheetInfo.getRange(2, 1, infoRows.length, 2).setValues(infoRows);
      }
    }

    // --- SAVE VENDORS ---
    if (action === "sync_all" || action === "save_all" || action === "save_vendors") {
      if (postData.vendors && Array.isArray(postData.vendors)) {
        var sheetVendor = getOrCreateSheet(ss, "DATABASE_VENDOR");
        var headersVendor = ["ID", "NAMA_VENDOR", "ALAMAT", "NO_HP", "NPWP"];
        sheetVendor.clearContents();
        setSheetHeader(sheetVendor, headersVendor);

        if (postData.vendors.length > 0) {
          var rowsVendor = postData.vendors.map(function(v) {
            return [
              v.id || "",
              v.nama || "",
              v.alamat || "",
              "'" + (v.hp || ""),
              "'" + (v.npwp || "")
            ];
          });
          sheetVendor.getRange(2, 1, rowsVendor.length, headersVendor.length).setValues(rowsVendor);
        }
      }
    }

    return responseJSON({
      status: "success",
      message: "Berhasil menyinkronkan seluruh data (Transaksi, Kop Surat, & Vendor) ke Google Spreadsheet!",
      updatedAt: new Date().toISOString()
    });
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
