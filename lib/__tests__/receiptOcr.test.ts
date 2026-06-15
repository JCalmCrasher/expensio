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

  it("extracts multiple line items from a receipt", () => {
    const text = `
      Shop Name
      Item 1  $3.00
      Item 2  $7.50
      TOTAL DUE  $10.50
    `;
    const r = parseReceiptOcrText(text);
    expect(r.lineItems).toHaveLength(2);
    expect(r.lineItems[0]?.title).toMatch(/Item 1/i);
    expect(r.lineItems[0]?.amount).toBe(3);
    expect(r.lineItems[1]?.amount).toBe(7.5);
    expect(r.amount).toBe(10.5);
  });

  it("extracts multiple informal lines as separate items", () => {
    const text = "food 50 from iya basira\ntransport 200";
    const r = parseReceiptOcrText(text);
    expect(r.lineItems.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty lineItems when no amount", () => {
    const r = parseReceiptOcrText("Thank you for visiting\nNo numbers here");
    expect(r.quickAddLine).toBeNull();
    expect(r.lineItems).toEqual([]);
  });

  it("parses informal plain-integer notes", () => {
    const r = parseReceiptOcrText("food 50 from iya basira");
    expect(r.amount).toBe(50);
    expect(r.merchant).toMatch(/iya basira/i);
    expect(r.quickAddLine).toBe("food from iya basira 50");
  });
});
