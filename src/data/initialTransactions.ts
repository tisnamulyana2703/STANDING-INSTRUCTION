import { Transaction } from '../types';

export const RAW_DATA_TEXT = `NO\tTANGGAL\tJENIS TRANSAKSI\tNO.  SURAT\tNAMA PENERIMA\tNO. REK PENERIMA\tNAMA BANK\tPPh\tPPN\tNETTO\tSIPLAH\tNO. PO\tKETERANGAN\tVENDOR\tSTATUS SI\tBULAN\tTAHUN\tDESKRIPSI_FULL\tKATEGORI
1\t17/01/2024\tBOSP SALUR\t240221302000130\tSaldo awal BOS 2024 TAHAP 1\t0120015095100\tBJB\t-\t-\t147.360.000\tBOS SALUR\t\tBOSP Salur Tahap 1\tBOS SALUR\tSALUR\tJanuari\t2024\tPembayaran BOS SALUR BOSP Salur Tahap 1\t
2\t18/01/2024\tPembayaran Honor\t900/003/SDCBL/I/2024\tJULAEHA\t0122211231101\tBJB\t-\t-\t2.500.000\tHonor\t\tBulan Januari 2024\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Honor Bulan Januari 2024\tJASA KANTOR
3\t18/01/2024\tPembayaran Honor\t900/003/SDCBL/I/2024\tYUNI SISKA HANDAYANI\t0108236671100\tBJB\t-\t-\t1.800.000\tHonor\t\tBulan Januari 2024\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Honor Bulan Januari 2024\tJASA KANTOR
4\t18/01/2024\tPembayaran Honor\t900/003/SDCBL/I/2024\tZAIDAN MUHAMMAD ZAINUDIN\t0122314944100\tBJB\t-\t-\t1.500.000\tHonor\t\tBulan Januari 2024\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Honor Bulan Januari 2024\tJASA KANTOR
5\t18/01/2024\tPembayaran Honor\t900/003/SDCBL/I/2024\tZAHRA AULIA NUR RODIAH\t0132561176100\tBJB\t-\t-\t1.000.000\tHonor\t\tBulan Januari 2024\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Honor Bulan Januari 2024\tJASA KANTOR
6\t18/01/2024\tPembayaran Honor\t900/003/SDCBL/I/2024\tTISNA MULYANA\t0106234000100\tBJB\t-\t-\t2.500.000\tHonor\t\tBulan Januari 2024\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Honor Bulan Januari 2024\tJASA KANTOR
7\t18/01/2024\tPembayaran Honor\t900/003/SDCBL/I/2024\tDESIMAH RATNASARI\t0082719318100\tBJB\t-\t-\t1.000.000\tHonor\t\tBulan Januari 2024\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Honor Bulan Januari 2024\tJASA KANTOR
8\t18/01/2024\tPembayaran Honor\t900/003/SDCBL/I/2024\tTIARA FEBRIANTI\t0139528931100\tBJB\t-\t-\t840.000\tHonor\t\tBulan Januari 2024\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Honor Bulan Januari 2024\tJASA KANTOR
9\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Toko Ladang\t1845000002791311\tBJB\t-\t-\t500.000\tToko Ladang\tPO65AF1A4418431\tAdministrasi PJOK\tBERDIRI\tSUDAH\tJanuari\t2024\tPembayaran Toko Ladang Siplah dengan No.PO. PO65AF1A4418431 (Administrasi PJOK)\tJASA KANTOR
10\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Toko Ladang\t1845000002791364\tBJB\t-\t-\t715.000\tToko Ladang\tPO65AF1B1E5326B\tPembayaran Langganan Internet\tBERDIRI\tSUDAH\tJanuari\t2024\tPembayaran Toko Ladang Siplah dengan No.PO. PO65AF1B1E5326B (Pembayaran Langganan Internet)\tJASA KANTOR
11\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Toko Ladang\t1845000002793088\tBJB\t-\t-\t200.000\tToko Ladang\tPO65AF37C6E0321\tPembayaran Tagihan Listrik\tBERDIRI\tSUDAH\tJanuari\t2024\tPembayaran Toko Ladang Siplah dengan No.PO. PO65AF37C6E0321 (Pembayaran Tagihan Listrik)\tJASA KANTOR
12\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654024\tBRI\t-\t-\t200.000\tBli Bli\tS10005654024\tPengembangan pembelajaran berbasis projek (termasuk P5)\tCV NUHASGY ABDI JAYA\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654024 (Pengembangan pembelajaran berbasis projek (termasuk P5))\tHABIS PAKAI
13\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654036\tBRI\t-\t-\t600.000\tBli Bli\tS10005654036\tPengembangan pembelajaran berbasis projek (termasuk P5)\tKINARA STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654036 (Pengembangan pembelajaran berbasis projek (termasuk P5))\tJASA KANTOR
14\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654050\tBRI\t-\t-\t600.000\tBli Bli\tS10005654050\tPenyusunan Pembagian Tugas Guru dan Jadwal Pelajaran\tKINARA STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654050 (Penyusunan Pembagian Tugas Guru dan Jadwal Pelajaran)\tJASA KANTOR
15\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654081\tBRI\t-\t-\t973.000\tBli Bli\tS10005654081\tPenyusunan perencanaan program satuan pendidikan (Visi Misi Sekolah, RKJM, RKT, RKAS)\tCV NUHASGY ABDI JAYA\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654081 (Penyusunan perencanaan program satuan pendidikan (Visi Misi Sekolah, RKJM, RKT, RKAS))\tHABIS PAKAI
16\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654093\tBRI\t-\t-\t600.000\tBli Bli\tS10005654093\tPenyusunan perencanaan program satuan pendidikan (Visi Misi Sekolah, RKJM, RKT, RKAS)\tKINARA STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654093 (Penyusunan perencanaan program satuan pendidikan (Visi Misi Sekolah, RKJM, RKT, RKAS))\tJASA KANTOR
17\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654195\tBRI\t-\t-\t375.000\tBli Bli\tS10005654195\tPendataan ulang bagi Peserta Didik lama\tKINARA STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654195 (Pendataan ulang bagi Peserta Didik lama)\tJASA KANTOR
18\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654251\tBRI\t-\t-\t750.000\tBli Bli\tS10005654251\tPembelian Bahan Habis Pakai (termasuk Suku Cadang Alat) untuk Kegiatan Rumah Tangga Sekolah\tCV NUHASGY ABDI JAYA\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654251 (Pembelian Bahan Habis Pakai (termasuk Suku Cadang Alat) untuk Kegiatan Rumah Tangga Sekolah)\tPEMELIHARAAN ALAT DAN MESIN
19\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654272\tBRI\t-\t-\t1.577.000\tBli Bli\tS10005654272\tPelaksanaan penilaian formatif (ulangan harian)\tCV NUHASGY ABDI JAYA\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654272 (Pelaksanaan penilaian formatif (ulangan harian))\tJASA KANTOR
20\t24/01/2024\tPembelanjaan Siplah\t900/004/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1022610005654821\tBRI\t-\t-\t833.000\tBli Bli\tS10005654821\tPembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb)\tCV ADZARDI MEDIA TECHNOLOGY\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005654821 (Pembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb))\tHABIS PAKAI
21\t30/01/2024\tPembelanjaan Siplah\t900/005/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005670694\tBRI\t-\t-\t600.000\tBli Bli\tS10005670694\tPelaksanaan kegiatan komunitas belajar di satuan pendidikan\tKINARA STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005670694 (Pelaksanaan kegiatan komunitas belajar di satuan pendidikan)\tJASA KANTOR
22\t30/01/2024\tPembelanjaan Siplah\t900/005/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005670705\tBRI\t-\t-\t600.000\tBli Bli\tS10005670705\tPengembangan diri guru dan tenaga kependidikan materi lain di luar PMM\tKINARA STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005670705 (Pengembangan diri guru dan tenaga kependidikan materi lain di luar PMM)\tJASA KANTOR
23\t30/01/2024\tPembelanjaan Siplah\t900/005/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005670711\tBRI\t-\t-\t375.000\tBli Bli\tS10005670711\tKonsumsi Rapat Kedinasan dan Tamu Sekolah (diluar kegiatan lain)\tKINARA STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005670711 (Konsumsi Rapat Kedinasan dan Tamu Sekolah (diluar kegiatan lain))\tJASA KANTOR
24\t30/01/2024\tPembelanjaan Siplah\t900/005/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005670772\tBRI\t-\t-\t2.450.000\tBli Bli\tS10005670772\tPembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb)\tCV NUHASGY ABDI JAYA\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005670772 (Pembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb))\tHABIS PAKAI
25\t30/01/2024\tPembelanjaan Siplah\t900/005/SDCBL/I/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005670905\tBRI\t-\t-\t1.196.000\tBli Bli\tS10005670905\tPembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah\tJH STORE\tSUDAH\tJanuari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005670905 (Pembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah)\tHABIS PAKAI
26\t30/01/2024\tPembayaran Transport\t900/005/SDCBL/I/2024\tDella Juliana Rismalinda\t0088310055100\tBJB\t-\t-\t150.000\tNon Siplah\t\tBeban Perjalanan Dinas Dalam Kota/Daerah - Biaya Perjalanan Dinas Dalam Kota/Daerah\tNON SIPLAH\tSUDAH\tJanuari\t2024\tPembayaran Non Siplah Beban Perjalanan Dinas Dalam Kota/Daerah - Biaya Perjalanan Dinas Dalam Kota/Daerah\tPERJALANAN DINAS
27\t01/02/2024\tPembayaran Honor\t900/006/SDCBL/II/2024\tJULAEHA\t0122211231101\tBJB\t-\t-\t2.500.000\tHonor\t\t Honor Bulan Februari 2024\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Honor  Honor Bulan Februari 2024\tJASA KANTOR
28\t01/02/2024\tPembayaran Honor\t900/006/SDCBL/II/2024\tYUNI SISKA HANDAYANI\t0108236671100\tBJB\t-\t-\t1.800.000\tHonor\t\t Honor Bulan Februari 2024\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Honor  Honor Bulan Februari 2024\tJASA KANTOR
29\t01/02/2024\tPembayaran Honor\t900/006/SDCBL/II/2024\tZAIDAN MUHAMMAD ZAINUDIN\t0122314944100\tBJB\t-\t-\t1.500.000\tHonor\t\t Honor Bulan Februari 2024\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Honor  Honor Bulan Februari 2024\tJASA KANTOR
30\t01/02/2024\tPembayaran Honor\t900/006/SDCBL/II/2024\tZAHRA AULIA NUR RODIAH\t0132561176100\tBJB\t-\t-\t1.000.000\tHonor\t\t Honor Bulan Februari 2024\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Honor  Honor Bulan Februari 2024\tJASA KANTOR
31\t01/02/2024\tPembayaran Honor\t900/006/SDCBL/II/2024\tTISNA MULYANA\t0106234000100\tBJB\t-\t-\t2.500.000\tHonor\t\t Honor Bulan Februari 2024\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Honor  Honor Bulan Februari 2024\tJASA KANTOR
32\t01/02/2024\tPembayaran Honor\t900/006/SDCBL/II/2024\tDESIMAH RATNASARI\t0082719318100\tBJB\t-\t-\t1.000.000\tHonor\t\t Honor Bulan Februari 2024\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Honor  Honor Bulan Februari 2024\tJASA KANTOR
33\t01/02/2024\tPembayaran Honor\t900/006/SDCBL/II/2024\tTIARA FEBRIANTI\t0139528931100\tBJB\t-\t-\t960.000\tHonor\t\t Honor Bulan Februari 2024\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Honor  Honor Bulan Februari 2024\tJASA KANTOR
34\t12/02/2024\tPembelanjaan Siplah\t900/007/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Toko Ladang\t1845000002860335\tBJB\t-\t-\t200.000\tToko Ladang\tPO65C05D3FF1B4B\t daya listrik\tBERDIRI\tSUDAH\tFebruari\t2024\tPembayaran Toko Ladang Siplah dengan No.PO. PO65C05D3FF1B4B ( daya listrik)\tJASA KANTOR
35\t12/02/2024\tPembelanjaan Siplah\t900/007/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Toko Ladang\t1845000002860341\tBJB\t-\t-\t715.000\tToko Ladang\tPO65C05D5B2558D\t jasa internet\tBERDIRI\tSUDAH\tFebruari\t2024\tPembayaran Toko Ladang Siplah dengan No.PO. PO65C05D5B2558D ( jasa internet)\tJASA KANTOR
36\t12/02/2024\tPembelanjaan Siplah\t900/007/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005693395\tBRI\t-\t-\t1.357.000\tBli Bli\tS10005693395\tPelaksanaan penilaian formatif (ulangan harian)\tCV NUHASGY ABDI JAYA\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005693395 (Pelaksanaan penilaian formatif (ulangan harian))\tJASA KANTOR
37\t12/02/2024\tPembelanjaan Siplah\t900/007/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005693418\tBRI\t-\t-\t222.000\tBli Bli\tS10005693418\tPengembangan pembelajaran berbasis projek (termasuk P5)\tCV ADZARDI MEDIA TECHNOLOGY\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005693418 (Pengembangan pembelajaran berbasis projek (termasuk P5))\tHABIS PAKAI
38\t12/02/2024\tPembelanjaan Siplah\t900/007/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005693610\tBRI\t-\t-\t1.630.000\tBli Bli\tS10005693610\tPerayaan Hari Besar Agama, Nasional, dan Daerah, Bea materai, administrasi bank, Bahan Cetak-Cetak Foto.\tCV NUHASGY ABDI JAYA\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005693610 (Perayaan Hari Besar Agama, Nasional, dan Daerah, Bea materai, administrasi bank, Bahan Cetak-Cetak Foto.)\tJASA KANTOR
39\t12/02/2024\tPembelanjaan Siplah\t900/007/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005693649\tBRI\t-\t-\t348.000\tBli Bli\tS10005693649\tPembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb)\tCV ADZARDI MEDIA TECHNOLOGY\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005693649 (Pembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb))\tHABIS PAKAI
40\t12/02/2024\tPendaftaran Lomba\t900/007/SDCBL/II/2024\tPanitia Lomba Tingkat Kecamatan\t0099464623100\tBJB\t-\t-\t1.800.000\tNon Siplah\t\tPanitia Lomba Tingkat Kecamatan\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Non Siplah Panitia Lomba Tingkat Kecamatan\tKURSUS PELATIHAN / BIMTEK
41\t12/02/2024\tPembayaran Transport\t900/007/SDCBL/II/2024\tYUNI SISKA HANDAYANI\t0108236671100\tBJB\t-\t-\t600.000\tNon Siplah\t\tBeban Perjalanan Dinas Dalam Kota/Daerah - Biaya Perjalanan Dinas Dalam Kota/Daerah\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Non Siplah Beban Perjalanan Dinas Dalam Kota/Daerah - Biaya Perjalanan Dinas Dalam Kota/Daerah\tPERJALANAN DINAS
42\t12/02/2024\tPembayaran Transport\t900/007/SDCBL/II/2024\tDella Juliana Rismalinda\t0088310055100\tBJB\t-\t-\t150.000\tNon Siplah\t\tBeban Perjalanan Dinas Dalam Kota/Daerah - Biaya Perjalanan Dinas Dalam Kota/Daerah\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Non Siplah Beban Perjalanan Dinas Dalam Kota/Daerah - Biaya Perjalanan Dinas Dalam Kota/Daerah\tPERJALANAN DINAS
43\t22/02/2024\tPembelanjaan Siplah\t900/008/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005739892\tBRI\t-\t-\t600.000\tBli Bli\tS10005739892\tPengembangan pembelajaran berbasis projek (termasuk P5)\tKINARA STORE\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005739892 (Pengembangan pembelajaran berbasis projek (termasuk P5))\tJASA KANTOR
44\t22/02/2024\tPembelanjaan Siplah\t900/008/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005739903\tBRI\t-\t-\t315.000\tBli Bli\tS10005739903\tPelaksanaan Lomba Lomba\tKINARA STORE\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005739903 (Pelaksanaan Lomba Lomba)\tJASA KANTOR
45\t22/02/2024\tPembelanjaan Siplah\t900/008/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005739978\tBRI\t-\t-\t600.000\tBli Bli\tS10005739978\tKonsumsi Kegiatan PHBA\tKINARA STORE\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005739978 (Konsumsi Kegiatan PHBA)\tJASA KANTOR
46\t22/02/2024\tPembelanjaan Siplah\t900/008/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005740068\tBRI\t-\t-\t600.000\tBli Bli\tS10005740068\tKonsumsi PHBN\tKINARA STORE\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005740068 (Konsumsi PHBN)\tJASA KANTOR
47\t22/02/2024\tPembelanjaan Siplah\t900/008/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005740071\tBRI\t-\t-\t375.000\tBli Bli\tS10005740071\tKonsumsi Rapat Kedinasan dan Tamu Sekolah (diluar kegiatan lain)\tKINARA STORE\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005740071 (Konsumsi Rapat Kedinasan dan Tamu Sekolah (diluar kegiatan lain))\tJASA KANTOR
48\t22/02/2024\tPembayaran Workshop\t900/008/SDCBL/II/2024\tKKG Gugus TANGKUBAN PERAHU\t0136637691100\tBJB\t-\t-\t400.000\tNon Siplah\t\tWorkshop\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Non Siplah Workshop\tKURSUS PELATIHAN / BIMTEK
49\t22/02/2024\tPembayaran Workshop\t900/008/SDCBL/II/2024\tKKG Gugus TANGKUBAN PERAHU\t0136637691100\tBJB\t-\t-\t400.000\tNon Siplah\t\tWorkshop\tNON SIPLAH\tSUDAH\tFebruari\t2024\tPembayaran Non Siplah Workshop\tKURSUS PELATIHAN / BIMTEK
50\t22/02/2024\tPembelanjaan Siplah\t900/008/SDCBL/II/2024\tSD NEGERI CIBURIAL- SIPLah Blibli\t1473410005744709\tBRI\t-\t-\t464.000\tBli Bli\tS10005744709\tPembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah\tJH STORE\tSUDAH\tFebruari\t2024\tPembayaran Bli Bli Siplah dengan No.PO. S10005744709 (Pembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah)\tHABIS PAKAI
264\t22/1/2025\tBOSP SALUR\t250221302000172\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t146.400.000\tBOS SALUR\t\tBOSP Salur Tahap \tBOS SALUR\tSALUR\tJanuari\t2025\tPembayaran BOS SALUR BOSP Salur Tahap \t
265\t22/1/2025\tPembayaran Honor\t900.3.5.5/001-SDN-CBL/I/2025\tJULAEHA\t0122211231101\tBJB\t-\t-\t2.500.000\tHonor\t\tBulan Januari 2025\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Honor Bulan Januari 2025\tJASA KANTOR
266\t22/1/2025\tPembayaran Honor\t900.3.5.5/001-SDN-CBL/I/2025\tYUNI SISKA HANDAYANI\t0108236671100\tBJB\t-\t-\t2.000.000\tHonor\t\tBulan Januari 2025\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Honor Bulan Januari 2025\tJASA KANTOR
267\t22/1/2025\tPembayaran Honor\t900.3.5.5/001-SDN-CBL/I/2025\tZAIDAN MUHAMMAD ZAINUDIN\t0122314944100\tBJB\t-\t-\t1.800.000\tHonor\t\tBulan Januari 2025\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Honor Bulan Januari 2025\tJASA KANTOR
268\t22/1/2025\tPembayaran Honor\t900.3.5.5/001-SDN-CBL/I/2025\tZAHRA AULIA NUR RODIAH\t0132561176100\tBJB\t-\t-\t1.400.000\tHonor\t\tBulan Januari 2025\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Honor Bulan Januari 2025\tJASA KANTOR
269\t22/1/2025\tPembayaran Honor\t900.3.5.5/001-SDN-CBL/I/2025\tDESIMAH RATNASARI\t0082719318100\tBJB\t-\t-\t1.200.000\tHonor\t\tBulan Januari 2025\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Honor Bulan Januari 2025\tJASA KANTOR
270\t22/1/2025\tPembayaran Honor\t900.3.5.5/001-SDN-CBL/I/2025\tTISNA MULYANA\t0106234000100\tBJB\t-\t-\t2.500.000\tHonor\t\tBulan Januari 2025\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Honor Bulan Januari 2025\tJASA KANTOR
271\t22/1/2025\tTarik Tunai\t900.3.5.5/002-SDN-CBL/I/2025\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t205.000\tTunai\t\tdaya listrik\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Tunai daya listrik\tJASA KANTOR
272\t22/1/2025\tTarik Tunai\t900.3.5.5/002-SDN-CBL/I/2025\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t100.000\tTunai\t\tlangganan air\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Tunai langganan air\tJASA KANTOR
273\t22/1/2025\tTarik Tunai\t900.3.5.5/002-SDN-CBL/I/2025\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t750.000\tTunai\t\tjasa internet\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Tunai jasa internet\tJASA KANTOR
274\t22/1/2025\tTarik Tunai\t900.3.5.5/002-SDN-CBL/I/2025\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t50.000\tTunai\t\tRetribusi keamanan dan sampah\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Tunai Retribusi keamanan dan sampah\tJASA KANTOR
275\t22/1/2025\tTarik Tunai\t900.3.5.5/002-SDN-CBL/I/2025\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t125.000\tTunai\t\tBea materai, administrasi bank\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Tunai Bea materai, administrasi bank\tHABIS PAKAI
276\t22/1/2025\tTarik Tunai\t900.3.5.5/002-SDN-CBL/I/2025\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t150.000\tTunai\t\tBeban Perjalanan Dinas Dalam Kota/Daerah\tNON SIPLAH\tSUDAH\tJanuari\t2025\tPembayaran Tunai Beban Perjalanan Dinas Dalam Kota/Daerah\tPERJALANAN DINAS
518\t22/01/2026\tPembayaran Honor\t400.3.5.5/011/SDNCBL/I/2026\tNOVA AMELIA PUTRI\t0157149865100\tBJB\t-\t-\t1.500.000\tNon Siplah\ttrx/2/I/2026\tBelanja Jasa Tenaga Pendidikan / Honorarium Guru\tNON SIPLAH\tSUDAH\tJanuari\t2026\tPembayaran Non Siplah Belanja Jasa Tenaga Pendidikan / Honorarium Guru\tJASA KANTOR
519\t22/01/2026\tPembayaran Honor\t400.3.5.5/011/SDNCBL/I/2026\tEPILIANI KINASIH\t0157165933100\tBJB\t-\t-\t1.500.000\tNon Siplah\ttrx/3/I/2026\tBelanja Jasa Tenaga Pendidikan / Honorarium Guru\tNON SIPLAH\tSUDAH\tJanuari\t2026\tPembayaran Non Siplah Belanja Jasa Tenaga Pendidikan / Honorarium Guru\tJASA KANTOR
520\t22/01/2026\tTarik Tunai\t400.3.5.5/012/SDNCBL/I/2026\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t250.000\tTunai\ttrx/4/I/2026\tBelanja Tagihan Listrik\tNON SIPLAH\tSUDAH\tJanuari\t2026\tPembayaran Tunai Belanja Tagihan Listrik\tJASA KANTOR
521\t22/01/2026\tTarik Tunai\t400.3.5.5/012/SDNCBL/I/2026\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t235.000\tTunai\ttrx/5/I/2026\tBelanja Tagihan Air\tNON SIPLAH\tSUDAH\tJanuari\t2026\tPembayaran Tunai Belanja Tagihan Air\tJASA KANTOR
522\t22/01/2026\tTarik Tunai\t400.3.5.5/012/SDNCBL/I/2026\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t750.000\tTunai\ttrx/6/I/2026\tBelanja Kawat/Faksimili/Internet/TV Berlangganan\tNON SIPLAH\tSUDAH\tJanuari\t2026\tPembayaran Tunai Belanja Kawat/Faksimili/Internet/TV Berlangganan\tJASA KANTOR
523\t22/01/2026\tTarik Tunai\t400.3.5.5/012/SDNCBL/I/2026\t20207938 SD NEGERI CIBURIAL\t120015095100\tBJB\t-\t-\t50.000\tTunai\ttrx/7/I/2026\tBeban Jasa Pengolahan Sampah-Jasa pelayanan persampahan\tNON SIPLAH\tSUDAH\tJanuari\t2026\tPembayaran Tunai Beban Jasa Pengolahan Sampah-Jasa pelayanan persampahan\tJASA KANTOR
524\t23/01/2026\tTransfer Tunai\t400.3.5.5/013/SDNCBL/I/2026\tPT . TUNAS MEKAR\tCIBOGO\t0149847340100 \tBJB\t-\t-\t1.200.000\tNon Siplah\ttrx/8/I/2026\tKonsumsi (makan) diskusi kolaborasi pengembangan RPP dalam Komunitas Belajar Minggu 1 & 3\tPT . TUNAS MEKAR\tCIBOGO\tSUDAH\tJanuari\t2026\tPembayaran Non Siplah Konsumsi (makan) diskusi kolaborasi pengembangan RPP dalam Komunitas Belajar Minggu 1 & 3\tJASA KANTOR
525\t23/01/2026\tTransfer Tunai\t400.3.5.5/013/SDNCBL/I/2026\tPT . TUNAS MEKAR\tCIBOGO\t0149847340100 \tBJB\t-\t-\t750.000\tNon Siplah\ttrx/9/I/2026\tBeban Makanan dan Minuman Rapat-Jamuan Makan Box\tPT . TUNAS MEKAR\tCIBOGO\tSUDAH\tJanuari\t2026\tPembayaran Non Siplah Beban Makanan dan Minuman Rapat-Jamuan Makan Box\tJASA KANTOR
526\t26/01/2026\tPembelanjaan Siplah\t400.3.5.5/013/SDNCBL/I/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010007993027\tBJB\t-\t-\t3.484.000\tBli Bli\tS10007993027\tPelaksanaan penilaian formatif (ulangan harian) Pelaksanaan penilaian sumatif (ulangan tengah semester/akhir semester/kenaikan kelas)\tCV NUHASGY ABDI JAYA\tSUDAH\tJanuari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10007993027 (Pelaksanaan penilaian formatif (ulangan harian) Pelaksanaan penilaian sumatif (ulangan tengah semester/akhir semester/kenaikan kelas))\tATK / PENGGANDAAN
527\t26/01/2026\tPembelanjaan Siplah\t400.3.5.5/013/SDNCBL/I/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010007993045\tBJB\t-\t-\t3.660.550\tBli Bli\tS10007993045\tPembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb)\tZaid Media Pratama\tSUDAH\tJanuari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10007993045 (Pembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb))\tATK / PENGGANDAAN
528\t26/01/2026\tPembelanjaan Siplah\t400.3.5.5/013/SDNCBL/I/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010007993086\tBJB\t-\t-\t1.488.100\tBli Bli\tS10007993086\tPembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah\tART ALFATH PROJECT\tSUDAH\tJanuari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10007993086 (Pembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah)\tHABIS PAKAI
529\t26/01/2026\tPembelanjaan Siplah\t400.3.5.5/013/SDNCBL/I/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010007993088\tBJB\t-\t-\t636.600\tBli Bli\tS10007993088\tPembelian bahan habis pakai/alat penunjang kebersihan - perabot kantor\tART ALFATH PROJECT\tSUDAH\tJanuari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10007993088 (Pembelian bahan habis pakai/alat penunjang kebersihan - perabot kantor)\tHABIS PAKAI
530\t26/01/2026\tPembelanjaan Siplah\t400.3.5.5/013/SDNCBL/I/2026\tSD NEGERI CIBURIAL - SIPLah Toko Ladang \t1845000009189343\tBJB\t-\t-\t5.382.000\tToko Ladang\tPO69720343745B7\tPengadaan Buku Teks Utama/Pendamping Peserta Didik\tCV GENERASI EMAS MANDIRI\tSUDAH\tJanuari\t2026\tPembayaran Toko Ladang Siplah dengan No.PO. PO69720343745B7 (Pengadaan Buku Teks Utama/Pendamping Peserta Didik)\tBUKU
531\t26/01/2026\tPembelanjaan Siplah\t400.3.5.5/013/SDNCBL/I/2026\tSD NEGERI CIBURIAL - SIPLah Toko Ladang \t1845000009190735\tBJB\t-\t-\t3.368.750\tToko Ladang\tPO69730BED0ADCE\tPengadaan Perlengkapan Sekolah (Loudspeaker-Speaker Aktif, 15 Inch)\tUJUNG UTARA\tSUDAH\tJanuari\t2026\tPembayaran Toko Ladang Siplah dengan No.PO. PO69730BED0ADCE (Pengadaan Perlengkapan Sekolah (Loudspeaker-Speaker Aktif, 15 Inch))\tMODAL
532\t02/02/2026\tPembayaran Honor\t400.3.5.5/017/SDNCBL/II/2026\tNOVA AMELIA PUTRI\t0157149865100\tBJB\t-\t-\t1.500.000\tNon Siplah\ttrx/16/II/2026\tBelanja Jasa Tenaga Pendidikan / Honorarium Guru\tNON SIPLAH\tSUDAH\tFebruari\t2026\tPembayaran Non Siplah Belanja Jasa Tenaga Pendidikan / Honorarium Guru\tJASA KANTOR
533\t02/02/2026\tPembayaran Honor\t400.3.5.5/017/SDNCBL/II/2026\tEPILIANI KINASIH\t0157165933100\tBJB\t-\t-\t1.500.000\tNon Siplah\ttrx/17/II/2026\tBelanja Jasa Tenaga Pendidikan / Honorarium Guru\tNON SIPLAH\tSUDAH\tFebruari\t2026\tPembayaran Non Siplah Belanja Jasa Tenaga Pendidikan / Honorarium Guru\tJASA KANTOR
534\t02/02/2026\tTransfer Tunai\t400.3.5.5/017/SDNCBL/II/2026\tPT . TUNAS MEKAR\tCIBOGO\t0149847340100 \tBJB\t-\t-\t1.200.000\tNon Siplah\ttrx/18/II/2026\tKonsumsi (makan) diskusi kolaborasi pengembangan RPP dalam Komunitas Belajar Minggu 1 & 3\tNON SIPLAH\tSUDAH\tFebruari\t2026\tPembayaran Non Siplah Konsumsi (makan) diskusi kolaborasi pengembangan RPP dalam Komunitas Belajar Minggu 1 & 3\tJASA KANTOR
535\t02/02/2026\tTransfer Tunai\t400.3.5.5/017/SDNCBL/II/2026\tPT . TUNAS MEKAR\tCIBOGO\t0149847340100 \tBJB\t-\t-\t1.000.000\tNon Siplah\ttrx/19/II/2026\tBelanja Makanan dan Minuman Jamuan Tamu\tNON SIPLAH\tSUDAH\tFebruari\t2026\tPembayaran Non Siplah Belanja Makanan dan Minuman Jamuan Tamu\tJASA KANTOR
536\t09/02/2026\tPembelanjaan Siplah\t400.3.5.5/020/SDNCBL/II/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010008020830\tBJB\t-\t-\t1.779.000\tBli Bli\tS10008020830\tPenyelenggaraan Pesantren Kilat dan Kegiatan Keagamaan Sejenis, Pelaksanaan penilaian formatif (ulangan harian)\tCV NUHASGY ABDI JAYA\tSUDAH\tFebruari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10008020830 (Penyelenggaraan Pesantren Kilat dan Kegiatan Keagamaan Sejenis, Pelaksanaan penilaian formatif (ulangan harian))\tATK / PENGGANDAAN
537\t09/02/2026\tPembelanjaan Siplah\t400.3.5.5/020/SDNCBL/II/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010008020845\tBJB\t-\t-\t1.074.900\tBli Bli\tS10008020845\tPembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah\tART ALFATH PROJECT\tSUDAH\tFebruari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10008020845 (Pembelian bahan habis pakai/alat penunjang kebersihan dan sanitasi sekolah)\tHABIS PAKAI
538\t09/02/2026\tPembelanjaan Siplah\t400.3.5.5/020/SDNCBL/II/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010008020855\tBJB\t-\t-\t1.347.500\tBli Bli\tS10008020855\tPengadaan Peralatan Sekolah diluar diluar komponen penyediaan alat multimedia pembelajaran\tCV NUHASGY ABDI JAYA\tSUDAH\tFebruari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10008020855 (Pengadaan Peralatan Sekolah diluar diluar komponen penyediaan alat multimedia pembelajaran)\tMODAL
539\t09/02/2026\tPembelanjaan Siplah\t400.3.5.5/020/SDNCBL/II/2026\tSD NEGERI CIBURIAL - SIPLah Blibli\t1277010008021139\tBJB\t-\t-\t4.072.300\tBli Bli\tS10008021139\tPembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb)\tCV NUHASGY ABDI JAYA\tSUDAH\tFebruari\t2026\tPembayaran Bli Bli Siplah dengan No.PO. S10008021139 (Pembelian Bahan Habis Pakai untuk mendukung pembelajaran dan administrasi sekolah (termasuk ATK, Tinta Printer, Kabel Ekstension, dsb))\tATK / PENGGANDAAN`;

