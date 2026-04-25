export interface ParsedItem {
  title: string;
  description: string;
  selected: boolean;
}

/**
 * Parses a markdown document into exportable items (user stories / sections).
 * Recognizes H2/H3 headers, list items with **bold** titles, and "Als .../As a ..." lines.
 */
export function parseUserStories(doc: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = doc.split("\n");

  let currentTitle = "";
  let currentDesc: string[] = [];

  const flushItem = () => {
    if (currentTitle) {
      items.push({
        title: currentTitle,
        description: currentDesc.join("\n").trim(),
        selected: true,
      });
    }
    currentTitle = "";
    currentDesc = [];
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    const storyMatch = line.match(/^[-*]\s+\*\*(.+?)\*\*/);
    const asAMatch = line.match(/^[-*]\s+(Als\s+.+|As\s+a\s+.+)/i);

    if (h2Match || h3Match) {
      flushItem();
      currentTitle = (h2Match?.[1] ?? h3Match?.[1] ?? "").trim();
    } else if (storyMatch) {
      flushItem();
      currentTitle = storyMatch[1].trim();
    } else if (asAMatch) {
      flushItem();
      currentTitle = asAMatch[1].trim();
    } else if (currentTitle) {
      currentDesc.push(line);
    }
  }
  flushItem();

  return items;
}
