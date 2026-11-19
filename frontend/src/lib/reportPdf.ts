import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { typeKey } from "@/lib/buildingTypes";
import { anomalyStatusKey, severityKey } from "@/lib/anomalyReco";
import { CURRENCY_CODE } from "@/lib/config";
import { fill } from "@/lib/format";
import { priorityKey, recoText } from "@/lib/reco";
import type { TranslationKey } from "@/i18n/dictionaries";
import type { ReportData, ReportType } from "@/services/reports";

const TYPE_KEY = {
  SUMMARY: "rep.type.SUMMARY",
  ANOMALIES: "rep.type.ANOMALIES",
  FULL: "rep.type.FULL",
} as const;

export interface PdfOptions {
  data: ReportData;
  type: ReportType;
  buildingLabel: string;
  t: (key: TranslationKey) => string;
  locale: string;
  filename: string;
}

export function generateReportPdf({ data, type, buildingLabel, t, locale, filename }: PdfOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 15;

  // La police standard du PDF ne gère que les caractères latins courants
  const ascii = (s: string) =>
    s
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2082/g, "2")
      .replace(/\u2026/g, "...")
      .replace(/[\u202f\u00a0]/g, " ");
  const num = (n: number, d = 0) => ascii(n.toLocaleString(locale, { maximumFractionDigits: d }));
  const text = (s: string, x: number, y: number, opts?: { align?: "left" | "center" | "right" }) =>
    doc.text(ascii(s), x, y, opts);
  const fmtIsoDate = (iso: string) =>
    ascii(
      new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      })
    );

  let y = 0;
  const ensure = (h: number) => {
    if (y + h > H - 20) {
      doc.addPage();
      y = M;
    }
  };

  // En-tête
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  text("EnergyInsight", M, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  text(`${t("rep.pdf.title")} - ${t(TYPE_KEY[type])}`, M, 23);
  doc.setFontSize(9);
  text(fill(t("rep.pdf.generated"), { date: new Date().toLocaleString(locale) }), W - M, 14, { align: "right" });

  // Périmètre et période
  y = 40;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  text(buildingLabel, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  text(fill(t("rep.pdf.period"), { from: fmtIsoDate(data.query.from), to: fmtIsoDate(data.query.to) }), M, y);
  y += 8;

  // Indicateurs
  const kpis: [string, string][] = [
    [t("mon.kpi.total"), `${num(data.total)} kWh`],
    [t("mon.kpi.avgDaily"), `${num(data.avgDaily)} kWh`],
    [t("rep.kpi.cost"), `${num(data.cost)} ${CURRENCY_CODE}`],
    [t("dashboard.kpi.anomalies"), String(data.anomalies.length)],
  ];
  const bw = (W - 2 * M - 3 * 4) / 4;
  kpis.forEach(([label, value], i) => {
    const x = M + i * (bw + 4);
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(x, y, bw, 20, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    text(label, x + 3, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(6, 95, 70);
    text(value, x + 3, y + 15);
  });
  y += 28;

  const section = (title: string) => {
    ensure(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    text(title, M, y);
    y += 2;
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.4);
    doc.line(M, y, W - M, y);
    y += 5;
  };

  const table = (head: string[], body: (string | number)[][]) => {
    autoTable(doc, {
      startY: y,
      head: [head.map(ascii)],
      body: body.map((row) => row.map((c) => (typeof c === "string" ? ascii(c) : c))),
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 1.8 },
      margin: { left: M, right: M },
    });
    const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    y = (last ? last.finalY : y) + 8;
  };

  const note = (s: string) => {
    ensure(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    text(s, M, y);
    y += 8;
  };

  const barChart = () => {
    const n = data.daily.length;
    if (n === 0) return;
    const h = 45;
    const w = W - 2 * M;
    ensure(h + 18);
    y += 3;
    const max = Math.max(1, ...data.daily.map((d) => d.kwh));
    const slot = w / n;
    const barW = Math.min(slot * 0.7, 14);
    const step = Math.ceil(n / 14);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(M, y + h, W - M, y + h);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    text(`${num(max)} kWh`, M, y - 1);
    data.daily.forEach((d, i) => {
      const bh = (d.kwh / max) * (h - 4);
      const x = M + i * slot + (slot - barW) / 2;
      doc.setFillColor(16, 185, 129);
      doc.rect(x, y + h - bh, barW, bh, "F");
      if (i % step === 0) {
        text(new Date(d.day).toISOString().slice(5, 10), x + barW / 2, y + h + 4, { align: "center" });
      }
    });
    y += h + 12;
  };

  const dateTime = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

  // Bâtiments
  section(t("rep.pdf.buildings"));
  table(
    [t("table.building"), t("buildings.col.type"), t("rep.col.surface"), t("buildings.col.meters"), t("table.kwh"), t("rep.col.share")],
    data.buildings.map((b) => [
      b.name,
      t(typeKey[b.type]),
      num(b.surfaceM2),
      String(b.meterCount),
      num(b.kwh),
      num(data.total > 0 ? (b.kwh / data.total) * 100 : 0, 1),
    ])
  );

  // Consommation journalière
  if (type !== "ANOMALIES") {
    section(t("rep.pdf.daily"));
    barChart();
    table(
      [t("mon.table.day"), t("table.kwh"), t("rep.col.share")],
      data.daily.map((d) => [
        new Date(d.day).toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" }),
        num(d.kwh),
        num(data.total > 0 ? (d.kwh / data.total) * 100 : 0, 1),
      ])
    );
  }

  // Compteurs
  if (type === "FULL") {
    section(t("rep.pdf.meters"));
    table(
      [t("table.meter"), t("table.building"), t("table.kwh")],
      data.meters.map((m) => [m.meterId, m.buildingName, num(m.kwh)])
    );
  }

  // Anomalies et recommandations
  if (type !== "SUMMARY") {
    section(t("rep.pdf.anomalies"));
    if (data.anomalies.length === 0) note(t("rep.pdf.noAnomalies"));
    else {
      table(
        [t("table.dateUtc"), t("table.meter"), t("table.building"), t("table.kwh"), t("table.expected"), t("table.method"), t("table.severity"), t("table.status")],
        data.anomalies.map((a) => [
          dateTime(a.timestamp),
          a.meterId,
          a.buildingName,
          a.kwh,
          a.expectedKwh,
          a.method,
          t(severityKey[a.severity]),
          t(anomalyStatusKey[a.status]),
        ])
      );
    }

    section(t("rep.pdf.recos"));
    if (data.recommendations.length === 0) note(t("rep.pdf.noRecos"));
    else {
      table(
        [t("table.severity"), t("table.building"), t("reco.action").replace(/:$/, "")],
        data.recommendations.map((r) => {
          const tx = recoText(r, t);
          return [t(priorityKey[r.priority]), r.buildingName, `${tx.title}\n${tx.action}`];
        })
      );
    }
  }

  // Pied de page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    text("EnergyInsight", M, H - 8);
    text(fill(t("rep.pdf.page"), { p: i, n: pages }), W - M, H - 8, { align: "right" });
  }

  doc.save(filename);
}
