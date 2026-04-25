/**
 * Markdown → strukturierte Zeilen-Repräsentation für Exporter.
 *
 * Wird von Word-, PDF- und Excel-Export gemeinsam genutzt.
 * Bewusst klein gehalten und ohne externe Abhängigkeiten,
 * damit jeder Exporter denselben Quellbaum erhält.
 */

export type LineType = "h1" | "h2" | "h3" | "p" | "li" | "table";

export interface ParsedLine {
  type: LineType;
  text: string;
  /** Nur gesetzt wenn `type === "table"`. */
  tableRows?: string[][];
  /** Nur gesetzt wenn `type === "table"`. */
  tableHeader?: string[];
}

/**
 * Zerlegt Markdown in eine flache Liste typisierter Zeilen.
 *
 * Erkennt Standard-Markdown-Tabellen (mit Trenn-Zeile `|---|---|`)
 * und behandelt zusammenhängende Pipe-Zeilen ohne Trenner als Absätze.
 */
export function parseMarkdownToLines(markdown: string): ParsedLine[] {
  const lines = markdown.split("\n");
  const result: ParsedLine[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Tabellen-Erkennung: alle aufeinanderfolgenden Pipe-Zeilen einsammeln
    if (trimmed.includes("|")) {
      const pipeLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().includes("|")) {
        pipeLines.push(lines[j].trim());
        j++;
      }

      const isRealTable =
        pipeLines.length >= 3 &&
        /^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)*\|?\s*$/.test(pipeLines[1]);

      if (isRealTable) {
        const tableHeader = parsePipeRow(pipeLines[0]);
        const tableRows: string[][] = [];
        for (let k = 2; k < pipeLines.length; k++) {
          const row = parsePipeRow(pipeLines[k]);
          if (row.length > 0) tableRows.push(row);
        }
        result.push({ type: "table", text: "", tableHeader, tableRows });
      } else {
        // Pipe-Zeilen ohne Trenner als normale Absätze behandeln
        for (const pl of pipeLines) {
          result.push({ type: "p", text: pl });
        }
      }
      i = j;
      continue;
    }

    // Überschriften / Listen / Absätze
    if (trimmed.startsWith("### ")) {
      result.push({ type: "h3", text: trimmed.slice(4) });
    } else if (trimmed.startsWith("## ")) {
      result.push({ type: "h2", text: trimmed.slice(3) });
    } else if (trimmed.startsWith("# ")) {
      result.push({ type: "h1", text: trimmed.slice(2) });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      result.push({ type: "li", text: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      result.push({ type: "li", text: trimmed.replace(/^\d+\.\s/, "") });
    } else {
      result.push({ type: "p", text: trimmed });
    }
    i++;
  }

  return result;
}

/** Zerlegt eine Markdown-Tabellenzeile `| a | b |` in Zellen-Strings. */
export function parsePipeRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell, idx, arr) => arr.length > 1 || cell !== "");
}

/** Entfernt Inline-Markdown (Bold/Italic/Code/Links) für Klartext-Ausgabe. */
export function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1");
}
