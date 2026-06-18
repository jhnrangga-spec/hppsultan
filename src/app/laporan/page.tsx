"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatDate } from "@/lib/format";
import type { BahanBaku, Produksi, Aset, Produk } from "@/lib/supabase";
import { FileText, Download, AlertCircle, X, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ReportType = "hpp" | "stok" | "labarugi" | "aset";

export default function LaporanPage() {
  const [bahanList, setBahanList] = useState<BahanBaku[]>([]);
  const [produksiList, setProduksiList] = useState<Produksi[]>([]);
  const [asetList, setAsetList] = useState<Aset[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>("hpp");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  async function loadData() {
    setLoading(true);
    setError(null);
    const [bahanRes, produksiRes, asetRes, produkRes] = await Promise.all([
      supabase.from("bahan_baku").select("*").order("nama"),
      supabase.from("produksi").select("*, produk(*)").order("tanggal", { ascending: false }),
      supabase.from("aset").select("*").order("nama"),
      supabase.from("produk").select("*").order("nama"),
    ]);
    if (produksiRes.error) setError("Gagal memuat data: " + produksiRes.error.message);
    setBahanList((bahanRes.data as BahanBaku[]) || []);
    setProduksiList((produksiRes.data as Produksi[]) || []);
    setAsetList((asetRes.data as Aset[]) || []);
    setProdukList((produkRes.data as Produk[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProduksi = produksiList.filter(
    (p) => p.tanggal >= dateFrom && p.tanggal <= dateTo
  );

  function getHPPData() {
    const rows = filteredProduksi.map((p) => ({
      tanggal: formatDate(p.tanggal),
      produk: p.produk?.nama || "-",
      jumlah: p.jumlah_produksi,
      biayaBahan: p.total_biaya_bahan,
      biayaTK: p.biaya_tenaga_kerja,
      biayaOH: p.biaya_overhead,
      totalHPP: p.total_hpp,
      hppUnit: p.hpp_per_unit,
    }));
    const totalHPP = rows.reduce((s, r) => s + r.totalHPP, 0);
    const totalUnit = rows.reduce((s, r) => s + r.jumlah, 0);
    return { rows, totalHPP, totalUnit };
  }

  function getStokData() {
    return bahanList.map((b) => {
      const isi = b.isi_per_kemasan || 1;
      const berat = b.berat_per_isi || 0;
      const perKemasan = berat > 0 ? isi * berat : isi;
      const jumlahKemasan = perKemasan > 0 ? b.stok / perKemasan : 0;
      const hargaKemasan = b.harga_beli || 0;
      return {
        nama: b.nama,
        satuan_beli: b.satuan_beli || "pack",
        kemasan: `1 ${b.satuan_beli || "pack"} = ${isi} pcs${berat > 0 ? ` × ${berat}${b.satuan}` : ""}`,
        hargaKemasan,
        hargaSatuan: b.harga_per_satuan,
        satuan: b.satuan,
        stokKemasan: Math.round(jumlahKemasan),
        stokResep: b.stok,
        totalBeli: hargaKemasan * jumlahKemasan,
      };
    });
  }

  function getLabaRugiData() {
    const pendapatan = filteredProduksi.reduce((s, p) => {
      const hargaJual = p.produk?.harga_jual || 0;
      return s + hargaJual * p.jumlah_produksi;
    }, 0);
    const totalHPP = filteredProduksi.reduce((s, p) => s + p.total_hpp, 0);
    const totalBahan = filteredProduksi.reduce((s, p) => s + p.total_biaya_bahan, 0);
    const totalTK = filteredProduksi.reduce((s, p) => s + p.biaya_tenaga_kerja, 0);
    const totalOH = filteredProduksi.reduce((s, p) => s + p.biaya_overhead, 0);
    const penyusutan = asetList.reduce((s, a) => {
      const monthly = a.total_harga / a.umur_ekonomis / 12;
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
      return s + monthly * Math.min(months, 12);
    }, 0);
    const labaKotor = pendapatan - totalHPP;
    const labaBersih = labaKotor - penyusutan;

    return {
      pendapatan,
      totalHPP,
      totalBahan,
      totalTK,
      totalOH,
      penyusutan,
      labaKotor,
      labaBersih,
      produksiCount: filteredProduksi.length,
      totalUnit: filteredProduksi.reduce((s, p) => s + p.jumlah_produksi, 0),
    };
  }

  function getAsetData() {
    const today = new Date();
    const rows = asetList.map((a) => {
      const beliDate = new Date(a.tanggal_beli);
      const bulanPakai = Math.max(0, (today.getFullYear() - beliDate.getFullYear()) * 12 + (today.getMonth() - beliDate.getMonth()));
      const penyusutanPerBulan = a.total_harga / a.umur_ekonomis / 12;
      const totalPenyusutan = Math.min(penyusutanPerBulan * bulanPakai, a.total_harga);
      const nilaiSekarang = a.total_harga - totalPenyusutan;
      return {
        nama: a.nama,
        kategori: a.kategori,
        jumlah: a.jumlah,
        hargaSatuan: a.harga_satuan,
        totalHarga: a.total_harga,
        umurEkonomis: a.umur_ekonomis,
        tanggalBeli: formatDate(a.tanggal_beli),
        bulanPakai,
        penyusutanPerBulan,
        totalPenyusutan,
        nilaiSekarang,
        keterangan: a.keterangan || "",
      };
    });
    const totalModal = rows.reduce((s, r) => s + r.totalHarga, 0);
    const totalNilaiSekarang = rows.reduce((s, r) => s + r.nilaiSekarang, 0);
    const totalPenyusutanBulan = rows.reduce((s, r) => s + r.penyusutanPerBulan, 0);
    const totalAkumulasi = rows.reduce((s, r) => s + r.totalPenyusutan, 0);
    return { rows, totalModal, totalNilaiSekarang, totalPenyusutanBulan, totalAkumulasi };
  }

  function periodeLabel() {
    return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
  }

  function exportPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("KOPI SULTAN", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(10);

    if (reportType === "hpp") {
      doc.text(`Laporan HPP Produksi`, pageWidth / 2, 22, { align: "center" });
      doc.text(`Periode: ${periodeLabel()}`, pageWidth / 2, 28, { align: "center" });

      const hpp = getHPPData();
      autoTable(doc, {
        startY: 35,
        head: [["Tanggal", "Produk", "Qty", "Bahan Baku", "Tenaga Kerja", "Overhead", "Total HPP", "HPP/Unit"]],
        body: hpp.rows.map((r) => [
          r.tanggal, r.produk, r.jumlah,
          formatRupiah(r.biayaBahan), formatRupiah(r.biayaTK), formatRupiah(r.biayaOH),
          formatRupiah(r.totalHPP), formatRupiah(r.hppUnit),
        ]),
        foot: [["", "TOTAL", hpp.totalUnit.toString(), "", "", "", formatRupiah(hpp.totalHPP), ""]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [74, 44, 23] },
        footStyles: { fillColor: [245, 240, 230], textColor: [74, 44, 23], fontStyle: "bold" },
      });
    } else if (reportType === "stok") {
      doc.text(`Laporan Stok Bahan Baku`, pageWidth / 2, 22, { align: "center" });
      doc.text(`Per tanggal: ${formatDate(dateTo)}`, pageWidth / 2, 28, { align: "center" });

      const stok = getStokData();
      const totalBeli = stok.reduce((s, r) => s + r.totalBeli, 0);
      autoTable(doc, {
        startY: 35,
        head: [["Nama", "Kemasan", "Harga/Kemasan", "Harga/Satuan", "Stok", "Total Pembelian"]],
        body: stok.map((r) => [
          r.nama, r.kemasan,
          `${formatRupiah(r.hargaKemasan)}/${r.satuan_beli}`,
          `${formatRupiah(r.hargaSatuan)}/${r.satuan}`,
          `${r.stokKemasan} ${r.satuan_beli}`,
          formatRupiah(r.totalBeli),
        ]),
        foot: [["", "", "", "", `${stok.length} item`, formatRupiah(totalBeli)]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [74, 44, 23] },
        footStyles: { fillColor: [245, 240, 230], textColor: [74, 44, 23], fontStyle: "bold" },
      });
    } else if (reportType === "labarugi") {
      doc.text(`Laporan Laba Rugi`, pageWidth / 2, 22, { align: "center" });
      doc.text(`Periode: ${periodeLabel()}`, pageWidth / 2, 28, { align: "center" });

      const lr = getLabaRugiData();
      autoTable(doc, {
        startY: 35,
        head: [["Keterangan", "Jumlah"]],
        body: [
          ["Pendapatan (Harga Jual × Unit)", formatRupiah(lr.pendapatan)],
          ["", ""],
          ["Harga Pokok Produksi (HPP):", ""],
          ["  - Biaya Bahan Baku", formatRupiah(lr.totalBahan)],
          ["  - Biaya Tenaga Kerja", formatRupiah(lr.totalTK)],
          ["  - Biaya Overhead", formatRupiah(lr.totalOH)],
          ["Total HPP", formatRupiah(lr.totalHPP)],
          ["", ""],
          ["LABA KOTOR", formatRupiah(lr.labaKotor)],
          ["", ""],
          ["Beban Penyusutan Aset", formatRupiah(lr.penyusutan)],
          ["", ""],
          ["LABA BERSIH", formatRupiah(lr.labaBersih)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [74, 44, 23] },
        columnStyles: { 1: { halign: "right" } },
        didParseCell: (data) => {
          const text = String(data.cell.raw);
          if (text === "LABA KOTOR" || text === "LABA BERSIH" || text === "Total HPP") {
            data.cell.styles.fontStyle = "bold";
          }
          if (text === "LABA BERSIH") {
            data.cell.styles.fillColor = [245, 240, 230];
          }
        },
      });
    } else if (reportType === "aset") {
      doc.text(`Laporan Aset Modal`, pageWidth / 2, 22, { align: "center" });
      doc.text(`Per tanggal: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 28, { align: "center" });

      const aset = getAsetData();
      autoTable(doc, {
        startY: 35,
        head: [["Nama", "Kategori", "Qty", "Harga Satuan", "Total Harga", "Umur (th)", "Tgl Beli", "Penyusutan/Bln", "Akum. Penyusutan", "Nilai Sekarang"]],
        body: aset.rows.map((r) => [
          r.nama, r.kategori, r.jumlah,
          formatRupiah(r.hargaSatuan), formatRupiah(r.totalHarga),
          r.umurEkonomis, r.tanggalBeli,
          formatRupiah(r.penyusutanPerBulan), formatRupiah(r.totalPenyusutan), formatRupiah(r.nilaiSekarang),
        ]),
        foot: [["", "", "", "TOTAL", formatRupiah(aset.totalModal), "", "", formatRupiah(aset.totalPenyusutanBulan), formatRupiah(aset.totalAkumulasi), formatRupiah(aset.totalNilaiSekarang)]],
        styles: { fontSize: 7 },
        headStyles: { fillColor: [74, 44, 23] },
        footStyles: { fillColor: [245, 240, 230], textColor: [74, 44, 23], fontStyle: "bold" },
      });
    }

    const filename = `laporan-${reportType}-${dateFrom}-${dateTo}.pdf`;
    doc.save(filename);
  }

  function exportExcel() {
    let wsData: (string | number)[][] = [];
    let sheetName = "";

    if (reportType === "hpp") {
      sheetName = "Laporan HPP";
      const hpp = getHPPData();
      wsData = [
        ["LAPORAN HPP PRODUKSI - KOPI SULTAN"],
        [`Periode: ${periodeLabel()}`],
        [],
        ["Tanggal", "Produk", "Qty", "Biaya Bahan", "Tenaga Kerja", "Overhead", "Total HPP", "HPP/Unit"],
        ...hpp.rows.map((r) => [
          r.tanggal, r.produk, r.jumlah,
          r.biayaBahan, r.biayaTK, r.biayaOH, r.totalHPP, r.hppUnit,
        ]),
        [],
        ["", "TOTAL", hpp.totalUnit, "", "", "", hpp.totalHPP, ""],
      ];
    } else if (reportType === "stok") {
      sheetName = "Stok Bahan Baku";
      const stok = getStokData();
      const totalBeli = stok.reduce((s, r) => s + r.totalBeli, 0);
      wsData = [
        ["LAPORAN STOK BAHAN BAKU - KOPI SULTAN"],
        [`Per tanggal: ${formatDate(dateTo)}`],
        [],
        ["Nama", "Kemasan", "Harga/Kemasan", "Harga/Satuan Resep", "Stok (Kemasan)", "Stok (Resep)", "Total Pembelian"],
        ...stok.map((r) => [
          r.nama, r.kemasan, r.hargaKemasan, r.hargaSatuan,
          `${r.stokKemasan} ${r.satuan_beli}`, `${r.stokResep} ${r.satuan}`, r.totalBeli,
        ]),
        [],
        ["", "", "", "", "", "TOTAL", totalBeli],
      ];
    } else if (reportType === "labarugi") {
      sheetName = "Laba Rugi";
      const lr = getLabaRugiData();
      wsData = [
        ["LAPORAN LABA RUGI - KOPI SULTAN"],
        [`Periode: ${periodeLabel()}`],
        [],
        ["Keterangan", "Jumlah"],
        ["Pendapatan (Harga Jual × Unit)", lr.pendapatan],
        [],
        ["Harga Pokok Produksi (HPP):", ""],
        ["  Biaya Bahan Baku", lr.totalBahan],
        ["  Biaya Tenaga Kerja", lr.totalTK],
        ["  Biaya Overhead", lr.totalOH],
        ["Total HPP", lr.totalHPP],
        [],
        ["LABA KOTOR", lr.labaKotor],
        [],
        ["Beban Penyusutan Aset", lr.penyusutan],
        [],
        ["LABA BERSIH", lr.labaBersih],
      ];
    } else {
      sheetName = "Aset Modal";
      const aset = getAsetData();
      wsData = [
        ["LAPORAN ASET MODAL - KOPI SULTAN"],
        [`Per tanggal: ${formatDate(new Date().toISOString())}`],
        [],
        ["Nama", "Kategori", "Qty", "Harga Satuan", "Total Harga", "Umur Ekonomis (th)", "Tgl Beli", "Penyusutan/Bulan", "Akum. Penyusutan", "Nilai Sekarang", "Keterangan"],
        ...aset.rows.map((r) => [
          r.nama, r.kategori, r.jumlah, r.hargaSatuan, r.totalHarga,
          r.umurEkonomis, r.tanggalBeli, r.penyusutanPerBulan, r.totalPenyusutan, r.nilaiSekarang, r.keterangan,
        ]),
        [],
        ["", "", "", "TOTAL", aset.totalModal, "", "", aset.totalPenyusutanBulan, aset.totalAkumulasi, aset.totalNilaiSekarang, ""],
      ];
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `laporan-${reportType}-${dateFrom}-${dateTo}.xlsx`);
  }

  const reportTabs: { key: ReportType; label: string }[] = [
    { key: "hpp", label: "HPP Produksi" },
    { key: "stok", label: "Stok Bahan Baku" },
    { key: "labarugi", label: "Laba Rugi" },
    { key: "aset", label: "Aset Modal" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-8 h-8 text-gold" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
          <p className="text-white/60">Cetak laporan HPP, stok, dan laba rugi</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-cream rounded-xl shadow-sm border border-white/10 mb-6">
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-4">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {reportTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setReportType(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === tab.key
                    ? "bg-brand text-white"
                    : "text-white/60 hover:text-brand hover:bg-cream"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {reportType !== "stok" && reportType !== "aset" && (
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-white/60">Dari:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <label className="text-sm text-white/60">Sampai:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          )}
        </div>

        <div className="p-4 flex gap-3 border-b border-white/10">
          <button
            onClick={exportPDF}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={exportExcel}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : (
          <div className="p-4">
            {reportType === "hpp" && <HPPPreview data={getHPPData()} />}
            {reportType === "stok" && <StokPreview data={getStokData()} />}
            {reportType === "labarugi" && <LabaRugiPreview data={getLabaRugiData()} produkList={produkList} produksiList={filteredProduksi} />}
            {reportType === "aset" && <AsetPreview data={getAsetData()} />}
          </div>
        )}
      </div>
    </div>
  );
}

type HPPRow = { tanggal: string; produk: string; jumlah: number; biayaBahan: number; biayaTK: number; biayaOH: number; totalHPP: number; hppUnit: number };
type HPPData = { rows: HPPRow[]; totalHPP: number; totalUnit: number };

function HPPPreview({ data }: { data: HPPData }) {
  if (data.rows.length === 0) {
    return <p className="text-center text-white/40 py-8">Tidak ada data produksi pada periode ini.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-white/70">Tanggal</th>
            <th className="text-left px-4 py-2 font-medium text-white/70">Produk</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Qty</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Bahan Baku</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Tenaga Kerja</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Overhead</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Total HPP</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">HPP/Unit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand/5">
          {data.rows.map((r, i) => (
            <tr key={i} className="hover:bg-white/5">
              <td className="px-4 py-2">{r.tanggal}</td>
              <td className="px-4 py-2 font-medium">{r.produk}</td>
              <td className="px-4 py-2 text-right">{r.jumlah}</td>
              <td className="px-4 py-2 text-right">{formatRupiah(r.biayaBahan)}</td>
              <td className="px-4 py-2 text-right">{formatRupiah(r.biayaTK)}</td>
              <td className="px-4 py-2 text-right">{formatRupiah(r.biayaOH)}</td>
              <td className="px-4 py-2 text-right font-semibold">{formatRupiah(r.totalHPP)}</td>
              <td className="px-4 py-2 text-right font-bold text-gold">{formatRupiah(r.hppUnit)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/5">
          <tr>
            <td colSpan={2} className="px-4 py-2 font-semibold text-right">TOTAL</td>
            <td className="px-4 py-2 text-right font-bold">{data.totalUnit}</td>
            <td colSpan={3} />
            <td className="px-4 py-2 text-right font-bold text-brand">{formatRupiah(data.totalHPP)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function StokPreview({ data }: { data: { nama: string; satuan_beli: string; kemasan: string; hargaKemasan: number; hargaSatuan: number; satuan: string; stokKemasan: number; stokResep: number; totalBeli: number }[] }) {
  if (data.length === 0) {
    return <p className="text-center text-white/40 py-8">Belum ada data bahan baku.</p>;
  }
  const totalBeli = data.reduce((s, r) => s + r.totalBeli, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-white/70">Nama</th>
            <th className="text-left px-4 py-2 font-medium text-white/70">Kemasan</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Harga/Kemasan</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Harga/Satuan</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Stok</th>
            <th className="text-right px-4 py-2 font-medium text-white/70">Total Pembelian</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand/5">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-white/5">
              <td className="px-4 py-2 font-medium">{r.nama}</td>
              <td className="px-4 py-2 text-xs text-white/60">{r.kemasan}</td>
              <td className="px-4 py-2 text-right">{formatRupiah(r.hargaKemasan)}/{r.satuan_beli}</td>
              <td className="px-4 py-2 text-right font-semibold text-gold">{formatRupiah(r.hargaSatuan)}/{r.satuan}</td>
              <td className="px-4 py-2 text-right">
                {r.stokKemasan} {r.satuan_beli}
                <span className="text-xs text-white/40 block">{r.stokResep} {r.satuan}</span>
              </td>
              <td className="px-4 py-2 text-right font-medium text-brand">{formatRupiah(r.totalBeli)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/5">
          <tr>
            <td colSpan={4} className="px-4 py-2 font-semibold text-right">TOTAL</td>
            <td className="px-4 py-2 text-right font-bold">{data.length} item</td>
            <td className="px-4 py-2 text-right font-bold text-brand">{formatRupiah(totalBeli)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function LabaRugiPreview({ data, produkList, produksiList }: {
  data: { pendapatan: number; totalHPP: number; totalBahan: number; totalTK: number; totalOH: number; penyusutan: number; labaKotor: number; labaBersih: number; produksiCount: number; totalUnit: number };
  produkList: Produk[];
  produksiList: Produksi[];
}) {
  const perProduk = produkList.map((p) => {
    const items = produksiList.filter((pr) => pr.produk_id === p.id);
    const totalUnit = items.reduce((s, i) => s + i.jumlah_produksi, 0);
    const totalHPP = items.reduce((s, i) => s + i.total_hpp, 0);
    const pendapatan = totalUnit * p.harga_jual;
    return { nama: p.nama, hargaJual: p.harga_jual, totalUnit, totalHPP, pendapatan, laba: pendapatan - totalHPP };
  }).filter((p) => p.totalUnit > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700">
          <p className="text-sm text-emerald-400">Pendapatan</p>
          <p className="text-2xl font-bold text-emerald-300">{formatRupiah(data.pendapatan)}</p>
        </div>
        <div className="bg-red-900/30 rounded-xl p-5 border border-red-700">
          <p className="text-sm text-red-400">Total HPP + Penyusutan</p>
          <p className="text-2xl font-bold text-red-300">{formatRupiah(data.totalHPP + data.penyusutan)}</p>
        </div>
        <div className={`rounded-xl p-5 border ${data.labaBersih >= 0 ? "bg-gold-light/30 border-amber-700" : "bg-red-900/30 border-red-700"}`}>
          <p className="text-sm text-white/60">Laba Bersih</p>
          <p className={`text-2xl font-bold ${data.labaBersih >= 0 ? "text-foreground" : "text-red-300"}`}>
            {formatRupiah(data.labaBersih)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            <tr className="bg-emerald-900/30">
              <td className="px-4 py-3 font-semibold">Pendapatan (Harga Jual × Unit)</td>
              <td className="px-4 py-3 text-right font-bold text-emerald-300">{formatRupiah(data.pendapatan)}</td>
            </tr>
            <tr className="bg-white/5">
              <td colSpan={2} className="px-4 py-2 font-semibold text-white/70">Harga Pokok Produksi</td>
            </tr>
            <tr>
              <td className="px-4 py-2 pl-8">Biaya Bahan Baku</td>
              <td className="px-4 py-2 text-right">{formatRupiah(data.totalBahan)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 pl-8">Biaya Tenaga Kerja</td>
              <td className="px-4 py-2 text-right">{formatRupiah(data.totalTK)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 pl-8">Biaya Overhead</td>
              <td className="px-4 py-2 text-right">{formatRupiah(data.totalOH)}</td>
            </tr>
            <tr className="border-t border-white/10">
              <td className="px-4 py-2 font-semibold">Total HPP</td>
              <td className="px-4 py-2 text-right font-bold text-red-400">{formatRupiah(data.totalHPP)}</td>
            </tr>
            <tr className="bg-amber-900/30 border-t border-white/10">
              <td className="px-4 py-3 font-bold">LABA KOTOR</td>
              <td className="px-4 py-3 text-right font-bold text-lg">{formatRupiah(data.labaKotor)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 pl-8">Beban Penyusutan Aset</td>
              <td className="px-4 py-2 text-right">{formatRupiah(data.penyusutan)}</td>
            </tr>
            <tr className={`border-t-2 border-white/20 ${data.labaBersih >= 0 ? "bg-emerald-900/30" : "bg-red-900/30"}`}>
              <td className="px-4 py-3 font-bold text-lg">LABA BERSIH</td>
              <td className={`px-4 py-3 text-right font-bold text-xl ${data.labaBersih >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {formatRupiah(data.labaBersih)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {perProduk.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-foreground mt-4">Detail per Produk</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-white/70">Produk</th>
                  <th className="text-right px-4 py-2 font-medium text-white/70">Harga Jual</th>
                  <th className="text-right px-4 py-2 font-medium text-white/70">Unit</th>
                  <th className="text-right px-4 py-2 font-medium text-white/70">Pendapatan</th>
                  <th className="text-right px-4 py-2 font-medium text-white/70">HPP</th>
                  <th className="text-right px-4 py-2 font-medium text-white/70">Laba</th>
                  <th className="text-right px-4 py-2 font-medium text-white/70">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {perProduk.map((p, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium">{p.nama}</td>
                    <td className="px-4 py-2 text-right">{formatRupiah(p.hargaJual)}</td>
                    <td className="px-4 py-2 text-right">{p.totalUnit}</td>
                    <td className="px-4 py-2 text-right">{formatRupiah(p.pendapatan)}</td>
                    <td className="px-4 py-2 text-right">{formatRupiah(p.totalHPP)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${p.laba >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatRupiah(p.laba)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {p.pendapatan > 0 ? ((p.laba / p.pendapatan) * 100).toFixed(1) + "%" : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

type AsetRow = { nama: string; kategori: string; jumlah: number; hargaSatuan: number; totalHarga: number; umurEkonomis: number; tanggalBeli: string; bulanPakai: number; penyusutanPerBulan: number; totalPenyusutan: number; nilaiSekarang: number; keterangan: string };
type AsetData = { rows: AsetRow[]; totalModal: number; totalNilaiSekarang: number; totalPenyusutanBulan: number; totalAkumulasi: number };

function AsetPreview({ data }: { data: AsetData }) {
  if (data.rows.length === 0) {
    return <p className="text-center text-white/40 py-8">Belum ada data aset.</p>;
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700">
          <p className="text-sm text-amber-400">Total Modal Awal</p>
          <p className="text-2xl font-bold text-amber-300">{formatRupiah(data.totalModal)}</p>
        </div>
        <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-700">
          <p className="text-sm text-blue-400">Nilai Sekarang</p>
          <p className="text-2xl font-bold text-blue-300">{formatRupiah(data.totalNilaiSekarang)}</p>
        </div>
        <div className="bg-red-900/30 rounded-xl p-5 border border-red-700">
          <p className="text-sm text-red-400">Akum. Penyusutan</p>
          <p className="text-2xl font-bold text-red-300">{formatRupiah(data.totalAkumulasi)}</p>
        </div>
        <div className="bg-purple-900/30 rounded-xl p-5 border border-purple-700">
          <p className="text-sm text-purple-400">Penyusutan/Bulan</p>
          <p className="text-2xl font-bold text-purple-300">{formatRupiah(data.totalPenyusutanBulan)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-white/70">Nama</th>
              <th className="text-left px-4 py-2 font-medium text-white/70">Kategori</th>
              <th className="text-right px-4 py-2 font-medium text-white/70">Qty</th>
              <th className="text-right px-4 py-2 font-medium text-white/70">Total Harga</th>
              <th className="text-right px-4 py-2 font-medium text-white/70">Umur (th)</th>
              <th className="text-left px-4 py-2 font-medium text-white/70">Tgl Beli</th>
              <th className="text-right px-4 py-2 font-medium text-white/70">Penyusutan/Bln</th>
              <th className="text-right px-4 py-2 font-medium text-white/70">Akum. Penyusutan</th>
              <th className="text-right px-4 py-2 font-medium text-white/70">Nilai Sekarang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand/5">
            {data.rows.map((r, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="px-4 py-2 font-medium">{r.nama}</td>
                <td className="px-4 py-2 text-xs text-white/60">{r.kategori}</td>
                <td className="px-4 py-2 text-right">{r.jumlah}</td>
                <td className="px-4 py-2 text-right">{formatRupiah(r.totalHarga)}</td>
                <td className="px-4 py-2 text-right">{r.umurEkonomis}</td>
                <td className="px-4 py-2 text-xs">{r.tanggalBeli}</td>
                <td className="px-4 py-2 text-right">{formatRupiah(r.penyusutanPerBulan)}</td>
                <td className="px-4 py-2 text-right text-red-400">{formatRupiah(r.totalPenyusutan)}</td>
                <td className="px-4 py-2 text-right font-semibold text-brand">{formatRupiah(r.nilaiSekarang)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-white/5">
            <tr>
              <td colSpan={3} className="px-4 py-2 font-semibold text-right">TOTAL</td>
              <td className="px-4 py-2 text-right font-bold">{formatRupiah(data.totalModal)}</td>
              <td colSpan={2} />
              <td className="px-4 py-2 text-right font-bold">{formatRupiah(data.totalPenyusutanBulan)}</td>
              <td className="px-4 py-2 text-right font-bold text-red-400">{formatRupiah(data.totalAkumulasi)}</td>
              <td className="px-4 py-2 text-right font-bold text-brand">{formatRupiah(data.totalNilaiSekarang)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
