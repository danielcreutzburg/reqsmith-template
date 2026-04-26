import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "tok" } },
      }),
    },
  },
}));

vi.mock("@/integrations/supabase/functionUrl", () => ({
  buildFunctionUrl: vi.fn().mockReturnValue("/__supabase/functions/v1/parse-pdf"),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { DocumentImportButton } from "@/features/editor/components/DocumentImportButton";

function Wrap({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe("DocumentImportButton", () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Parsed PDF text content" }),
    });
  });

  it("calls parse-pdf via proxy URL and imports extracted text", async () => {
    const onImport = vi.fn();
    const { container } = render(
      <Wrap>
        <DocumentImportButton onImport={onImport} />
      </Wrap>,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-pdf-binary"], "test.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        "/__supabase/functions/v1/parse-pdf",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer tok",
          }),
        }),
      );
    });

    expect(onImport).toHaveBeenCalledWith("Parsed PDF text content", "test.pdf");
  });
});

