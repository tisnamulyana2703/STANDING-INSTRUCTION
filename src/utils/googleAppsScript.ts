export const GoogleAppsScriptCode = `/**
 * =========================================================================
 * KODE GOOGLE APPS SCRIPT (Code.gs) UNTUK INTEGRASI DATABASE BOSP SPREADSHEET
 * VERSI LENGKAP: DATABASE TRANSAKSI, INFO SEKOLAH, VENDOR, & 12 SHEET BULANAN
 * =========================================================================
 * 
 * DAFTAR SHEET YANG DIBUAT OTOMATIS:
 * 1. DATABASE_TRANSAKSI       -> Database seluruh transaksi masuk & keluar BOSP
 * 2. INFORMASI_SEKOLAH        -> Data Kop Surat, Rekening Utama, Kepala Sekolah, & Bendahara
 * 3. DATABASE_VENDOR          -> Database Master Vendor / Toko Rekanan
 * 4. RINCIAN_BELANJA          -> Master Sheet seluruh Rincian Kertas Kerja BOSP
 * 5. RINCIAN_JANUARI - DESEMBER -> 12 Sheet terpisah per bulan (Januari s.d. Desember)
 * 
 * LANGKAH CARA MEMASANG:
 * 1. Buka Google Sheets Anda di https://sheets.google.com (Buat Spreadsheet Baru)
 * 2. Klik menu "Ekstensi" -> "Apps Script" (Extensions -> Apps Script)
 * 3. Hapus semua kode default di editor Apps Script.
 * 4. Salin (Copy) seluruh kode di bawah ini lalu Tempel (Paste) ke editor.
 * 5. Klik ikon Simpan (Diskette) / Ctrl+S.
 * 6. Klik tombol biru "Terapkan" -> "Penerapan baru" (Deploy -> New deployment).
 * 7. Pilih jenis: "Aplikasi Web" (Web App).
 *    - Deskripsi: API Database BOSP Lengkap
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Yang memiliki akses (Who has access): Siapa saja (Anyone) -> SANGAT PENTING!
 * 8. Klik "Terapkan" (Deploy), lalu Berikan Izin Akses Google (Grant Access).
 * 9. Salin URL Aplikasi Web (Web App URL) yang berakhiran "/exec".
 * 10. Tempelkan URL tersebut pada aplikasi Si-Standing BOSP.
 */

var BULAN_LIST = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

var HEADERS_TX = [
  "NO", "TANGGAL", "TIPE TRANSAKSI", "JENIS TRANSAKSI", "NO. SURAT",
  "NAMA PENERIMA", "NO. REK PENERIMA", "NAMA BANK", "PPh", "PPN",
  "NETTO", "SIPLAH", "NO. PO", "KETERANGAN", "VENDOR",
  "STATUS SI", "BULAN", "TAHUN", "DESKRIPSI FULL", "KATEGORI"
];

var HEADERS_INFO = ["PROPERTY", "VALUE"];

var HEADERS_VENDOR = ["ID", "NAMA_VENDOR", "ALAMAT", "NO_HP", "NPWP"];

var HEADERS_RINCIAN = [
  "NO_URUT", "KODE_REKENING", "KODE_PROGRAM", "URAIAN",
  "VOLUME", "SATUAN", "TARIF_HARGA", "JUMLAH", "IS_HEADER", "BULAN", "TAHUN"
];

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. DATABASE_TRANSAKSI
  var sheetTx = getOrCreateSheet(ss, "DATABASE_TRANSAKSI");
  setSheetHeader(sheetTx, HEADERS_TX);

  // 2. INFORMASI_SEKOLAH
  var sheetInfo = getOrCreateSheet(ss, "INFORMASI_SEKOLAH");
  setSheetHeader(sheetInfo, HEADERS_INFO);

  // 3. DATABASE_VENDOR
  var sheetVendor = getOrCreateSheet(ss, "DATABASE_VENDOR");
  setSheetHeader(sheetVendor, HEADERS_VENDOR);
  
  // 4. RINCIAN_BELANJA (Master)
  var sheetRincian = getOrCreateSheet(ss, "RINCIAN_BELANJA");
  setSheetHeader(sheetRincian, HEADERS_RINCIAN);

  // 5. 12 SHEET RINCIAN BULANAN (RINCIAN_JANUARI s/d RINCIAN_DESEMBER)
  for (var m = 0; m < BULAN_LIST.length; m++) {
    var monthName = BULAN_LIST[m];
    var sheetMonth = getOrCreateSheet(ss, "RINCIAN_" + monthName.toUpperCase());
    setSheetHeader(sheetMonth, HEADERS_RINCIAN);
  }

  // Format and arrange sheets
  try {
    var ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.alert("Database BOSP Berhasil Disiapkan!\\n\\nSheet yang telah aktif:\\n- DATABASE_TRANSAKSI\\n- INFORMASI_SEKOLAH\\n- DATABASE_VENDOR\\n- RINCIAN_BELANJA (Master)\\n- RINCIAN_JANUARI s.d. RINCIAN_DESEMBER (12 Sheet Bulanan)");
    }
  } catch (eUi) {
    Logger.log("UI Alert setup info: " + eUi.toString());
  }
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
  try {
    var ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.createMenu("Si-Standing BOSP")
        .addItem("1. Inisialisasi / Setup Database Lengkap", "setupDatabase")
        .addItem("2. Distribusikan Rincian Master ke 12 Sheet Bulanan", "distributeRincianToMonthlySheets")
        .addItem("3. Gabungkan Sheet Bulanan ke Master RINCIAN_BELANJA", "combineMonthlySheetsToMaster")
        .addItem("4. Format Seluruh Header Sheet", "formatAllSheets")
        .addToUi();
    }
  } catch (eOpen) {
    Logger.log("onOpen UI error: " + eOpen.toString());
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // --- 1. DATA TRANSAKSI ---
    var sheetTx = ss.getSheetByName("DATABASE_TRANSAKSI");
    var transactions = [];
    if (sheetTx) {
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
          tahun: cleanStr(row[17]) || "2026",
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

    // --- 4. RINCIAN BELANJA (Master Sheet) ---
    var sheetRincian = ss.getSheetByName("RINCIAN_BELANJA");
    var rincianBelanja = [];
    if (sheetRincian) {
      var valuesRincian = sheetRincian.getDataRange().getDisplayValues();
      for (var r = 1; r < valuesRincian.length; r++) {
        var rRow = valuesRincian[r];
        if (!rRow[0] && !rRow[3]) continue;
        rincianBelanja.push({
          id: "rb-" + (r),
          noUrut: parseInt(cleanStr(rRow[0]), 10) || r,
          kodeRekening: cleanStr(rRow[1]),
          kodeProgram: cleanStr(rRow[2]),
          uraian: cleanStr(rRow[3]),
          volume: cleanStr(rRow[4]),
          satuan: cleanStr(rRow[5]),
          tarifHarga: Number(cleanStr(rRow[6]).replace(/[^0-9]/g, "")) || 0,
          jumlah: Number(cleanStr(rRow[7]).replace(/[^0-9]/g, "")) || 0,
          isHeader: cleanStr(rRow[8]).toLowerCase() === "true" || cleanStr(rRow[8]) === "1",
          bulan: cleanStr(rRow[9]) || "Agustus",
          tahun: cleanStr(rRow[10]) || "2026"
        });
      }
    }

    // If master sheet is empty, optionally aggregate from 12 monthly sheets
    if (rincianBelanja.length === 0) {
      for (var mIdx = 0; mIdx < BULAN_LIST.length; mIdx++) {
        var mName = BULAN_LIST[mIdx];
        var shM = ss.getSheetByName("RINCIAN_" + mName.toUpperCase());
        if (shM && shM.getLastRow() > 1) {
          var valM = shM.getDataRange().getDisplayValues();
          for (var mr = 1; mr < valM.length; mr++) {
            var rowM = valM[mr];
            if (!rowM[0] && !rowM[3]) continue;
            rincianBelanja.push({
              id: "rb-" + mName.toLowerCase() + "-" + mr,
              noUrut: parseInt(cleanStr(rowM[0]), 10) || (rincianBelanja.length + 1),
              kodeRekening: cleanStr(rowM[1]),
              kodeProgram: cleanStr(rowM[2]),
              uraian: cleanStr(rowM[3]),
              volume: cleanStr(rowM[4]),
              satuan: cleanStr(rowM[5]),
              tarifHarga: Number(cleanStr(rowM[6]).replace(/[^0-9]/g, "")) || 0,
              jumlah: Number(cleanStr(rowM[7]).replace(/[^0-9]/g, "")) || 0,
              isHeader: cleanStr(rowM[8]).toLowerCase() === "true" || cleanStr(rowM[8]) === "1",
              bulan: cleanStr(rowM[9]) || mName,
              tahun: cleanStr(rowM[10]) || "2026"
            });
          }
        }
      }
    }

    return responseJSON({
      status: "success",
      count: transactions.length,
      data: transactions,
      transactions: transactions,
      schoolSettings: schoolSettings,
      vendors: vendors,
      rincianBelanja: rincianBelanja
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
          sheetTx.clearContents();
          setSheetHeader(sheetTx, HEADERS_TX);
          
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
                toTextCell(t.tahun || "2026"),
                safeVal(t.deskripsiFull),
                safeVal(t.kategori || "JASA KANTOR")
              ];
            });
            var rangeTx = sheetTx.getRange(2, 1, rowsTx.length, HEADERS_TX.length);
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
          sheetInfo.clearContents();
          setSheetHeader(sheetInfo, HEADERS_INFO);

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
          sheetVendor.clearContents();
          setSheetHeader(sheetVendor, HEADERS_VENDOR);

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
            var rangeVendor = sheetVendor.getRange(2, 1, rowsVendor.length, HEADERS_VENDOR.length);
            rangeVendor.setNumberFormat("@");
            rangeVendor.setValues(rowsVendor);
          }
          logs.push("DATABASE_VENDOR (" + postData.vendors.length + " vendor)");
        }
      } catch (errVendor) {
        logs.push("ERROR DATABASE_VENDOR: " + errVendor.toString());
      }
    }

    // --- 4. SAVE RINCIAN BELANJA (MASTER & 12 SHEET BULANAN) ---
    if (action === "sync_all" || action === "save_all" || action === "save_rincian_belanja") {
      try {
        if (postData.rincianBelanja && Array.isArray(postData.rincianBelanja)) {
          var allRincian = postData.rincianBelanja;
          
          // 4A. Simpan Master Sheet RINCIAN_BELANJA
          var sheetRincian = getOrCreateSheet(ss, "RINCIAN_BELANJA");
          sheetRincian.clearContents();
          setSheetHeader(sheetRincian, HEADERS_RINCIAN);

          if (allRincian.length > 0) {
            var rowsRincian = allRincian.map(function(rb, idx) {
              return [
                rb.noUrut || (idx + 1),
                toTextCell(rb.kodeRekening),
                toTextCell(rb.kodeProgram),
                safeVal(rb.uraian),
                safeVal(rb.volume),
                safeVal(rb.satuan),
                rb.tarifHarga || 0,
                rb.jumlah || 0,
                rb.isHeader ? "true" : "false",
                safeVal(rb.bulan || "Agustus"),
                toTextCell(rb.tahun || "2026")
              ];
            });
            var rangeRincian = sheetRincian.getRange(2, 1, rowsRincian.length, HEADERS_RINCIAN.length);
            rangeRincian.setNumberFormat("@");
            rangeRincian.setValues(rowsRincian);
          }

          // 4B. Otomatis Distribusikan ke 12 Sheet Bulanan (RINCIAN_JANUARI s/d RINCIAN_DESEMBER)
          for (var b = 0; b < BULAN_LIST.length; b++) {
            var bName = BULAN_LIST[b];
            var bNameLower = bName.toLowerCase();
            var monthItems = allRincian.filter(function(item) {
              var itemBulan = (item.bulan || "").trim().toLowerCase();
              return itemBulan.indexOf(bNameLower) !== -1;
            });

            var sheetM = getOrCreateSheet(ss, "RINCIAN_" + bName.toUpperCase());
            sheetM.clearContents();
            setSheetHeader(sheetM, HEADERS_RINCIAN);

            if (monthItems.length > 0) {
              var rowsM = monthItems.map(function(rb, idx) {
                return [
                  rb.noUrut || (idx + 1),
                  toTextCell(rb.kodeRekening),
                  toTextCell(rb.kodeProgram),
                  safeVal(rb.uraian),
                  safeVal(rb.volume),
                  safeVal(rb.satuan),
                  rb.tarifHarga || 0,
                  rb.jumlah || 0,
                  rb.isHeader ? "true" : "false",
                  safeVal(rb.bulan || bName),
                  toTextCell(rb.tahun || "2026")
                ];
              });
              var rangeM = sheetM.getRange(2, 1, rowsM.length, HEADERS_RINCIAN.length);
              rangeM.setNumberFormat("@");
              rangeM.setValues(rowsM);
            }
          }

          logs.push("RINCIAN_BELANJA (Master: " + allRincian.length + " item & 12 Sheet Bulanan)");
        }
      } catch (errRincian) {
        logs.push("ERROR RINCIAN_BELANJA: " + errRincian.toString());
      }
    }

    // --- 5. SAVE RINCIAN SPESIFIK 1 BULAN TERTENTU (save_rincian_bulan) ---
    if (action === "save_rincian_bulan" && postData.targetBulan && Array.isArray(postData.items)) {
      try {
        var tBulan = String(postData.targetBulan).trim();
        var tBulanLower = tBulan.toLowerCase();
        var sheetTargetM = getOrCreateSheet(ss, "RINCIAN_" + tBulan.toUpperCase());
        sheetTargetM.clearContents();
        setSheetHeader(sheetTargetM, HEADERS_RINCIAN);

        if (postData.items.length > 0) {
          var rowsTargetM = postData.items.map(function(rb, idx) {
            return [
              rb.noUrut || (idx + 1),
              toTextCell(rb.kodeRekening),
              toTextCell(rb.kodeProgram),
              safeVal(rb.uraian),
              safeVal(rb.volume),
              safeVal(rb.satuan),
              rb.tarifHarga || 0,
              rb.jumlah || 0,
              rb.isHeader ? "true" : "false",
              safeVal(rb.bulan || tBulan),
              toTextCell(rb.tahun || "2026")
            ];
          });
          var rTargetM = sheetTargetM.getRange(2, 1, rowsTargetM.length, HEADERS_RINCIAN.length);
          rTargetM.setNumberFormat("@");
          rTargetM.setValues(rowsTargetM);
        }

        // Sinkronkan juga master RINCIAN_BELANJA
        combineMonthlySheetsToMaster();
        logs.push("RINCIAN_" + tBulan.toUpperCase() + " (" + postData.items.length + " item)");
      } catch (errTargetBulan) {
        logs.push("ERROR SAVE RINCIAN BULAN: " + errTargetBulan.toString());
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

// Fungsi Menu Tambahan: Distribusikan Master ke 12 Sheet Bulanan
function distributeRincianToMonthlySheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetMaster = ss.getSheetByName("RINCIAN_BELANJA");
  if (!sheetMaster || sheetMaster.getLastRow() <= 1) {
    try {
      var uiMaster = SpreadsheetApp.getUi();
      if (uiMaster) uiMaster.alert("Sheet RINCIAN_BELANJA masih kosong.");
    } catch (eM) {
      Logger.log("Master alert: " + eM.toString());
    }
    return;
  }

  var values = sheetMaster.getDataRange().getDisplayValues();
  for (var b = 0; b < BULAN_LIST.length; b++) {
    var bName = BULAN_LIST[b];
    var bNameLower = bName.toLowerCase();
    var rows = [];

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var rowBulan = (row[9] || "").trim().toLowerCase();
      if (rowBulan.indexOf(bNameLower) !== -1) {
        rows.push(row);
      }
    }

    var sheetM = getOrCreateSheet(ss, "RINCIAN_" + bName.toUpperCase());
    sheetM.clearContents();
    setSheetHeader(sheetM, HEADERS_RINCIAN);

    if (rows.length > 0) {
      var range = sheetM.getRange(2, 1, rows.length, HEADERS_RINCIAN.length);
      range.setNumberFormat("@");
      range.setValues(rows);
    }
  }

  try {
    var uiDist = SpreadsheetApp.getUi();
    if (uiDist) {
      uiDist.alert("Berhasil mendistribusikan data master ke seluruh 12 Sheet Bulanan (Januari s.d. Desember)!");
    }
  } catch (eDist) {
    Logger.log("Distribute alert: " + eDist.toString());
  }
}

// Fungsi Menu Tambahan: Gabungkan 12 Sheet Bulanan ke Sheet Master
function combineMonthlySheetsToMaster() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterRows = [];

  for (var b = 0; b < BULAN_LIST.length; b++) {
    var bName = BULAN_LIST[b];
    var sheetM = ss.getSheetByName("RINCIAN_" + bName.toUpperCase());
    if (sheetM && sheetM.getLastRow() > 1) {
      var values = sheetM.getDataRange().getDisplayValues();
      for (var r = 1; r < values.length; r++) {
        if (values[r][0] || values[r][3]) {
          masterRows.push(values[r]);
        }
      }
    }
  }

  if (masterRows.length > 0) {
    var sheetMaster = getOrCreateSheet(ss, "RINCIAN_BELANJA");
    sheetMaster.clearContents();
    setSheetHeader(sheetMaster, HEADERS_RINCIAN);

    var range = sheetMaster.getRange(2, 1, masterRows.length, HEADERS_RINCIAN.length);
    range.setNumberFormat("@");
    range.setValues(masterRows);
  }
}

// Format Seluruh Sheet
function formatAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var s = sheets[i];
    if (s.getLastRow() > 0) {
      s.setFrozenRows(1);
      var header = s.getRange(1, 1, 1, s.getLastColumn());
      header.setFontWeight("bold");
      header.setBackground("#1e293b");
      header.setFontColor("#ffffff");
      header.setHorizontalAlignment("center");
    }
  }
  try {
    var uiFmt = SpreadsheetApp.getUi();
    if (uiFmt) {
      uiFmt.alert("Seluruh sheet berhasil diformat rapi!");
    }
  } catch (eFmt) {
    Logger.log("Format alert: " + eFmt.toString());
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

  // Determine if any item has invalid or timestamp numbers (> 100000)
  const hasInvalidNo = list.some((t) => {
    const n = Number(t?.no);
    return !t?.no || isNaN(n) || n <= 0 || n > 100000;
  });

  if (!hasInvalidNo) {
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

  // Find max valid number (< 100000)
  const validNumbers = list
    .map((t) => Number(t?.no))
    .filter((n) => !isNaN(n) && n > 0 && n < 100000);

  let currentNo = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;

  return list.map((t, idx) => {
    const num = Number(t?.no);
    const isValid = !isNaN(num) && num > 0 && num < 100000;
    const cleanNo = isValid ? num : ++currentNo;
    const existingId = t && t.id !== undefined && t.id !== null ? String(t.id).trim() : '';
    return {
      ...t,
      id: existingId || `tx-${cleanNo}-${idx + 1}`,
      no: cleanNo,
    };
  });
}

export function getNextTransactionNo(list: any[]): number {
  if (!Array.isArray(list) || list.length === 0) return 1;
  const validNumbers = list
    .map((t) => Number(t?.no))
    .filter((n) => !isNaN(n) && n > 0 && n < 100000);
  if (validNumbers.length === 0) return 1;
  return Math.max(...validNumbers) + 1;
}

export function renumberTransactionsSequentially(list: any[]): any[] {
  if (!Array.isArray(list) || list.length === 0) return [];

  const parseDate = (dmy: string): number => {
    if (!dmy) return 0;
    const parts = String(dmy).split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
    }
    return new Date(dmy).getTime() || 0;
  };

  const sorted = [...list].sort((a, b) => {
    const timeA = parseDate(a.tanggal);
    const timeB = parseDate(b.tanggal);
    if (timeA !== timeB) return timeA - timeB;
    const rawNoA = Number(a.no) || 0;
    const rawNoB = Number(b.no) || 0;
    if (rawNoA < 100000 && rawNoB < 100000) {
      return rawNoA - rawNoB;
    }
    return 0;
  });

  return sorted.map((t, idx) => ({
    ...t,
    no: idx + 1,
  }));
}


