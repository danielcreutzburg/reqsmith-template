import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { useProposedChanges } from "@/features/editor/hooks/useProposedChanges";
import type { Section, Operation } from "@/features/editor/types/document";

const sections: Section[] = [
  { id: "1", sectionKey: "ziele", title: "Ziele", content: "Existierender Inhalt.", orderIndex: 0, status: "draft", metadata: {} },
  { id: "2", sectionKey: "leer", title: "Leer", content: "", orderIndex: 1, status: "draft", metadata: {} },
];

describe("useProposedChanges", () => {
  it("classifies replace on existing-with-content as review", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("# md");
    const ops: Operation[] = [
      { type: "replace_section_content", sectionKey: "ziele", content: "Neu" },
    ];
    act(() => result.current.processOperations(sections, ops, "summary", apply));
    expect(result.current.pendingCount).toBe(1);
    expect(apply).not.toHaveBeenCalled();
  });

  it("applies replace on empty section directly", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("# md");
    const ops: Operation[] = [
      { type: "replace_section_content", sectionKey: "leer", content: "Inhalt" },
    ];
    act(() => result.current.processOperations(sections, ops, "summary", apply));
    expect(apply).toHaveBeenCalledOnce();
    expect(result.current.pendingCount).toBe(0);
  });

  it("applies create_section directly without review", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("# md");
    const ops: Operation[] = [
      { type: "create_section", sectionKey: "neu", title: "Neu", content: "x" } as any,
    ];
    act(() => result.current.processOperations(sections, ops, "s", apply));
    expect(apply).toHaveBeenCalledOnce();
    expect(result.current.pendingCount).toBe(0);
  });

  it("acceptChange applies the edit and removes proposal", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("after");
    act(() =>
      result.current.processOperations(
        sections,
        [{ type: "replace_section_content", sectionKey: "ziele", content: "Neu" }],
        "s",
        apply
      )
    );
    const id = result.current.proposedChanges[0].id;
    let res: string | null = null;
    act(() => {
      res = result.current.acceptChange(id, sections, apply);
    });
    expect(res).toBe("after");
    expect(result.current.pendingCount).toBe(0);
  });

  it("acceptChange returns null for unknown id", () => {
    const { result } = renderHook(() => useProposedChanges());
    let res: string | null = "x";
    act(() => {
      res = result.current.acceptChange("nope", sections, vi.fn().mockReturnValue("y"));
    });
    expect(res).toBeNull();
  });

  it("acceptWithEdit uses edited content", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("md");
    act(() =>
      result.current.processOperations(
        sections,
        [{ type: "replace_section_content", sectionKey: "ziele", content: "Neu" }],
        "s",
        apply
      )
    );
    const id = result.current.proposedChanges[0].id;
    act(() => result.current.acceptWithEdit(id, "edited body", sections, apply));
    expect(apply).toHaveBeenLastCalledWith([
      expect.objectContaining({ content: "edited body" }),
    ]);
  });

  it("acceptWithEdit returns null for unknown id", () => {
    const { result } = renderHook(() => useProposedChanges());
    let res: string | null = "x";
    act(() => {
      res = result.current.acceptWithEdit("nope", "x", sections, vi.fn().mockReturnValue("y"));
    });
    expect(res).toBeNull();
  });

  it("rejectChange removes proposal", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("md");
    act(() =>
      result.current.processOperations(
        sections,
        [{ type: "replace_section_content", sectionKey: "ziele", content: "Neu" }],
        "s",
        apply
      )
    );
    const id = result.current.proposedChanges[0].id;
    act(() => result.current.rejectChange(id));
    expect(result.current.pendingCount).toBe(0);
  });

  it("acceptAll applies all and clears", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("done");
    const sectionsWithMore: Section[] = [
      ...sections,
      { id: "3", sectionKey: "weitere", title: "Weitere", content: "x", orderIndex: 2, status: "draft", metadata: {} },
    ];
    act(() =>
      result.current.processOperations(
        sectionsWithMore,
        [
          { type: "replace_section_content", sectionKey: "ziele", content: "A" },
          { type: "replace_section_content", sectionKey: "weitere", content: "B" },
        ],
        "s",
        apply
      )
    );
    expect(result.current.pendingCount).toBe(2);
    let res: string | null = null;
    act(() => {
      res = result.current.acceptAll(sectionsWithMore, apply);
    });
    expect(res).toBe("done");
    expect(result.current.pendingCount).toBe(0);
  });

  it("acceptAll returns null when no proposals", () => {
    const { result } = renderHook(() => useProposedChanges());
    let res: string | null = "x";
    act(() => {
      res = result.current.acceptAll(sections, vi.fn().mockReturnValue("z"));
    });
    expect(res).toBeNull();
  });

  it("rejectAll and clear empty the queue", () => {
    const { result } = renderHook(() => useProposedChanges());
    const apply = vi.fn().mockReturnValue("md");
    act(() =>
      result.current.processOperations(
        sections,
        [{ type: "replace_section_content", sectionKey: "ziele", content: "Neu" }],
        "s",
        apply
      )
    );
    act(() => result.current.rejectAll());
    expect(result.current.pendingCount).toBe(0);
    act(() => result.current.clear());
    expect(result.current.pendingCount).toBe(0);
  });
});
