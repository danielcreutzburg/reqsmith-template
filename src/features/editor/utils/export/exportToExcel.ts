/**
 * Excel-Export (.xlsx) basierend auf ExcelJS.
 *
 * Strategie:
 *  - Jede Markdown-Tabelle wird zu einem eigenen Worksheet ("Tabelle 1", "Tabelle 2", …)
 *  - Restliche Inhalte (Überschriften, Listen, Absätze) landen im Sheet "Dokument"
 *    mit zwei Spalten: `Typ` und `Inhalt`.
 */
import ExcelJS from "exceljs";
import { saveBlob } from "./saveBlob";
import { parseMarkdownToLines, cleanMarkdownFormatting } from "./parseMarkdown";

interface GeneralRow { Typ: string; Inhalt: string; }

const TYPE_LABEL: Record<string, string> = {
  h1: "Überschrift 1",
  h2: "Überschrift 2",
  h3: "Überschrift 3",
  li: "Listenpunkt",
  p: "Absatz",
};

function addGeneralSheet(workbook: ExcelJS.Workbook, data: GeneralRow[], name: string): void {
  const ws = workbook.addWorksheet(name);
  ws.addRow(["Typ", "Inhalt"]);
  ws.getRow(1).font = { bold: true };
  for (const row of data) {
    ws.addRow([row.Typ, row.Inhalt]);
  }
  ws.getColumn(1).width = 15;
  ws.getColumn(2).width = 80;
}

export async function exportToExcel(markdown: string, filename: string): Promise<void> {
  const lines = parseMarkdownToLines(markdown);
  const workbook = new ExcelJS.Workbook();

  const generalData: GeneralRow[] = [];
  let tableIndex = 0;

  for (const line of lines) {
    if (line.type === "table" && line.tableHeader && line.tableRows) {
      // Vor der ersten Tabelle bereits gesammelte Inhalte als "Dokument"-Sheet sichern
      if (generalData.length > 0 && tableIndex === 0) {
        addGeneralSheet(workbook, generalData, "Dokument");
      }

      tableIndex++;
      const sheetName = `Tabelle ${tableIndex}`.substring(0, 31);
      const ws = workbook.addWorksheet(sheetName);

      const headerRow = ws.addRow(line.tableHeader.map((h) => cleanMarkdownFormatting(h)));
      headerRow.font = { bold: true };

      for (const row of line.tableRows) {
        ws.addRow(row.map((cell) => cleanMarkdownFormatting(cell)));
      }

      line.tableHeader.forEach((h, idx) => {
        ws.getColumn(idx + 1).width = Math.max(h.length + 5, 20);
      });

      continue;
    }

    generalData.push({
      Typ: TYPE_LABEL[line.type] ?? "Absatz",
      Inhalt: cleanMarkdownFormatting(line.text),
    });
  }

  // "Dokument"-Sheet anlegen, wenn noch nicht vorhanden
  const hasDocSheet = workbook.worksheets.some((ws) => ws.name === "Dokument");
  if (!hasDocSheet && (tableIndex === 0 || generalData.length > 0)) {
    addGeneralSheet(workbook, generalData, "Dokument");
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveBlob(blob, `${filename}.xlsx`);
}
