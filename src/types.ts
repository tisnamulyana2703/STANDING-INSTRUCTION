export interface Transaction {
  id: string;
  no: number;
  tanggal: string;
  jenisTransaksi: string;
  noSurat: string;
  namaPenerima: string;
  noRekPenerima: string;
  namaBank: string;
  pph: string;
  ppn: string;
  netto: number;
  siplah: string;
  noPo: string;
  keterangan: string;
  vendor: string;
  vendorAddress?: string;
  vendorHp?: string;
  vendorNpwp?: string;
  statusSi: string;
  bulan: string;
  tahun: string;
  deskripsiFull: string;
  kategori: string;
  tipeTransaksi?: 'MASUK' | 'KELUAR';
}

export interface Vendor {
  id: string;
  nama: string;
  alamat?: string;
  hp?: string;
  npwp?: string;
}

export interface OfficerInfo {
  nama: string;
  jabatan: string;
  nik: string;
  alamat: string;
  hp: string;
  nip: string;
}

export interface SchoolSettings {
  pemerintah: string;
  namaSekolah: string;
  alamatSekolah: string;
  bankTarget: string;
  bankBranch: string;
  noRekeningUtama: string;
  atasNamaRekening: string;
  sumberDana: string;
  kotaSurat: string;
  kepalaSekolah: OfficerInfo;
  bendahara: OfficerInfo;
  logoKabupatenUrl: string;
  logoSekolahUrl: string;
}

export interface StandingInstructionConfig {
  nomorSurat: string;
  lampiran: string;
  perihal: string;
  tujuanPenggunaan: string;
  tanggalSurat: string;
  sumberDana: string;
  notes: string;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  fontSizeScale?: 'compact' | 'normal' | 'large';
}

export interface PrintMarginConfig {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSizeScale: 'compact' | 'normal' | 'large';
}
