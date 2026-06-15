import { describe, expect, it } from "vitest";
import {
  parseImportFile,
  detectDelimiter,
  resolveImportFormat,
  CSV_HEADERS,
} from "@/lib/exportImport";

const DEFAULT_MONTH = "2026-06";

describe("detectDelimiter", () => {
  it("detects tab-separated content", () => {
    expect(detectDelimiter("title\ttotalAmount\tamountPaid\nRent\t100\t0")).toBe("\t");
  });

  it("detects comma-separated content", () => {
    expect(detectDelimiter("title,totalAmount,amountPaid\nRent,100,0")).toBe(",");
  });
});

describe("resolveImportFormat", () => {
  it("auto-detects JSON", () => {
    expect(resolveImportFormat("auto", '{"version":1,"expenses":[]}')).toBe("json");
  });

  it("auto-detects TSV from tabs", () => {
    const tsv = `${CSV_HEADERS.join("\t")}\nRent\t1200\t0\tunpaid\tHigh\tHousing\t2026-04\t\tfalse\t`;
    expect(resolveImportFormat("auto", tsv)).toBe("tsv");
  });
});

describe("parseImportFile JSON", () => {
  it("parses valid expenses", () => {
    const json = JSON.stringify({
      version: 1,
      expenses: [
        {
          title: "Rent",
          totalAmount: 1200,
          amountPaid: 0,
          status: "unpaid",
          priority: "High",
          category: "Housing",
          monthKey: "2026-04",
          rolledOver: false,
        },
      ],
    });
    const result = parseImportFile(json, "json", { defaultMonthKey: DEFAULT_MONTH });
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]?.title).toBe("Rent");
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing title", () => {
    const json = JSON.stringify({
      version: 1,
      expenses: [{ totalAmount: 100 }],
    });
    const result = parseImportFile(json, "json", { defaultMonthKey: DEFAULT_MONTH });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toBe("missing title");
  });

  it("rejects invalid totalAmount", () => {
    const json = JSON.stringify({
      version: 1,
      expenses: [{ title: "Bad", totalAmount: 0 }],
    });
    const result = parseImportFile(json, "json", { defaultMonthKey: DEFAULT_MONTH });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.message).toBe("invalid totalAmount");
  });
});

describe("parseImportFile CSV", () => {
  const header = CSV_HEADERS.join(",");

  it("parses valid CSV rows", () => {
    const csv = `${header}\nCoffee,4.50,4.50,paid,Low,Food,2026-04,,false,`;
    const result = parseImportFile(csv, "csv", { defaultMonthKey: DEFAULT_MONTH });
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]?.title).toBe("Coffee");
    expect(result.valid[0]?.status).toBe("paid");
  });

  it("falls back to default monthKey", () => {
    const csv = `${header}\nSnack,5,0,unpaid,Medium,,,,false,`;
    const result = parseImportFile(csv, "csv", { defaultMonthKey: DEFAULT_MONTH });
    expect(result.valid[0]?.monthKey).toBe(DEFAULT_MONTH);
  });

  it("reports row-level errors", () => {
    const csv = `${header}\n,100,0,unpaid,Medium,,,,false,`;
    const result = parseImportFile(csv, "csv", { defaultMonthKey: DEFAULT_MONTH });
    expect(result.valid).toHaveLength(0);
    expect(result.errors[0]?.row).toBe(2);
    expect(result.errors[0]?.message).toBe("missing title");
  });
});

describe("parseImportFile TSV", () => {
  it("parses tab-separated spreadsheet paste", () => {
    const tsv = [
      CSV_HEADERS.join("\t"),
      ["Rent", "1200", "0", "unpaid", "High", "Housing", "2026-05", "", "false", ""].join("\t"),
    ].join("\n");
    const result = parseImportFile(tsv, "auto", { defaultMonthKey: DEFAULT_MONTH });
    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]?.title).toBe("Rent");
    expect(result.valid[0]?.monthKey).toBe("2026-05");
  });
});
