import { SchoolSettings } from '../types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  pemerintah: 'PEMERINTAH KABUPATEN BANDUNG BARAT',
  namaSekolah: 'SD NEGERI CIBURIAL',
  alamatSekolah: 'Jl. Tangkuban Parahu Kp. Ciburial RT 02 RW 04 Desa Cibogo Kecamatan Lembang Kabupaten Bandung Barat Kode Pos 40391',
  bankTarget: 'PT. Bank Pembangunan Daerah Jawa Barat & Banten, Tbk',
  bankBranch: 'Kantor Cabang Lembang',
  noRekeningUtama: '0120015095100',
  atasNamaRekening: '20207938 SD NEGERI CIBURIAL',
  sumberDana: 'BOSP REGULER 2026',
  kotaSurat: 'Lembang',
  kepalaSekolah: {
    nama: 'CARNIA, S.Pd',
    jabatan: 'Kepala Sekolah',
    nik: '3217016012710001 - Kp. Langensari RT 01 RW 12',
    alamat: 'Kp. Langensari RT 01 RW 12',
    hp: '08812241845',
    nip: '197112201997032002',
  },
  bendahara: {
    nama: 'Siti Rukmah, S.Pd.SD',
    jabatan: 'Bendahara Sekolah',
    nik: '3217014202670007 - Kp. Ciburial RT 01 RW 05',
    alamat: 'Kp. Ciburial RT 01 RW 05',
    hp: '081809200216',
    nip: '196702022008012006',
  },
  logoKabupatenUrl: '', // Default svg or inline logo fallback
  logoSekolahUrl: '',   // Default svg or inline logo fallback
};
