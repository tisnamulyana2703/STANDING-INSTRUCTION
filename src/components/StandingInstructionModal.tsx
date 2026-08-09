import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, SchoolSettings, StandingInstructionConfig } from '../types';
import { StandingInstructionDoc } from './StandingInstructionDoc';
import { formatTitimangsa } from '../utils/terbilang';
import { exportToPdf, printDocument } from '../utils/pdfGenerator';
import { Download, Printer, X, Sliders, CheckCircle2, ArrowLeft, Loader2, Filter, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';

interface StandingInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Transaction[];
  allTransactions?: Transaction[];
  settings: SchoolSettings;
}

export function StandingInstructionModal({
  isOpen,
  onClose,
  selectedItems,
  allTransactions = [],
  settings,
}: StandingInstructionModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  // Extract initial defaults from selected items or all transactions
  const activeSource = selectedItems.length > 0 ? selectedItems : allTransactions;
  const firstWithNoSurat = activeSource.find(
    (item) => item.tipeTransaksi !== 'MASUK' && String(item.noSurat || '').trim() !== ''
  ) || activeSource.find((item) => String(item.noSurat || '').trim() !== '');
  const firstItem = firstWithNoSurat || activeSource[0];

  const derivedNoSurat = firstItem?.noSurat ? String(firstItem.noSurat).trim() : '';
  const derivedPurpose = firstItem?.jenisTransaksi || 'Pembayaran Operasional BOSP';
  const derivedYear = firstItem?.tahun || new Date().getFullYear().toString();

  const [config, setConfig] = useState<StandingInstructionConfig>({
    nomorSurat: derivedNoSurat,
    lampiran: '-',
    perihal: 'Permohonan Pemindah Bukuan',
    tujuanPenggunaan: derivedPurpose,
    tanggalSurat: firstItem?.tanggal ? formatTitimangsa(firstItem.tanggal) : formatTitimangsa(''),
    sumberDana: `BOSP REGULER ${derivedYear}`,
    notes: '',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    fontSizeScale: 'normal',
  });

  // Extract outgoing transactions ONLY (Transaksi Keluar)
  const outgoingTransactions = useMemo(() => {
    const list = allTransactions.length > 0 ? allTransactions : selectedItems;
    return list.filter((t) => {
      const isMasuk =
        t.tipeTransaksi === 'MASUK' ||
        String(t.jenisTransaksi || '').toUpperCase().includes('SALUR') ||
        String(t.jenisTransaksi || '').toUpperCase().includes('PEMASUKAN') ||
        t.siplah === 'BOS SALUR';
      return !isMasuk;
    });
  }, [allTransactions, selectedItems]);

  // Unique No. Surat list ONLY for outgoing transactions
  const outgoingNoSuratList = useMemo(() => {
    const map = new Map<string, { noSurat: string; jenisTransaksi: string; tanggal: string; tahun: string }>();
    outgoingTransactions.forEach((t) => {
      const ns = String(t.noSurat || '').trim();
      if (ns && !map.has(ns.toLowerCase())) {
        map.set(ns.toLowerCase(), {
          noSurat: ns,
          jenisTransaksi: t.jenisTransaksi || '',
          tanggal: t.tanggal || '',
          tahun: t.tahun || '',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.noSurat.localeCompare(b.noSurat));
  }, [outgoingTransactions]);

  const handleSelectNoSurat = (selectedNoSurat: string) => {
    if (!selectedNoSurat || selectedNoSurat === 'CUSTOM') return;
    const match = outgoingTransactions.find(
      (t) => String(t.noSurat || '').trim().toLowerCase() === selectedNoSurat.trim().toLowerCase()
    );
    setConfig((prev) => ({
      ...prev,
      nomorSurat: selectedNoSurat,
      tujuanPenggunaan: match?.jenisTransaksi || prev.tujuanPenggunaan,
      tanggalSurat: match?.tanggal ? formatTitimangsa(match.tanggal) : prev.tanggalSurat,
      sumberDana: match?.tahun ? `BOSP REGULER ${match.tahun}` : prev.sumberDana,
    }));
  };

  // Sync if selected items change or modal opens
  useEffect(() => {
    if (isOpen) {
      const source = selectedItems.length > 0 ? selectedItems : outgoingTransactions;
      const matchWithNoSurat = source.find(
        (item) => item.tipeTransaksi !== 'MASUK' && String(item.noSurat || '').trim() !== ''
      ) || source.find((item) => String(item.noSurat || '').trim() !== '');

      if (matchWithNoSurat) {
        const targetNoSurat = String(matchWithNoSurat.noSurat).trim();
        setConfig((prev) => ({
          ...prev,
          nomorSurat: targetNoSurat,
          tujuanPenggunaan: matchWithNoSurat.jenisTransaksi || prev.tujuanPenggunaan,
          tanggalSurat: matchWithNoSurat.tanggal ? formatTitimangsa(matchWithNoSurat.tanggal) : prev.tanggalSurat,
          sumberDana: matchWithNoSurat.tahun ? `BOSP REGULER ${matchWithNoSurat.tahun}` : prev.sumberDana,
        }));
      }
    }
  }, [isOpen, selectedItems, outgoingTransactions]);

  // STRICTLY FILTER preview items by active config.nomorSurat without pulling unselected items
  const filteredItemsForDoc = useMemo(() => {
    if (selectedItems.length > 0) {
      const activeNoSurat = String(config.nomorSurat || '').trim();
      if (!activeNoSurat) {
        return selectedItems;
      }

      // Filter within selectedItems if activeNoSurat is matched
      const matchesFromSelected = selectedItems.filter(
        (t) => String(t.noSurat || '').trim().toLowerCase() === activeNoSurat.toLowerCase()
      );

      if (matchesFromSelected.length > 0) {
        return matchesFromSelected;
      }

      // If custom text entered or no exact match in selectedItems, strictly return selectedItems
      return selectedItems;
    }

    // Fallback ONLY if no items were selected via checkboxes
    const activeNoSurat = String(config.nomorSurat || '').trim();
    if (activeNoSurat && allTransactions.length > 0) {
      const matchesFromAll = allTransactions.filter(
        (t) => String(t.noSurat || '').trim().toLowerCase() === activeNoSurat.toLowerCase()
      );
      if (matchesFromAll.length > 0) {
        return matchesFromAll;
      }
    }

    return [];
  }, [config.nomorSurat, selectedItems, allTransactions]);

  // Check for items missing No. Rekening
  const itemsMissingNoRek = useMemo(() => {
    return filteredItemsForDoc.filter((item) => {
      const noRek = (item.noRekPenerima || '').trim();
      return !noRek || noRek === '-';
    });
  }, [filteredItemsForDoc]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (itemsMissingNoRek.length > 0) {
      const recipientNames = itemsMissingNoRek
        .map((item, idx) => `${idx + 1}. ${item.namaPenerima || 'Penerima Tanpa Nama'}`)
        .join('\n');
      alert(
        `⚠️ DOKUMEN TIDAK BISA DIUNDUH!\n\n` +
        `Terdapat ${itemsMissingNoRek.length} penerima dalam Surat Standing Instruction ini yang Nomor Rekeningnya belum diisi:\n\n` +
        `${recipientNames}\n\n` +
        `Mohon lengkapi Nomor Rekening seluruh penerima melalui tombol Edit pada Tabel Transaksi sebelum mengunduh PDF.`
      );
      return;
    }

    try {
      setIsExporting(true);
      const cleanSuratNum = config.nomorSurat.replace(/[\/\\]/g, '_');
      const filename = `Standing_Instruction_${cleanSuratNum}.pdf`;
      await exportToPdf('standing-instruction-document', filename, {
        marginTop: config.marginTop,
        marginBottom: config.marginBottom,
        marginLeft: config.marginLeft,
        marginRight: config.marginRight,
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Gagal mengunduh PDF. Silakan coba lagi atau gunakan tombol Cetak.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (itemsMissingNoRek.length > 0) {
      const recipientNames = itemsMissingNoRek
        .map((item, idx) => `${idx + 1}. ${item.namaPenerima || 'Penerima Tanpa Nama'}`)
        .join('\n');
      alert(
        `⚠️ DOKUMEN TIDAK BISA DICETAK!\n\n` +
        `Terdapat ${itemsMissingNoRek.length} penerima dalam Surat Standing Instruction ini yang Nomor Rekeningnya belum diisi:\n\n` +
        `${recipientNames}\n\n` +
        `Mohon lengkapi Nomor Rekening seluruh penerima melalui tombol Edit pada Tabel Transaksi sebelum mencetak Surat Standing Instruction.`
      );
      return;
    }

    printDocument('standing-instruction-document', {
      marginTop: config.marginTop,
      marginBottom: config.marginBottom,
      marginLeft: config.marginLeft,
      marginRight: config.marginRight,
    });
  };

  const handleExportExcel = async () => {
    if (filteredItemsForDoc.length === 0) {
      alert('Tidak ada transaksi yang dapat diexport.');
      return;
    }

    const namaSekolah = settings?.namaSekolah || 'SD NEGERI CIBORANG';
    const noSurat = config.nomorSurat || '-';
    const rawTglSurat = config.tanggalSurat || '-';
    const tglSuratFormatted = formatTitimangsa ? formatTitimangsa(rawTglSurat) : rawTglSurat;
    const perihal = config.perihal || 'Permohonan Pemindah Bukuan';
    const sumberDana = config.sumberDana || 'BOSP REGULER 2026';
    const totalNetto = filteredItemsForDoc.reduce((acc, curr) => acc + (Number(curr.netto) || 0), 0);

    const kepsek = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nama : (settings?.kepalaSekolah || 'NAMA KEPALA SEKOLAH');
    const nipKepsek = typeof settings?.kepalaSekolah === 'object' ? settings.kepalaSekolah.nip : '-';
    const bendahara = typeof settings?.bendahara === 'object' ? settings.bendahara.nama : (settings?.bendahara || 'NAMA BENDAHARA');
    const nipBendahara = typeof settings?.bendahara === 'object' ? settings.bendahara.nip : '-';

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Standing Instruction');

    // Ensure gridlines are visible in Excel
    worksheet.views = [{ showGridLines: true }];

    // Column widths
    worksheet.getColumn(1).width = 6;   // A: No
    worksheet.getColumn(2).width = 30;  // B: Nama Penerima
    worksheet.getColumn(3).width = 24;  // C: No. Rekening Penerima
    worksheet.getColumn(4).width = 10;  // D: Bank
    worksheet.getColumn(5).width = 8;   // E: PPh
    worksheet.getColumn(6).width = 8;   // F: PPN
    worksheet.getColumn(7).width = 22;  // G: Nominal Netto (Rp)
    worksheet.getColumn(8).width = 45;  // H: Uraian Belanja / Keterangan
    worksheet.getColumn(9).width = 20;  // I: Nama Vendor

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }, // Light gray background
    };

    // 1. Title Row (A1:I1)
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'SURAT STANDING INSTRUCTION (PERMOHONAN PEMINDAHBUKUAN)';
    titleCell.font = { name: 'Arial', size: 13, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 28;

    // 2. Blank Row 2
    worksheet.getRow(2).height = 10;

    // 3. Metadata (Rows 3 to 7)
    const metadata = [
      ['NAMA SEKOLAH', ':', namaSekolah],
      ['NOMOR SURAT', ':', noSurat],
      ['TANGGAL SURAT', ':', tglSuratFormatted],
      ['PERIHAL', ':', perihal],
      ['SUMBER DANA', ':', sumberDana],
    ];

    metadata.forEach((item, idx) => {
      const r = 3 + idx;
      const row = worksheet.getRow(r);
      row.height = 20;

      const cA = worksheet.getCell(`A${r}`);
      cA.value = item[0];
      cA.font = { name: 'Arial', size: 10, bold: true };
      cA.alignment = { horizontal: 'left', vertical: 'middle' };

      const cB = worksheet.getCell(`B${r}`);
      cB.value = item[1];
      cB.font = { name: 'Arial', size: 10, bold: true };
      cB.alignment = { horizontal: 'center', vertical: 'middle' };

      const cC = worksheet.getCell(`C${r}`);
      cC.value = item[2];
      cC.font = { name: 'Arial', size: 10 };
      cC.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    // 4. Blank Row 8
    worksheet.getRow(8).height = 12;

    // 5. Table Header (Row 9)
    const headers = [
      'No',
      'Nama Penerima',
      'No. Rekening Penerima',
      'Bank',
      'PPh',
      'PPN',
      'Nominal Netto (Rp)',
      'Uraian Belanja / Keterangan',
      'Nama Vendor',
    ];

    const headerRow = worksheet.getRow(9);
    headerRow.height = 28;

    headers.forEach((h, colIdx) => {
      const cell = headerRow.getCell(colIdx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = headerFill;
      cell.border = thinBorder;
    });

    // 6. Data Rows (starting row 10)
    let currentRow = 10;

    filteredItemsForDoc.forEach((item, index) => {
      const row = worksheet.getRow(currentRow);
      row.height = 24;

      const noRekStr = String(item.noRekPenerima || '-').trim();
      const vendorStr = item.vendor && item.vendor.trim() !== '' && item.vendor !== '-' ? item.vendor.trim() : 'NON SIPLAH';
      const ketStr = item.keterangan || item.deskripsiFull || config.tujuanPenggunaan || '-';

      const rowValues = [
        index + 1,
        (item.namaPenerima || '-').toUpperCase(),
        noRekStr,
        (item.namaBank || 'BJB').toUpperCase(),
        item.pph || '-',
        item.ppn || '-',
        Number(item.netto) || 0,
        ketStr,
        vendorStr,
      ];

      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 10 };
        cell.border = thinBorder;

        if (colIdx === 0) { // No
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIdx === 1) { // Nama Penerima
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colIdx === 2) { // No Rekening
          cell.numFmt = '@';
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIdx === 3 || colIdx === 4 || colIdx === 5) { // Bank, PPh, PPN
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIdx === 6) { // Netto
          cell.numFmt = '#,##0';
          cell.font = { name: 'Arial', size: 10, bold: true };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else if (colIdx === 7) { // Keterangan
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        } else if (colIdx === 8) { // Vendor
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      currentRow++;
    });

    // 7. Total Row
    const totalRow = worksheet.getRow(currentRow);
    totalRow.height = 26;

    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const cTotalLabel = totalRow.getCell(1);
    cTotalLabel.value = 'TOTAL';
    cTotalLabel.font = { name: 'Arial', size: 10, bold: true };
    cTotalLabel.alignment = { horizontal: 'center', vertical: 'middle' };

    const cTotalNetto = totalRow.getCell(7);
    cTotalNetto.value = totalNetto;
    cTotalNetto.numFmt = '#,##0';
    cTotalNetto.font = { name: 'Arial', size: 10, bold: true };
    cTotalNetto.alignment = { horizontal: 'right', vertical: 'middle' };

    // Apply borders and fill for total row across A to I
    for (let col = 1; col <= 9; col++) {
      const cell = totalRow.getCell(col);
      cell.fill = headerFill;
      cell.border = thinBorder;
    }

    currentRow++;

    // 8. Signatures Block
    currentRow += 2; // Leave blank rows

    const sigRow1 = worksheet.getRow(currentRow);
    sigRow1.height = 20;

    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const sigLabel1 = sigRow1.getCell(1);
    sigLabel1.value = 'Mengetahui,';
    sigLabel1.font = { name: 'Arial', size: 10 };
    sigLabel1.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    const sigLabel2 = sigRow1.getCell(7);
    sigLabel2.value = 'Disetujui Oleh,';
    sigLabel2.font = { name: 'Arial', size: 10 };
    sigLabel2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow++;
    const sigRow2 = worksheet.getRow(currentRow);
    sigRow2.height = 20;

    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const sigRole1 = sigRow2.getCell(1);
    sigRole1.value = 'Kepala Sekolah';
    sigRole1.font = { name: 'Arial', size: 10 };
    sigRole1.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    const sigRole2 = sigRow2.getCell(7);
    sigRole2.value = 'Bendahara Sekolah';
    sigRole2.font = { name: 'Arial', size: 10 };
    sigRole2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow += 4; // Signature space

    const sigRow3 = worksheet.getRow(currentRow);
    sigRow3.height = 20;

    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const sigName1 = sigRow3.getCell(1);
    sigName1.value = `(${kepsek})`;
    sigName1.font = { name: 'Arial', size: 10, bold: true, underline: true };
    sigName1.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    const sigName2 = sigRow3.getCell(7);
    sigName2.value = `(${bendahara})`;
    sigName2.font = { name: 'Arial', size: 10, bold: true, underline: true };
    sigName2.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow++;
    const sigRow4 = worksheet.getRow(currentRow);
    sigRow4.height = 20;

    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const sigNip1 = sigRow4.getCell(1);
    sigNip1.value = `NIP. ${nipKepsek}`;
    sigNip1.font = { name: 'Arial', size: 10 };
    sigNip1.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    const sigNip2 = sigRow4.getCell(7);
    sigNip2.value = `NIP. ${nipBendahara}`;
    sigNip2.font = { name: 'Arial', size: 10 };
    sigNip2.alignment = { horizontal: 'left', vertical: 'middle' };

    // Write to buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const cleanNoSurat = noSurat.replace(/[/\\?%*:|"<>]/g, '_');
    anchor.download = `Standing_Instruction_${cleanNoSurat}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* TOP BAR */}
        <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Preview Standing Instruction
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {filteredItemsForDoc.length} Penerima (No. Surat Filtered)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumen resmi permohonan pemindahbukuan ke Bank BJB khusus Nomor Surat ini
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-export-excel-si"
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors border cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/80"
              title="Export Surat Standing Instruction ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Export Excel (.xlsx)
            </button>

            <button
              id="btn-print-si"
              onClick={handlePrint}
              className={`inline-flex items-center px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors border cursor-pointer ${
                itemsMissingNoRek.length > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100'
                  : 'text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Document {itemsMissingNoRek.length > 0 ? '(⚠️ Belum Bisa)' : ''}
            </button>

            <button
              id="btn-download-pdf-si"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className={`inline-flex items-center px-4 py-2.5 text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer ${
                itemsMissingNoRek.length > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" />
                  Unduh PDF {itemsMissingNoRek.length > 0 ? '(⚠️ Belum Bisa)' : ''}
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WARNING BANNER WHEN NO REKENING IS MISSING */}
        {itemsMissingNoRek.length > 0 && (
          <div className="bg-rose-600 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
            <div className="flex items-center gap-2.5 font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 animate-bounce" />
              <div>
                <span className="font-extrabold text-amber-200">⚠️ TIDAK BISA DICETAK: </span>
                <span>Terdapat {itemsMissingNoRek.length} penerima yang Nomor Rekeningnya masih kosong ({itemsMissingNoRek.map(i => i.namaPenerima).join(', ')}).</span>
              </div>
            </div>
            <span className="text-[11px] bg-white text-rose-800 font-extrabold px-3 py-1 rounded-lg border border-rose-200 shadow-2xs">
              Lengkapi No. Rekening Melalui Tombol Edit
            </span>
          </div>
        )}

        {/* CONTENT SPLIT: LEFT FORM SETTINGS, RIGHT LIVE A4 DOCUMENT */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* CONFIGURATION SIDEBAR - BENTO PANEL */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-fit">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pengaturan Parameter Surat
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* NO SURAT INPUT / DROPDOWN SELECTOR FOR OUTGOING TRANSACTIONS */}
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Nomor Surat (Transaksi Keluar)</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    {filteredItemsForDoc.length} penerima
                  </span>
                </label>

                {outgoingNoSuratList.length > 0 ? (
                  <select
                    value={
                      outgoingNoSuratList.some(
                        (opt) => opt.noSurat.toLowerCase() === String(config.nomorSurat || '').trim().toLowerCase()
                      )
                        ? outgoingNoSuratList.find(
                            (opt) => opt.noSurat.toLowerCase() === String(config.nomorSurat || '').trim().toLowerCase()
                          )?.noSurat
                        : 'CUSTOM'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'CUSTOM') {
                        handleSelectNoSurat(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs cursor-pointer"
                  >
                    <option value="CUSTOM">-- Pilih No. Surat (Transaksi Keluar) --</option>
                    {outgoingNoSuratList.map((opt) => (
                      <option key={opt.noSurat} value={opt.noSurat}>
                        {opt.noSurat} {opt.jenisTransaksi ? `• ${opt.jenisTransaksi}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                    Belum ada Nomor Surat transaksi keluar.
                  </div>
                )}

                <input
                  type="text"
                  value={config.nomorSurat}
                  onChange={(e) => setConfig({ ...config, nomorSurat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  placeholder="Ketik kustom nomor surat..."
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Surat
                </label>
                <input
                  type="text"
                  value={config.tanggalSurat}
                  onChange={(e) => setConfig({ ...config, tanggalSurat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: 22 Januari 2025"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tujuan Penggunaan Dana
                </label>
                <input
                  type="text"
                  value={config.tujuanPenggunaan}
                  onChange={(e) => setConfig({ ...config, tujuanPenggunaan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Pembayaran Honor"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sumber Dana
                </label>
                <input
                  type="text"
                  value={config.sumberDana}
                  onChange={(e) => setConfig({ ...config, sumberDana: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: BOSP REGULER 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    value={config.lampiran}
                    onChange={(e) => setConfig({ ...config, lampiran: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Perihal
                  </label>
                  <input
                    type="text"
                    value={config.perihal}
                    onChange={(e) => setConfig({ ...config, perihal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* MARGIN & PRINT SETTINGS SECTION */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    📐 Pengaturan Margin Cetak (mm)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        marginTop: 10,
                        marginBottom: 10,
                        marginLeft: 15,
                        marginRight: 15,
                        fontSizeScale: 'normal',
                      })
                    }
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Atas (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginTop ?? 10}
                      onChange={(e) =>
                        setConfig({ ...config, marginTop: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Bawah (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginBottom ?? 10}
                      onChange={(e) =>
                        setConfig({ ...config, marginBottom: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Kiri (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginLeft ?? 15}
                      onChange={(e) =>
                        setConfig({ ...config, marginLeft: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Margin Kanan (mm)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={40}
                      value={config.marginRight ?? 15}
                      onChange={(e) =>
                        setConfig({ ...config, marginRight: parseInt(e.target.value, 10) || 5 })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kepadatan Teks Dokumen
                  </label>
                  <select
                    value={config.fontSizeScale || 'normal'}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        fontSizeScale: e.target.value as 'compact' | 'normal' | 'large',
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                  >
                    <option value="compact">Ringkas (Banyak data / 1 Halaman)</option>
                    <option value="normal">Normal Standar A4</option>
                    <option value="large">Besar / Renggang</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Filter Otomatis:</strong> Dokumen SI ini hanya menampilkan transaksi yang memiliki No. Surat persis sama dengan parameter Nomor Surat di atas.
                </p>
              </div>
            </div>
          </div>

          {/* LIVE A4 CANVAS PREVIEW */}
          <div className="lg:col-span-8 flex flex-col items-center overflow-x-auto pb-6">
            {filteredItemsForDoc.length === 0 ? (
              <div className="w-full max-w-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center text-amber-900 dark:text-amber-200 my-10 space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                <p className="font-bold text-sm">Tidak Ada Transaksi untuk No. Surat Ini</p>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Tidak ditemukan transaksi yang sesuai dengan Nomor Surat <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded font-bold">{config.nomorSurat}</code>. Pilih No. Surat dari dropdown di bilah kiri.
                </p>
              </div>
            ) : (
              <div className="transform scale-[0.82] sm:scale-90 origin-top shadow-xl">
                <StandingInstructionDoc
                  settings={settings}
                  config={config}
                  items={filteredItemsForDoc}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

