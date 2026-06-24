import { describe, expect, it } from "vitest";
import { parseDatePhrase } from "@/lib/parseDatePhrase";

describe("parseDatePhrase", () => {
  const ref = new Date("2026-06-23T15:00:00").getTime();

  it("parses today", () => {
    const d = parseDatePhrase("today", ref);
    expect(new Date(d!).getDate()).toBe(23);
  });

  it("parses tomorrow", () => {
    const d = parseDatePhrase("tomorrow", ref);
    expect(new Date(d!).getDate()).toBe(24);
  });

  it("parses ISO date", () => {
    const d = parseDatePhrase("2026-06-30", ref);
    expect(new Date(d!).getFullYear()).toBe(2026);
    expect(new Date(d!).getMonth()).toBe(5);
    expect(new Date(d!).getDate()).toBe(30);
  });

  it("parses weekday", () => {
    const d = parseDatePhrase("friday", ref);
    expect(new Date(d!).getDay()).toBe(5);
  });
});
