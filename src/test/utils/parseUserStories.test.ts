import { describe, it, expect } from "vitest";
import { parseUserStories } from "@/features/editor/utils/parseUserStories";

describe("parseUserStories", () => {
  it("returns empty array for empty document", () => {
    expect(parseUserStories("")).toEqual([]);
    expect(parseUserStories("   \n\n")).toEqual([]);
  });

  it("parses H2 headers as titles", () => {
    const doc = `## Overview

Some description here.

## Next Section

More text.`;
    const items = parseUserStories(doc);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      title: "Overview",
      description: "Some description here.",
      selected: true,
    });
    expect(items[1]).toEqual({
      title: "Next Section",
      description: "More text.",
      selected: true,
    });
  });

  it("parses H3 headers as titles", () => {
    const doc = `### Feature A

Details for A.

### Feature B

Details for B.`;
    const items = parseUserStories(doc);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Feature A");
    expect(items[1].title).toBe("Feature B");
  });

  it("parses list items with **bold** as titles", () => {
    const doc = `- **User can login**

  Acceptance criteria here.

- **User can logout**

  Another criterion.`;
    const items = parseUserStories(doc);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      title: "User can login",
      description: "Acceptance criteria here.",
      selected: true,
    });
    expect(items[1].title).toBe("User can logout");
  });

  it('parses "Als ..." / "As a ..." lines as titles', () => {
    const doc = `* Als Product Owner möchte ich Prioritäten setzen

  So dass das Team weiß was zuerst kommt.

* As a developer I want clear specs

  So that I can implement.`;
    const items = parseUserStories(doc);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Als Product Owner möchte ich Prioritäten setzen");
    expect(items[1].title).toBe("As a developer I want clear specs");
  });

  it("mixed document: H2, H3 and list items", () => {
    const doc = `## Epic 1

Intro text.

### Story 1.1

- **Story 1.1.1**

  Details.`;
    const items = parseUserStories(doc);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].title).toBe("Epic 1");
    expect(items[1].title).toBe("Story 1.1");
    expect(items.some((i) => i.title === "Story 1.1.1")).toBe(true);
  });

  it("every item has selected: true", () => {
    const doc = `## A

a

## B

b`;
    const items = parseUserStories(doc);
    expect(items.every((i) => i.selected === true)).toBe(true);
  });
});
