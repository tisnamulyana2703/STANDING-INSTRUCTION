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
 *    - PENTING: Jika sudah pernah deploy, pilih "Penerapan Baru" atau edit "Versi Baru" (New Version)!
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
      // getDisplayValues() mempertahankan teks seperti nomor HP / rekening berawalan 0
      var valuesTx = sheetTx.getDataRange().getDisplayValues();
      for (var i = 1; i < valuesTx.length; i++) {
        var row = valuesTx[i];
        if (!row[0] && !row[1] && !row[4]) continue;
        var rowNo = parseInt(cleanStr(row[0]), 10) || i;
        transactions.push({
          id: "tx-" + rowNo + "-" + i,
          no: rowNo,
          tanggal: row[1] ? formatDate(row[1]) : "",
          tipeTransaksi: cleanStr(row[2]) || "KELUAR",
          jenisTransaksi: cleanStr(row[3]),
          noSurat: cleanStr(row[4]),
          namaPenerima: cleanStr(row[5]),
          noRekPenerima: cleanStr(row[6]),
          namaBank: cleanStr(row[7]) || "BJB",
          pph: cleanStr(row[8]) || "0",
          ppn: cleanStr(row[9]) || "0",
          netto: Number(cleanStr(row[10]).replace(/[^0-9]/g, "")) || 0,
          siplah: cleanStr(row[11]) || "Non Siplah",
          noPo: cleanStr(row[12]),
          keterangan: cleanStr(row[13]),
          vendor: cleanStr(row[14]) || "NON SIPLAH",
          statusSi: cleanStr(row[15]) || "BELUM CETAK",
          bulan: cleanStr(row[16]),
          tahun: cleanStr(row[17]) || "2024",
          deskripsiFull: cleanStr(row[18]),
          kategori: cleanStr(row[19]) || "JASA KANTOR"
        });
      }
    }

    // --- 2. INFORMASI SEKOLAH ---
    var sheetInfo = ss.getSheetByName("INFORMASI_SEKOLAH");
    var schoolSettings = null;
    if (sheetInfo) {
      var valuesInfo = sheetInfo.getDataRange().getDisplayValues();
      if (valuesInfo.length > 1) {
        var kv = {};
        for (var j = 1; j < valuesInfo.length; j++) {
          var k = cleanStr(valuesInfo[j][0]);
          var v = cleanStr(valuesInfo[j][1]);
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
      var valuesVendor = sheetVendor.getDataRange().getDisplayValues();
      for (var k = 1; k < valuesVendor.length; k++) {
        var vRow = valuesVendor[k];
        if (!vRow[0] && !vRow[1]) continue;
        vendors.push({
          id: cleanStr(vRow[0]) || ("vendor-" + k),
          nama: cleanStr(vRow[1]),
          alamat: cleanStr(vRow[2]),
          hp: cleanStr(vRow[3]),
          npwp: cleanStr(vRow[4])
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
    var logs = [];
    
    // --- 1. SAVE TRANSACTIONS ---
    if (action === "sync_all" || action === "save_all" || action === "save_transactions") {
      try {
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
                safeVal(t.tanggal),
                safeVal(t.tipeTransaksi || "KELUAR"),
                safeVal(t.jenisTransaksi),
                toTextCell(t.noSurat),
                safeVal(t.namaPenerima),
                toTextCell(t.noRekPenerima),
                safeVal(t.namaBank || "BJB"),
                safeVal(t.pph || "0"),
                safeVal(t.ppn || "0"),
                t.netto || 0,
                safeVal(t.siplah || "Non Siplah"),
                toTextCell(t.noPo),
                safeVal(t.keterangan),
                safeVal(t.vendor || "NON SIPLAH"),
                safeVal(t.statusSi || "BELUM CETAK"),
                safeVal(t.bulan),
                toTextCell(t.tahun || "2024"),
                safeVal(t.deskripsiFull),
                safeVal(t.kategori || "JASA KANTOR")
              ];
            });
            var rangeTx = sheetTx.getRange(2, 1, rowsTx.length, headersTx.length);
            rangeTx.setNumberFormat("@");
            rangeTx.setValues(rowsTx);
          }
          logs.push("DATABASE_TRANSAKSI (" + postData.transactions.length + " item)");
        }
      } catch (errTx) {
        logs.push("ERROR TRANSAKSI: " + errTx.toString());
      }
    }

    // --- 2. SAVE INFORMASI SEKOLAH ---
    if (action === "sync_all" || action === "save_all" || action === "save_school_settings") {
      try {
        if (postData.schoolSettings) {
          var s = postData.schoolSettings;
          var sheetInfo = getOrCreateSheet(ss, "INFORMASI_SEKOLAH");
          var headersInfo = ["PROPERTY", "VALUE"];
          sheetInfo.clearContents();
          setSheetHeader(sheetInfo, headersInfo);

          var infoRows = [
            ["PEMERINTAH", safeVal(s.pemerintah)],
            ["NAMA_SEKOLAH", safeVal(s.namaSekolah)],
            ["ALAMAT_SEKOLAH", safeVal(s.alamatSekolah)],
            ["BANK_TARGET", safeVal(s.bankTarget)],
            ["BANK_BRANCH", safeVal(s.bankBranch)],
            ["NO_REKENING_UTAMA", toTextCell(s.noRekeningUtama)],
            ["ATAS_NAMA_REKENING", safeVal(s.atasNamaRekening)],
            ["SUMBER_DANA", safeVal(s.sumberDana)],
            ["KOTA_SURAT", safeVal(s.kotaSurat)],
            ["LOGO_KABUPATEN_URL", safeVal(s.logoKabupatenUrl)],
            ["LOGO_SEKOLAH_URL", safeVal(s.logoSekolahUrl)],
            ["KEPALA_SEKOLAH_NAMA", s.kepalaSekolah ? safeVal(s.kepalaSekolah.nama) : ""],
            ["KEPALA_SEKOLAH_JABATAN", s.kepalaSekolah ? safeVal(s.kepalaSekolah.jabatan) : ""],
            ["KEPALA_SEKOLAH_NIP", s.kepalaSekolah ? toTextCell(s.kepalaSekolah.nip) : ""],
            ["KEPALA_SEKOLAH_NIK", s.kepalaSekolah ? toTextCell(s.kepalaSekolah.nik) : ""],
            ["KEPALA_SEKOLAH_HP", s.kepalaSekolah ? toTextCell(s.kepalaSekolah.hp) : ""],
            ["KEPALA_SEKOLAH_ALAMAT", s.kepalaSekolah ? safeVal(s.kepalaSekolah.alamat) : ""],
            ["BENDAHARA_NAMA", s.bendahara ? safeVal(s.bendahara.nama) : ""],
            ["BENDAHARA_JABATAN", s.bendahara ? safeVal(s.bendahara.jabatan) : ""],
            ["BENDAHARA_NIP", s.bendahara ? toTextCell(s.bendahara.nip) : ""],
            ["BENDAHARA_NIK", s.bendahara ? toTextCell(s.bendahara.nik) : ""],
            ["BENDAHARA_HP", s.bendahara ? toTextCell(s.bendahara.hp) : ""],
            ["BENDAHARA_ALAMAT", s.bendahara ? safeVal(s.bendahara.alamat) : ""]
          ];

          var rangeInfo = sheetInfo.getRange(2, 1, infoRows.length, 2);
          rangeInfo.setNumberFormat("@");
          rangeInfo.setValues(infoRows);
          logs.push("INFORMASI_SEKOLAH");
        }
      } catch (errInfo) {
        logs.push("ERROR INFORMASI_SEKOLAH: " + errInfo.toString());
      }
    }

    // --- 3. SAVE VENDORS ---
    if (action === "sync_all" || action === "save_all" || action === "save_vendors") {
      try {
        if (postData.vendors && Array.isArray(postData.vendors)) {
          var sheetVendor = getOrCreateSheet(ss, "DATABASE_VENDOR");
          var headersVendor = ["ID", "NAMA_VENDOR", "ALAMAT", "NO_HP", "NPWP"];
          sheetVendor.clearContents();
          setSheetHeader(sheetVendor, headersVendor);

          if (postData.vendors.length > 0) {
            var rowsVendor = postData.vendors.map(function(v) {
              return [
                safeVal(v.id),
                safeVal(v.nama),
                safeVal(v.alamat),
                toTextCell(v.hp),
                toTextCell(v.npwp)
              ];
            });
            var rangeVendor = sheetVendor.getRange(2, 1, rowsVendor.length, headersVendor.length);
            rangeVendor.setNumberFormat("@");
            rangeVendor.setValues(rowsVendor);
          }
          logs.push("DATABASE_VENDOR (" + postData.vendors.length + " vendor)");
        }
      } catch (errVendor) {
        logs.push("ERROR DATABASE_VENDOR: " + errVendor.toString());
      }
    }

    return responseJSON({
      status: "success",
      message: "Berhasil menyinkronkan seluruh data: " + logs.join(", "),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function safeVal(val) {
  if (val === null || val === undefined) return "";
  var str = String(val);
  if (str.length > 30000) {
    return str.substring(0, 30000);
  }
  return str;
}

function toTextCell(val) {
  if (val === null || val === undefined) return "";
  var str = String(val).trim();
  if (str === "") return "";
  if (str.indexOf("'") === 0) return str;
  return "'" + str;
}

function cleanStr(val) {
  if (val === null || val === undefined) return "";
  var str = String(val).trim();
  if (str.indexOf("'") === 0) {
    return str.substring(1).trim();
  }
  return str;
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

export function sanitizeSchoolSettingsForSync(settings: any) {
  if (!settings || typeof settings !== 'object') return settings;
  const copy = { ...settings };
  if (copy.logoKabupatenUrl && typeof copy.logoKabupatenUrl === 'string' && copy.logoKabupatenUrl.length > 25000) {
    copy.logoKabupatenUrl = copy.logoKabupatenUrl.substring(0, 25000);
  }
  if (copy.logoSekolahUrl && typeof copy.logoSekolahUrl === 'string' && copy.logoSekolahUrl.length > 25000) {
    copy.logoSekolahUrl = copy.logoSekolahUrl.substring(0, 25000);
  }
  return copy;
}

export function ensureTransactionIds(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.map((t, idx) => {
    const rawNo = typeof t?.no === 'number' ? t.no : (parseInt(String(t?.no || ''), 10) || (idx + 1));
    const existingId = t && t.id !== undefined && t.id !== null ? String(t.id).trim() : '';
    return {
      ...t,
      id: existingId || `tx-${rawNo}-${idx + 1}`,
      no: rawNo,
    };
  });
}

