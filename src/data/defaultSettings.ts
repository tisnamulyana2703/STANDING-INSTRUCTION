import { SchoolSettings } from '../types';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  pemerintah: '',
  namaSekolah: '',
  alamatSekolah: '',
  bankTarget: '',
  bankBranch: '',
  noRekeningUtama: '',
  atasNamaRekening: '',
  sumberDana: '',
  kotaSurat: '',
  kepalaSekolah: {
    nama: '',
    jabatan: 'Kepala Sekolah',
    nik: '',
    alamat: '',
    hp: '',
    nip: '',
  },
  bendahara: {
    nama: '',
    jabatan: 'Bendahara Sekolah',
    nik: '',
    alamat: '',
    hp: '',
    nip: '',
  },
  logoKabupatenUrl: '',
  logoSekolahUrl: '',
};