export function parseRawData(text: string): Transaction[] {
  const lines = text.trim().split('\n');
  const result: Transaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length < 10) continue;

    const noStr = parts[0] || `${i}`;
    const tanggal = parts[1] || '';
    const jenisTransaksi = parts[2] || '';
    const noSurat = parts[3] || '';
    const namaPenerima = parts[4] || '';
    const noRekPenerima = parts[5] || '';
    const namaBank = parts[6] || '';
    const pph = parts[7] || '-';
    const ppn = parts[8] || '-';
    
    // Clean Netto string to number
    const rawNetto = (parts[9] || '0').replace(/[^0-9]/g, '');
    const netto = parseInt(rawNetto, 10) || 0;
    
    const siplah = parts[10] || '';
    const noPo = parts[11] || '';
    const keterangan = parts[12] || '';
    const vendor = parts[13] || '';
    const statusSi = parts[14] || '';
    const bulan = parts[15] || '';
    const tahun = parts[16] || '';
    const deskripsiFull = parts[17] || '';
    const kategori = parts[18] || '';

    result.push({
      id: `tx-${noStr}-${i}`,
      no: parseInt(noStr, 10) || i,
      tanggal,
      jenisTransaksi,
      noSurat,
      namaPenerima,
      noRekPenerima,
      namaBank,
      pph,
      ppn,
      netto,
      siplah,
      noPo,
      keterangan,
      vendor,
      statusSi,
      bulan,
      tahun,
      deskripsiFull,
      kategori,
    });
  }

  return result;
}

export const INITIAL_TRANSACTIONS: Transaction[] = parseRawData(RAW_DATA_TEXT);
