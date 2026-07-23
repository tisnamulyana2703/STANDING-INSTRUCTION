import React from 'react';
import { Transaction, SchoolSettings, StandingInstructionConfig } from '../types';
import { formatRupiah, terbilangRupiah, formatTitimangsa } from '../utils/terbilang';
import { LogoBandungBarat, LogoTutWuri } from './Logos';

interface StandingInstructionDocProps {
  settings: SchoolSettings;
  config: StandingInstructionConfig;
  items: Transaction[];
  documentRef?: React.RefObject<HTMLDivElement | null>;
}

export function StandingInstructionDoc({
  settings,
  config,
  items,
  documentRef,
}: StandingInstructionDocProps) {
  const totalNetto = items.reduce((acc, curr) => acc + (curr.netto || 0), 0);

  // Derived purpose if empty
  const purpose = config.tujuanPenggunaan || (items.length > 0 ? items[0].jenisTransaksi : 'Pembayaran Transfer');

  const pTop = config.marginTop ?? 10;
  const pBottom = config.marginBottom ?? 10;
  const pLeft = config.marginLeft ?? 15;
  const pRight = config.marginRight ?? 15;

  const fontClasses =
    config.fontSizeScale === 'compact'
      ? 'text-[10px] leading-tight'
      : config.fontSizeScale === 'large'
      ? 'text-[12px] leading-relaxed'
      : 'text-[11px] leading-snug';

  return (
    <div
      ref={documentRef}
      id="standing-instruction-document"
      className={`bg-white text-black mx-auto font-serif ${fontClasses}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        paddingTop: `${pTop}mm`,
        paddingBottom: `${pBottom}mm`,
        paddingLeft: `${pLeft}mm`,
        paddingRight: `${pRight}mm`,
        boxSizing: 'border-box',
        color: '#000000',
        backgroundColor: '#ffffff',
        margin: '0 auto',
      }}
    >
      {/* KOP SURAT HEADER */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b-2 border-black relative" style={{ borderColor: '#000000' }}>
        <div className="w-16 flex justify-center items-center">
          {settings.logoKabupatenUrl ? (
            <img src={settings.logoKabupatenUrl} alt="Logo Pemkab" className="w-16 h-20 object-contain" />
          ) : (
            <LogoBandungBarat className="w-16 h-20" />
          )}
        </div>

        <div className="text-center flex-1 px-3">
          <h2 className="text-sm font-bold tracking-wide uppercase leading-tight font-sans" style={{ color: '#000000' }}>
            {settings.pemerintah || 'PEMERINTAH KABUPATEN BANDUNG BARAT'}
          </h2>
          <h1 className="text-lg font-extrabold tracking-wider uppercase my-0.5 leading-tight font-sans" style={{ color: '#000000' }}>
            {settings.namaSekolah || 'SD NEGERI CIBURIAL'}
          </h1>
          <p className="text-[9.5px] leading-tight font-sans text-gray-800" style={{ color: '#1f2937' }}>
            Alamat : {settings.alamatSekolah}
          </p>
        </div>

        <div className="w-16 flex justify-center items-center">
          {settings.logoSekolahUrl ? (
            <img src={settings.logoSekolahUrl} alt="Logo Sekolah" className="w-16 h-20 object-contain" />
          ) : (
            <LogoTutWuri className="w-16 h-20" />
          )}
        </div>
      </div>
      <div className="border-b border-black mb-3" style={{ marginTop: '-2px', borderColor: '#000000' }}></div>

      {/* DOCUMENT TITLE */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-bold tracking-wider underline uppercase font-sans" style={{ color: '#000000' }}>
          STANDING INSTRUCTION
        </h3>
      </div>

      {/* RECIPIENT & METADATA SECTION */}
      <div className="grid grid-cols-12 gap-2 mb-3 font-sans text-[10.5px]">
        <div className="col-span-12 mb-1.5">
          <p className="font-bold">Kepada Yth.</p>
          <p className="font-bold">{settings.bankTarget}</p>
          <p className="font-bold">{settings.bankBranch}</p>
        </div>

        <div className="col-span-12 space-y-0.5">
          <div className="flex">
            <span className="w-24">Nomor</span>
            <span className="mr-2">:</span>
            <span className="font-semibold">{config.nomorSurat || '900.3.5.5/001-SDN-CBL/I/2025'}</span>
          </div>
          <div className="flex">
            <span className="w-24">Lampiran</span>
            <span className="mr-2">:</span>
            <span>{config.lampiran || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-24">Perihal</span>
            <span className="mr-2">:</span>
            <span className="font-semibold">{config.perihal || 'Permohonan Pemindah Bukuan'}</span>
          </div>
        </div>
      </div>

      {/* OFFICER TABLE INTRO */}
      <p className="mb-1 text-[10.5px]">Yang bertanda tangan di bawah ini,</p>
      
      {/* OFFICERS TABLE */}
      <div className="mb-3">
        <table className="w-full border-collapse text-[10px] text-center font-sans" style={{ border: '1px solid #000000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', color: '#000000' }} className="font-bold uppercase">
              <th style={{ border: '1px solid #000000', padding: '3px' }} className="w-8">NO</th>
              <th style={{ border: '1px solid #000000', padding: '3px' }} className="w-32">JABATAN</th>
              <th style={{ border: '1px solid #000000', padding: '3px' }} className="w-40">NAMA</th>
              <th style={{ border: '1px solid #000000', padding: '3px' }}>NIK dan ALAMAT</th>
              <th style={{ border: '1px solid #000000', padding: '3px' }} className="w-28">NO. HANDPHONE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="font-bold">1.</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="font-bold text-left">{settings.kepalaSekolah.jabatan}</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="font-bold text-left">{settings.kepalaSekolah.nama}</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="text-left">{settings.kepalaSekolah.nik}</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }}>{settings.kepalaSekolah.hp}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="font-bold">2.</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="font-bold text-left">{settings.bendahara.jabatan}</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="font-bold text-left">{settings.bendahara.nama}</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }} className="text-left">{settings.bendahara.nik}</td>
              <td style={{ border: '1px solid #000000', padding: '4px' }}>{settings.bendahara.hp}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ACCOUNT DETAILS */}
      <div className="space-y-0.5 mb-3 text-[10.5px] font-sans">
        <div className="flex">
          <span className="w-44">No Rekening</span>
          <span className="mr-2">:</span>
          <span className="font-bold">{settings.noRekeningUtama}</span>
        </div>
        <div className="flex">
          <span className="w-44">Atas Nama Rekening</span>
          <span className="mr-2">:</span>
          <span className="font-bold">{settings.atasNamaRekening}</span>
        </div>
        <div className="flex">
          <span className="w-44">Sumber Dana</span>
          <span className="mr-2">:</span>
          <span className="font-bold">{config.sumberDana || settings.sumberDana}</span>
        </div>
        <div className="flex">
          <span className="w-44">Tujuan penggunaan Dana</span>
          <span className="mr-2">:</span>
          <span className="font-bold">{purpose}</span>
        </div>
      </div>

      {/* INSTRUCTION STATEMENT */}
      <p className="mb-2 text-[10.5px] leading-relaxed">
        Mohon agar dilakukan pemindahbukuan/transfer dana dari Rekening Saya/Kami*) tersebut di atas sebagai berikut :
      </p>

      {/* MAIN BENEFICIARIES TABLE */}
      <div className="mb-3">
        <table className="w-full border-collapse text-[10px]" style={{ border: '1px solid #000000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', color: '#000000' }} className="text-center font-bold font-sans">
              <th style={{ border: '1px solid #000000', padding: '4px', width: '4%' }}>No</th>
              <th style={{ border: '1px solid #000000', padding: '4px', width: '22%' }}>Nama Penerima</th>
              <th style={{ border: '1px solid #000000', padding: '4px', width: '20%' }}>No. rekening Penerima*)</th>
              <th style={{ border: '1px solid #000000', padding: '4px', width: '8%' }}>Bank</th>
              <th style={{ border: '1px solid #000000', padding: '4px', width: '5%' }}>PPh</th>
              <th style={{ border: '1px solid #000000', padding: '4px', width: '5%' }}>PPN</th>
              <th style={{ border: '1px solid #000000', padding: '4px', width: '15%' }}>Netto</th>
              <th style={{ border: '1px solid #000000', padding: '4px', width: '21%' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id ? `si-doc-${item.id}-${idx}` : `si-doc-${idx}`}>
                <td style={{ border: '1px solid #000000', padding: '3px 4px' }} className="text-center font-sans">{idx + 1}</td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px' }} className="font-semibold uppercase">{item.namaPenerima}</td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px', whiteSpace: 'nowrap' }} className="text-center font-mono text-[9.5px]">{item.noRekPenerima || '-'}</td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px' }} className="text-center font-sans font-medium">{item.namaBank || 'BJB'}</td>
                <td style={{ border: '1px solid #000000', padding: '3px 2px' }} className="text-center">{item.pph || '-'}</td>
                <td style={{ border: '1px solid #000000', padding: '3px 2px' }} className="text-center">{item.ppn || '-'}</td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px', whiteSpace: 'nowrap' }} className="text-right font-semibold font-mono">
                  {formatRupiah(item.netto)}
                </td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px' }} className="italic text-[9.5px]">
                  {item.keterangan || item.deskripsiFull || purpose}
                </td>
              </tr>
            ))}
            {/* TOTAL ROW */}
            <tr style={{ backgroundColor: '#f9fafb', color: '#000000' }} className="font-bold text-[10.5px] font-sans">
              <td colSpan={6} style={{ border: '1px solid #000000', padding: '4px' }} className="text-center uppercase tracking-wider">
                Total
              </td>
              <td style={{ border: '1px solid #000000', padding: '4px', whiteSpace: 'nowrap' }} className="text-right font-mono text-black font-extrabold">
                {formatRupiah(totalNetto)}
              </td>
              <td style={{ border: '1px solid #000000', padding: '4px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TERBILANG BOX */}
      <div style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '6px 8px' }} className="mb-3 font-sans flex items-center">
        <span className="font-bold w-20 flex-shrink-0">Terbilang :</span>
        <span className="font-bold text-xs italic capitalize pl-1">
          {terbilangRupiah(totalNetto)}
        </span>
      </div>

      {/* TERMS AND DECLARATION */}
      <div className="mb-3 text-[10px] space-y-0.5 leading-normal font-sans">
        <p className="font-medium">Dengan adanya Standing Instruction ini maka :</p>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>
            Bank dibebaskan dari segala akibat yang mungkin timbul dari pelaksanaan pemindahbukuan berdasarkan Standing Instruction ini;
          </li>
          <li>
            Saya/Kami*) meyakini atas kebenaran data dan informasi pada Standing Instruction ini.
          </li>
        </ol>
        <p className="pt-0.5 text-justify">
          Demikian surat ini Saya/Kami*) buat untuk dipergunakan sebagai mana mestinya dan akibat apapun yang akan timbul dari pelaksanaan pemindahbukuan dan transfer berdasarkan Standing Instruction ini menjadi tanggung jawab kami.
        </p>
      </div>

      {/* SIGNATURE SECTION */}
      <div style={{ pageBreakInside: 'avoid' }} className="mt-4 font-sans">
        <div className="max-w-xl mx-auto">
          <div className="text-center ml-auto w-60 mb-0.5">
            <p>{settings.kotaSurat}, {formatTitimangsa(config.tanggalSurat)}</p>
            <p className="font-semibold">Pemohon</p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-center pt-1">
            <div>
              <p className="font-semibold">{settings.kepalaSekolah.jabatan},</p>
              <div className="h-14"></div>
              <p className="font-bold underline">{settings.kepalaSekolah.nama}</p>
              <p className="text-[9.5px]">NIP. {settings.kepalaSekolah.nip}</p>
            </div>

            <div>
              <p className="font-semibold">{settings.bendahara.jabatan},</p>
              <div className="h-14"></div>
              <p className="font-bold underline">{settings.bendahara.nama}</p>
              <p className="text-[9.5px]">NIP. {settings.bendahara.nip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTNOTES */}
      <div style={{ borderTop: '1px solid #d1d5db', pageBreakInside: 'avoid' }} className="mt-5 pt-2 text-[8.5px] text-gray-600 font-sans space-y-0.5">
        <p>*) Coret yang tidak perlu</p>
        <p>**) Rekening Penerima dapat lebih dari 1 (satu)</p>
        <p>***) Untuk instansi/perusahaan dibuat pada Kop Surat Instansi/perusahaan dan dibubuhkan stempel</p>
      </div>
    </div>
  );
}

