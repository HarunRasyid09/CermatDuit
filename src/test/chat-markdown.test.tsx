import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMarkdown, normalizeMarkdown } from "@/components/chat-markdown";

const LONG_REPLY = [
  "Dana darurat adalah **uang yang disiapkan khusus** untuk keadaan mendesak.",
  "",
  "Ini alasannya:",
  "",
  "- Menghindari utang saat darurat",
  "- Menjaga rencana keuangan tetap jalan",
  "",
  "Langkah membangunnya:",
  "",
  "1. Hitung pengeluaran bulanan",
  "2. Sisihkan minimal 10% penghasilan",
  "3. Simpan di **instrumen cair**",
  "",
  "Target idealnya 3–6 bulan pengeluaran.",
].join("\n");

describe("ChatMarkdown", () => {
  it("renders bold, bullets and numbered steps instead of raw markdown", () => {
    const { container } = render(<ChatMarkdown>{LONG_REPLY}</ChatMarkdown>);

    const bolds = Array.from(container.querySelectorAll("strong")).map((n) => n.textContent);
    expect(bolds).toContain("uang yang disiapkan khusus");
    expect(bolds).toContain("instrumen cair");

    expect(container.querySelector("ul")).not.toBeNull();
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(3);
    expect(container.querySelector("ol")?.getAttribute("class")).toContain("list-decimal");

    expect(container.querySelectorAll("p").length).toBeGreaterThanOrEqual(3);
    expect(container.textContent).not.toContain("*");
    expect(container.textContent).not.toContain("- Menghindari");
  });

  it("keeps short replies on one paragraph", () => {
    const { container } = render(<ChatMarkdown>{`Hemat itu **kebiasaan**, bukan pelit.`}</ChatMarkdown>);
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container.querySelector("strong")?.textContent).toBe("kebiasaan");
    expect(container.textContent).not.toContain("**");
  });

  it("renders headings, tables and links from gfm output", () => {
    const reply = ["## Ringkasan", "", "| Nama | Nilai |", "| --- | --- |", "| Dana | 1000 |", "", "Lihat [tabel](https://example.com)."].join("\n");
    const { container } = render(<ChatMarkdown>{reply}</ChatMarkdown>);
    expect(container.querySelector("h2")?.textContent).toBe("Ringkasan");
    expect(container.querySelectorAll("th")).toHaveLength(2);
    expect(container.querySelectorAll("td")).toHaveLength(2);
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("does not render raw html from the assistant", () => {
    const { container } = render(<ChatMarkdown>{`<img src=x onerror=alert(1)>`}</ChatMarkdown>);
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("normalizeMarkdown", () => {
  it("inserts the blank line a list needs after a paragraph line", () => {
    const out = normalizeMarkdown("Ini alasannya:\n- satu\n- dua\nSelesai.");
    expect(out).toBe("Ini alasannya:\n\n- satu\n- dua\n\nSelesai.");
  });

  it("turns literal \\n sequences into real newlines", () => {
    const out = normalizeMarkdown("Paragraf satu.\\n\\n**Penting**");
    expect(out).toContain("\n\n");
    expect(out).not.toContain("\\n");
  });

  it("keeps list continuation lines inside their item", () => {
    const out = normalizeMarkdown("- satu\n  lanjutannya\n- dua");
    expect(out).toBe("- satu\n  lanjutannya\n- dua");
  });

  it("collapses runs of empty lines", () => {
    expect(normalizeMarkdown("a\n\n\n\n\nb")).toBe("a\n\nb");
  });
});
