import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FREE_DAILY_SECONDS_LIMIT,
  FREE_LESSONS_LIMIT,
  getLastNoonBoundary,
  getNextNoonBoundary,
  shouldResetAtNoon,
} from "./noon.ts";
import { LESSONS, STAGES } from "./curriculum.ts";

describe("Noon daily reset quota logic", () => {
  it("uses 10 minutes (600s) and 5 free lessons", () => {
    assert.equal(FREE_DAILY_SECONDS_LIMIT, 600);
    assert.equal(FREE_LESSONS_LIMIT, 5);
  });

  it("returns yesterday noon when current time is before 12:00", () => {
    const morning = new Date(2026, 10, 21, 9, 30, 0);
    const lastNoon = getLastNoonBoundary(morning);
    assert.equal(lastNoon.getDate(), 20);
    assert.equal(lastNoon.getHours(), 12);
    assert.equal(lastNoon.getMinutes(), 0);
  });

  it("returns today noon when current time is after 12:00", () => {
    const afternoon = new Date(2026, 10, 21, 14, 15, 0);
    const lastNoon = getLastNoonBoundary(afternoon);
    assert.equal(lastNoon.getDate(), 21);
    assert.equal(lastNoon.getHours(), 12);
  });

  it("resets when lastResetAt is before latest noon boundary", () => {
    const lastReset = new Date(2026, 10, 21, 11, 50, 0);
    const now = new Date(2026, 10, 21, 12, 5, 0);
    assert.equal(shouldResetAtNoon(lastReset, now), true);
  });

  it("does not reset when lastResetAt is already after latest noon boundary", () => {
    const lastReset = new Date(2026, 10, 21, 12, 10, 0);
    const now = new Date(2026, 10, 21, 18, 0, 0);
    assert.equal(shouldResetAtNoon(lastReset, now), false);
  });

  it("computes next noon boundary accurately", () => {
    const afternoon = new Date(2026, 10, 21, 15, 0, 0);
    const nextNoon = getNextNoonBoundary(afternoon);
    assert.equal(nextNoon.getDate(), 22);
    assert.equal(nextNoon.getHours(), 12);
  });
});

describe("Curriculum structure", () => {
  it("has 3 stages and 6 levels", () => {
    assert.equal(STAGES.length, 3);
    const levels = STAGES.flatMap((s) => s.levels.map((l) => l.id));
    assert.deepEqual(levels, ["A1", "A2", "B1", "B2", "C1", "C2"]);
  });

  it("provides exactly 5 free lessons and remaining Pro lessons", () => {
    const freeLessons = LESSONS.filter((l) => l.isFree);
    const proLessons = LESSONS.filter((l) => !l.isFree);
    assert.equal(freeLessons.length, 5);
    assert.ok(proLessons.length >= 7);
  });
});
