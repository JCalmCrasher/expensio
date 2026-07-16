import { describe, expect, it } from "vitest";
import {
  isReturningUserForRelease,
  isWhatsNewWindowOpen,
  previousDayYmd,
  resolveFirstOpenAt,
  shouldAutoShowWhatsNew,
} from "@/lib/whatsNew";

describe("isWhatsNewWindowOpen", () => {
  const releasedAt = "2026-07-16";
  const windowDays = 7;
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(2026, 6, 16).getTime();

  it("is open on the release day", () => {
    expect(isWhatsNewWindowOpen(start + 1, { releasedAt, windowDays })).toBe(true);
  });

  it("closes after the window ends", () => {
    expect(isWhatsNewWindowOpen(start + 7 * day, { releasedAt, windowDays })).toBe(false);
  });
});

describe("returning user targeting", () => {
  it("previousDayYmd steps back one calendar day", () => {
    expect(previousDayYmd("2026-07-16")).toBe("2026-07-15");
    expect(previousDayYmd("2026-03-01")).toBe("2026-02-28");
  });

  it("treats first-open before release as returning", () => {
    expect(isReturningUserForRelease("2026-07-15", "2026-07-16")).toBe(true);
    expect(isReturningUserForRelease("2026-07-16", "2026-07-16")).toBe(false);
    expect(isReturningUserForRelease(null, "2026-07-16")).toBe(false);
  });

  it("backdates first-open for known returning users without a stamp", () => {
    expect(
      resolveFirstOpenAt(null, true, {
        releasedAt: "2026-07-16",
        nowMs: new Date(2026, 6, 16, 12).getTime(),
      }),
    ).toBe("2026-07-15");
  });

  it("stamps today for brand-new installs", () => {
    expect(
      resolveFirstOpenAt(null, false, {
        releasedAt: "2026-07-16",
        nowMs: new Date(2026, 6, 16, 12).getTime(),
      }),
    ).toBe("2026-07-16");
  });

  it("auto-shows only for unseen returning users inside the window", () => {
    const now = new Date(2026, 6, 18, 12).getTime();
    expect(
      shouldAutoShowWhatsNew(now, { firstOpenAt: "2026-07-15", seen: false }),
    ).toBe(true);
    expect(
      shouldAutoShowWhatsNew(now, { firstOpenAt: "2026-07-16", seen: false }),
    ).toBe(false);
    expect(
      shouldAutoShowWhatsNew(now, { firstOpenAt: "2026-07-15", seen: true }),
    ).toBe(false);
  });
});
