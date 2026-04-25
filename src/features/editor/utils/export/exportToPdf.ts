/**
 * PDF-Export basierend auf jsPDF.
 *
 * Aufbau:
 *  1) Header/Footer auf jeder Seite (Branding + Seitenzahl)
 *  2) Inhaltsverzeichnis (wenn ≥ 3 Überschriften vorhanden)
 *  3) Inhalt mit automatischem Seitenumbruch und Tabellen-Rendering
 */
import { jsPDF } from "jspdf";
import { parseMarkdownToLines, cleanMarkdownFormatting, type ParsedLine } from "./parseMarkdown";

// Layout-Konstanten
const MARGIN = 20;
const HEADER_HEIGHT = 15;
const FOOTER_OFFSET = 12;
const COLOR_BRAND: [number, number, number] = [99, 102, 241];
const COLOR_MUTED: [number, number, number] = [150, 150, 150];
const COLOR_LINE: [number, number, number] = [200, 200, 200];

interface PdfContext {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  maxWidth: number;
  footerY: number;
  filename: string;
  dateStr: string;
  pageNum: number;
  y: number;
}

function drawHeaderFooter(ctx: PdfContext, page: number): void {
  const { pdf, pageWidth, footerY, filename, dateStr } = ctx;

  // Header
  pdf.setDrawColor(...COLOR_BRAND);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, HEADER_HEIGHT, pageWidth - MARGIN, HEADER_HEIGHT);
  pdf.setFontSize(8);
  pdf.setTextColor(...COLOR_BRAND);
  pdf.setFont("helvetica", "bold");
  pdf.text("ReqSmith", MARGIN, HEADER_HEIGHT - 3);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...COLOR_MUTED);
  pdf.text(filename, pageWidth - MARGIN, HEADER_HEIGHT - 3, { align: "right" });

  // Footer
  pdf.setDrawColor(...COLOR_LINE);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, footerY - 4, pageWidth - MARGIN, footerY - 4);
  pdf.setFontSize(8);
  pdf.setTextColor(...COLOR_MUTED);
  pdf.text(`Erstellt mit ReqSmith  •  ${dateStr}`, MARGIN, footerY);
  pdf.text(`Seite ${page}`, pageWidth - MARGIN, footerY, { align: "right" });
}

function newPage(ctx: PdfContext): void {
  ctx.pdf.addPage();
  ctx.pageNum++;
  ctx.y = HEADER_HEIGHT + 10;
  drawHeaderFooter(ctx, ctx.pageNum);
}

function checkPageBreak(ctx: PdfContext, needed: number): void {
  if (ctx.y + needed > ctx.footerY - 8) newPage(ctx);
}

function renderTableOfContents(ctx: PdfContext, headings: ParsedLine[]): void {
  if (headings.length <= 2) return;

  const { pdf } = ctx;
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(30, 30, 50);
  pdf.text("Inhaltsverzeichnis", MARGIN, ctx.y);
  ctx.y += 10;

  pdf.setFontSize(10);
  for (const h of headings) {
    checkPageBreak(ctx, 6);
    const indent = h.type === "h1" ? 0 : h.type === "h2" ? 8 : 16;
    const weight = h.type === "h1" ? "bold" : "normal";
    pdf.setFont("helvetica", weight);
    pdf.setTextColor(50, 50, 80);
    pdf.text(cleanMarkdownFormatting(h.text), MARGIN + indent, ctx.y);
    ctx.y += 6;
  }

  ctx.y += 8;
  pdf.setDrawColor(...COLOR_LINE);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, ctx.y, ctx.pageWidth - MARGIN, ctx.y);
  ctx.y += 10;
}

