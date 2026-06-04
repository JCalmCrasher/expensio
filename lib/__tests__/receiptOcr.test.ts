import { describe, expect, it } from "vitest";
import { parseReceiptOcrText } from "@/lib/receiptOcr";

describe("parseReceiptOcrText", () => {
  it("extracts merchant and total with currency symbol", () => {
    const text = `
      STARBUCKS COFFEE
      123 Main St
      Subtotal £4.20
      Tax £0.80
      TOTAL £5.00
    `;
    const r = parseReceiptOcrText(text);
    expect(r.merchant).toMatch(/STARBUCKS/i);
    expect(r.amount).toBe(5);
    expect(r.quickAddLine).toBe("STARBUCKS COFFEE 5");
  });

  it("prefers total line over smaller amounts", () => {
    const text = `
      Shop Name
      Item 1  $3.00
      Item 2  $7.50
      TOTAL DUE  $10.50
    `;
    const r = parseReceiptOcrText(text);
    expect(r.amount).toBe(10.5);
  });

  it("handles naira amounts", () => {
    const text = `
      LAGOS MART
      Amount: ₦12,450.00
    `;
    const r = parseReceiptOcrText(text);
    expect(r.amount).toBe(12450);
    expect(r.merchant).toMatch(/LAGOS/i);
  });

  it("returns null quickAddLine when no amount", () => {
    const r = parseReceiptOcrText("Thank you for visiting\nNo numbers here");
    expect(r.quickAddLine).toBeNull();
  });

  it("parses informal plain-integer notes", () => {
    const r = parseReceiptOcrText("food 50 from iya basira");
    expect(r.amount).toBe(50);
    expect(r.merchant).toMatch(/iya basira/i);
    expect(r.quickAddLine).toBe("food from iya basira 50");
  });
});
