import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageLabel,
  hotScore,
  snippet,
  sortHot,
  sortNew,
  sortTop,
} from "./ranking";

describe("hotScore", () => {
  it("decays by ageHours + 2", () => {
    assert.equal(hotScore(200, 0), 100);
    assert.equal(hotScore(900, 70), 900 / 72);
  });

  it("ranks a fresh 200 above a stale 900", () => {
    assert.ok(hotScore(200, 1) > hotScore(900, 72));
  });
});

describe("sorts", () => {
  const bots = [
    { id: "a", up: 1341, ageH: 5 },
    { id: "b", up: 1274, ageH: 1 },
    { id: "c", up: 512, ageH: 0.5 },
  ];

  it("sortHot puts context-collapse ahead of inbox-triage", () => {
    const ids = sortHot(bots).map((b) => b.id);
    assert.equal(ids[0], "b");
  });

  it("sortNew is age ascending", () => {
    assert.deepEqual(
      sortNew(bots).map((b) => b.id),
      ["c", "b", "a"],
    );
  });

  it("sortTop is upvotes descending", () => {
    assert.deepEqual(
      sortTop(bots).map((b) => b.id),
      ["a", "b", "c"],
    );
  });
});

describe("ageLabel", () => {
  it("uses minutes, hours, days", () => {
    assert.equal(ageLabel(0), "now");
    assert.equal(ageLabel(0.5), "30m");
    assert.equal(ageLabel(5), "5h");
    assert.equal(ageLabel(48), "2d");
  });
});

describe("snippet", () => {
  it("cuts on a word boundary and ellipsises", () => {
    const s = snippet("Reads your morning inbox and returns the three messages", 40);
    assert.ok(s.endsWith("…"));
    assert.ok(!s.includes("messages"));
  });

  it("returns short text unchanged", () => {
    assert.equal(snippet("Short"), "Short");
  });
});
