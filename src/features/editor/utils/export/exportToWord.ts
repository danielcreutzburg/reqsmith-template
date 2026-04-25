/**
 * Word-Export (.docx) basierend auf der `docx`-Library.
 *
 * Erzeugt ein professionell formatiertes Dokument mit:
 *  - Inhaltsverzeichnis (TOC)
 *  - Header (ReqSmith + Dateiname)
 *  - Footer (Datum + Seitenzahlen)
 *  - Markdown-Tabellen → echte Word-Tabellen
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell,
  WidthType, Header, Footer, AlignmentType, PageNumber,
  TableOfContents, StyleLevel,
} from "docx";
import { saveBlob } from "./saveBlob";
import { parseMarkdownToLines, cleanMarkdownFormatting, type ParsedLine } from "./parseMarkdown";

// Style-Konstanten – zentral, damit Designänderungen hier passieren.
const FONT = "Calibri";
const COLOR_H1 = "1a1a2e";
const COLOR_H2 = "2d2d5e";
const COLOR_H3 = "3d3d7e";
const COLOR_BRAND = "6366f1";
const COLOR_MUTED = "888888";
const COLOR_FOOTER = "999999";

/** Baut Word-Tabelle aus Markdown-Tabellenzeile. */
function buildTable(line: ParsedLine): DocxTable {
  const allRows = [line.tableHeader!, ...line.tableRows!];
  return new DocxTable({
    rows: allRows.map((row, rowIdx) =>
      new DocxTableRow({
        children: row.map((cell) =>
          new DocxTableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: cleanMarkdownFormatting(cell),
                bold: rowIdx === 0,
                size: 20,
                font: FONT,
              })],
            })],
            width: { size: Math.floor(9000 / row.length), type: WidthType.DXA },
          })
        ),
      })
    ),
    width: { size: 9000, type: WidthType.DXA },
  });
}

/** Wandelt eine Nicht-Tabellen-Zeile in einen Word-Paragraph. */
function buildParagraph(line: ParsedLine): Paragraph {
  const cleanText = cleanMarkdownFormatting(line.text);

  switch (line.type) {
    case "h1":
      return new Paragraph({
        children: [new TextRun({ text: cleanText, bold: true, size: 32, font: FONT, color: COLOR_H1 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 200 },
      });
    case "h2":
      return new Paragraph({
        children: [new TextRun({ text: cleanText, bold: true, size: 28, font: FONT, color: COLOR_H2 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 150 },
      });
    case "h3":
      return new Paragraph({
        children: [new TextRun({ text: cleanText, bold: true, size: 24, font: FONT, color: COLOR_H3 })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      });
    case "li":
      return new Paragraph({
        children: [new TextRun({ text: `• ${cleanText}`, size: 22, font: FONT })],
        spacing: { after: 80 },
        indent: { left: 720 },
      });
    default:
      return new Paragraph({
        children: [new TextRun({ text: cleanText, size: 22, font: FONT })],
        spacing: { after: 120 },
      });
  }
}

function buildHeader(filename: string): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "ReqSmith", bold: true, size: 16, font: FONT, color: COLOR_BRAND }),
          new TextRun({ text: `  •  ${filename}`, size: 16, font: FONT, color: COLOR_MUTED }),
        ],
      }),
    ],
  });
}

function buildFooter(dateStr: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Erstellt mit ReqSmith  •  ${dateStr}  •  Seite `, size: 16, font: FONT, color: COLOR_FOOTER }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT, color: COLOR_FOOTER }),
          new TextRun({ text: " / ", size: 16, font: FONT, color: COLOR_FOOTER }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: FONT, color: COLOR_FOOTER }),
        ],
      }),
    ],
  });
}

export async function exportToWord(markdown: string, filename: string): Promise<void> {
  const lines = parseMarkdownToLines(markdown);
  const children: (Paragraph | DocxTable | TableOfContents)[] = [];

  // 1) Inhaltsverzeichnis
  children.push(
    new TableOfContents("Inhaltsverzeichnis", {
      hyperlink: true,
      headingStyleRange: "1-3",
      stylesWithLevels: [
        new StyleLevel("Heading1", 1),
        new StyleLevel("Heading2", 2),
        new StyleLevel("Heading3", 3),
      ],
    })
  );
  children.push(new Paragraph({ spacing: { after: 400 } }));

  // 2) Inhalt
  for (const line of lines) {
    if (line.type === "table" && line.tableHeader && line.tableRows) {
      children.push(buildTable(line));
      children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }
    children.push(buildParagraph(line));
  }

  // 3) Dokument zusammenbauen
  const dateStr = new Date().toLocaleDateString("de-DE");
  const doc = new Document({
    features: { updateFields: true },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          pageNumbers: { start: 1 },
        },
      },
      headers: { default: buildHeader(filename) },
      footers: { default: buildFooter(dateStr) },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${filename}.docx`);
}
