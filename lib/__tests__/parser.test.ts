import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "@/lib/parser";

describe("parseQuickAdd", () => {
  it("parses basic expense", () => {
    const r = parseQuickAdd("Coffee 4.50");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.expense.title).toBe("Coffee");
    expect(r.expense.totalAmount).toBe(4.5);
  });

  it("parses paid high priority", () => {
    const r = parseQuickAdd("Rent 1200 paid high");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.expense.status).toBe("paid");
    expect(r.expense.priority).toBe("High");
    expect(r.expense.amountPaid).toBe(1200);
  });

  it("parses hash category", () => {
    const r = parseQuickAdd("Coffee 4.50 #food");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.categoryFromParser).toBe("food");
  });

  it("parses at category with casing", () => {
    const r = parseQuickAdd("Coffee 4.50 @Food");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.categoryFromParser).toBe("Food");
  });

  it("parses bare trailing category", () => {
    const r = parseQuickAdd("Coffee 4.50 food");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.categoryFromParser).toBe("food");
    expect(r.expense.title).toBe("Coffee");
  });

  it("parses due friday", () => {
    const r = parseQuickAdd("Rent 1200 due friday");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.expense.dueDate).toBeTypeOf("number");
    expect(new Date(r.expense.dueDate!).getDay()).toBe(5);
  });

  it("parses due ISO date", () => {
    const r = parseQuickAdd("Rent 1200 due 2026-06-30");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = new Date(r.expense.dueDate!);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(30);
  });

  it("parses note", () => {
    const r = parseQuickAdd("Coffee 4.50 note: oat milk");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.expense.note).toBe("oat milk");
  });

  it("requires amount", () => {
    const r = parseQuickAdd("Coffee only");
    expect(r.ok).toBe(false);
  });
});