function renderTable(ctx: PdfContext, line: ParsedLine): void {
  const { pdf, maxWidth } = ctx;
  const allRows = [line.tableHeader!, ...line.tableRows!];
  const colCount = line.tableHeader!.length;
  const colWidth = maxWidth / colCount;
  const cellPadding = 2;
  const fontSize = 8;

  pdf.setFontSize(fontSize);

  for (let rowIdx = 0; rowIdx < allRows.length; rowIdx++) {
    const row = allRows[rowIdx];
    const isHeader = rowIdx === 0;

    // Zellen-Höhen vorberechnen
    let maxCellHeight = 0;
    const cellTexts: string[][] = [];
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const cellText = cleanMarkdownFormatting(row[colIdx] || "");
      const wrapped = pdf.splitTextToSize(cellText, colWidth - cellPadding * 2);
      cellTexts.push(wrapped);
      const cellH = wrapped.length * (fontSize * 0.4) + cellPadding * 2;
      if (cellH > maxCellHeight) maxCellHeight = cellH;
    }

    checkPageBreak(ctx, maxCellHeight);

    // Zellen zeichnen
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const x = MARGIN + colIdx * colWidth;
      pdf.setDrawColor(180);
      pdf.setLineWidth(0.3);
      pdf.rect(x, ctx.y, colWidth, maxCellHeight);

      if (isHeader) {
        pdf.setFillColor(240, 240, 250);
        pdf.rect(x, ctx.y, colWidth, maxCellHeight, "F");
        pdf.rect(x, ctx.y, colWidth, maxCellHeight, "S");
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 30, 50);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);
      }

      const textY = ctx.y + cellPadding + fontSize * 0.35;
      for (let tl = 0; tl < cellTexts[colIdx].length; tl++) {
        pdf.text(cellTexts[colIdx][tl], x + cellPadding, textY + tl * (fontSize * 0.4));
      }
    }

    ctx.y += maxCellHeight;
  }

  ctx.y += 6;
}

function renderTextLine(ctx: PdfContext, line: ParsedLine): void {
  const { pdf, maxWidth } = ctx;
  const cleanText = cleanMarkdownFormatting(line.text);

  // Stil je nach Zeilentyp
  switch (line.type) {
    case "h1":
      checkPageBreak(ctx, 14);
      pdf.setFontSize(18); pdf.setFont("helvetica", "bold"); pdf.setTextColor(26, 26, 46);
      break;
    case "h2":
      checkPageBreak(ctx, 12);
      pdf.setFontSize(14); pdf.setFont("helvetica", "bold"); pdf.setTextColor(45, 45, 94);
      break;
    case "h3":
      checkPageBreak(ctx, 10);
      pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(61, 61, 126);
      break;
    default:
      pdf.setFontSize(11); pdf.setFont("helvetica", "normal"); pdf.setTextColor(50, 50, 50);
  }

  const text = line.type === "li" ? `  • ${cleanText}` : cleanText;
  const splitText = pdf.splitTextToSize(text, maxWidth);

  for (const textLine of splitText) {
    checkPageBreak(ctx, 8);
    pdf.text(textLine, MARGIN, ctx.y);
    ctx.y += line.type === "h1" ? 10 : line.type === "h2" ? 8 : 6;
  }

  ctx.y += line.type === "h1" ? 6 : line.type === "h2" ? 4 : 3;
}

export function exportToPdf(markdown: string, filename: string): void {
  const lines = parseMarkdownToLines(markdown);
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const ctx: PdfContext = {
    pdf,
    pageWidth,
    pageHeight,
    maxWidth: pageWidth - MARGIN * 2,
    footerY: pageHeight - FOOTER_OFFSET,
    filename,
    dateStr: new Date().toLocaleDateString("de-DE"),
    pageNum: 1,
    y: HEADER_HEIGHT + 10,
  };

  drawHeaderFooter(ctx, 1);

  const headings = lines.filter((l) => l.type === "h1" || l.type === "h2" || l.type === "h3");
  renderTableOfContents(ctx, headings);

  for (const line of lines) {
    if (line.type === "table" && line.tableHeader && line.tableRows) {
      renderTable(ctx, line);
    } else {
      renderTextLine(ctx, line);
    }
  }

  pdf.save(`${filename}.pdf`);
}
