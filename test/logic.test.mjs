/* Tests for Seclusa Convert pure logic.
   Run with: node --test test/ */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const jsDir = join(here, "..", "static", "js");

function load(file, extra = {}) {
  const source = readFileSync(join(jsDir, file), "utf8");
  const win = { ...extra };
  new Function("window", source)(win);
  return win;
}

/* ------------------------------------------------------------------ theme */

const { Theme } = load("theme.js", {
  Store: { getTheme: () => "system", setTheme: () => {} },
  matchMedia: () => ({ matches: true, addEventListener() {} }),
  document: {
    documentElement: { getAttribute: () => null, setAttribute() {}, removeAttribute() {} },
    querySelectorAll: () => [],
    getElementById: () => null,
    adoptedStyleSheets: [],
  },
});

test("an explicit mode resolves to itself", () => {
  assert.equal(Theme.resolve("light"), "light");
  assert.equal(Theme.resolve("dark"), "dark");
});

test("system mode follows the operating system", () => {
  assert.equal(Theme.resolve("system"), "dark");
});

/* ------------------------------------------------------------------ store */

test("the store reads back what it wrote", () => {
  const { Store } = load("store.js", { localStorage: null });
  Store.setData({ hello: "world" });
  assert.deepEqual(Store.getData(), { hello: "world" });
});

test("corrupt data is dropped rather than thrown", () => {
  const storage = {
    _v: {},
    getItem(k) { return k in this._v ? this._v[k] : null; },
    setItem(k, v) { this._v[k] = String(v); },
    removeItem(k) { delete this._v[k]; },
  };
  const { Store } = load("store.js", { localStorage: storage });
  storage.setItem("seclusa.convert.data", "{not json");
  assert.deepEqual(Store.getData(), {});
});

test("clearing removes the app's own keys and nothing else", () => {
  const storage = {
    _v: { "seclusa.convert.data": "{}", "somebody.elses.key": "keep me" },
    getItem(k) { return k in this._v ? this._v[k] : null; },
    setItem(k, v) { this._v[k] = String(v); },
    removeItem(k) { delete this._v[k]; },
  };
  const { Store } = load("store.js", { localStorage: storage });
  Store.clearAll();
  assert.equal(storage.getItem("seclusa.convert.data"), null);
  assert.equal(storage.getItem("somebody.elses.key"), "keep me");
});

/* ---------------------------------------------------------------- convert */

const { Convert } = load("convert.js");

test("metres to feet", () => {
  const ft = Convert.convert("length", 1, "m", "ft");
  assert.ok(Math.abs(ft - 3.280839895) < 1e-9);
});

test("miles to kilometres", () => {
  const km = Convert.convert("length", 1, "mi", "km");
  assert.ok(Math.abs(km - 1.609344) < 1e-9);
});

test("celsius to fahrenheit", () => {
  assert.equal(Convert.convert("temperature", 0, "C", "F"), 32);
  assert.equal(Convert.convert("temperature", 100, "C", "F"), 212);
  assert.equal(Convert.convert("temperature", -40, "C", "F"), -40);
});

test("fahrenheit to kelvin", () => {
  const k = Convert.convert("temperature", 32, "F", "K");
  assert.ok(Math.abs(k - 273.15) < 1e-9);
});

test("same unit is identity", () => {
  assert.equal(Convert.convert("mass", 42, "kg", "kg"), 42);
});

test("kilograms to pounds", () => {
  const lb = Convert.convert("mass", 1, "kg", "lb");
  assert.ok(Math.abs(lb - (1 / 0.45359237)) < 1e-9);
});

test("litres to US gallons", () => {
  const gal = Convert.convert("volume", 3.785411784, "L", "gal_us");
  assert.ok(Math.abs(gal - 1) < 1e-9);
});

test("bits and bytes", () => {
  assert.equal(Convert.convert("data", 8, "bit", "B"), 1);
  assert.equal(Convert.convert("data", 1, "KiB", "B"), 1024);
  assert.equal(Convert.convert("data", 1, "kB", "B"), 1000);
});

test("degrees to radians", () => {
  const rad = Convert.convert("angle", 180, "deg", "rad");
  assert.ok(Math.abs(rad - Math.PI) < 1e-9);
});

test("invalid input yields NaN", () => {
  assert.ok(Number.isNaN(Convert.convert("length", NaN, "m", "ft")));
  assert.ok(Number.isNaN(Convert.convert("nope", 1, "m", "ft")));
  assert.ok(Number.isNaN(Convert.convert("length", 1, "m", "nope")));
});

test("parseInput accepts commas and rejects junk", () => {
  assert.equal(Convert.parseInput("1,5"), 1.5);
  assert.equal(Convert.parseInput(" 42 "), 42);
  assert.ok(Number.isNaN(Convert.parseInput("")));
  assert.ok(Number.isNaN(Convert.parseInput("abc")));
});

test("parseInput handles US and European grouping", () => {
  assert.equal(Convert.parseInput("1,234"), 1234);
  assert.equal(Convert.parseInput("1,234.56"), 1234.56);
  assert.equal(Convert.parseInput("1.234,56"), 1234.56);
  assert.equal(Convert.parseInput("1.234.567"), 1234567);
  assert.ok(Number.isNaN(Convert.parseInput("12,34,56")));
});

test("format trims trailing zeros", () => {
  assert.equal(Convert.format(0), "0");
  assert.equal(Convert.format(2), "2");
  assert.equal(Convert.format(2.5), "2.5");
  assert.equal(Convert.format(NaN), "—");
});

test("format uses compact form for tiny and huge values", () => {
  assert.equal(Convert.format(1e-7), "1e-7");
  assert.equal(Convert.format(1e9), "1e9");
  assert.equal(Convert.format(1.25e9), "1.25e9");
  assert.equal(Convert.format(-1.23e-7), "-1.23e-7");
});

test("grouped numbers can carry an exponent", () => {
  assert.equal(Convert.parseInput("1,234e2"), 123400);
  assert.equal(Convert.parseInput("1.234.567e2"), 123456700);
  assert.equal(Convert.parseInput("1.234e2"), 123.4);
  assert.equal(Convert.parseInput("1,5e1"), 15);
});

test("theme is remembered when storage throws", () => {
  const throwing = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  const { Store } = load("store.js", { localStorage: throwing });
  assert.equal(Store.setTheme("dark"), "dark");
  assert.equal(Store.getTheme(), "dark");
  Store.setTheme("system");
  assert.equal(Store.getTheme(), "system");
});

test("a single dot is a decimal point", () => {
  assert.equal(Convert.parseInput("1.234"), 1.234);
  assert.equal(Convert.parseInput("1.500"), 1.5);
  assert.equal(Convert.parseInput("10.000"), 10);
  assert.equal(Convert.parseInput("+32"), 32);
  assert.equal(Convert.parseInput("1."), 1);
  assert.equal(Convert.parseInput("-1.234"), -1.234);
});

test("three decimal places stay fractional metres", () => {
  const km = Convert.convert("length", Convert.parseInput("1.500"), "m", "km");
  assert.ok(Math.abs(km - 0.0015) < 1e-12);
});

test("zero is a real measurement", () => {
  assert.equal(Convert.convert("length", 0, "m", "ft"), 0);
  assert.equal(Convert.convert("temperature", 0, "K", "C"), -273.15);
});

test("knot and kilometre per hour use exact factors", () => {
  const kn = Convert.convert("speed", 1, "kn", "mps");
  assert.ok(Math.abs(kn - 1852 / 3600) < 1e-12);
  const kmh = Convert.convert("speed", 1, "kmh", "mps");
  assert.ok(Math.abs(kmh - 1000 / 3600) < 1e-12);
});

test("swap round-trip returns to the original length", () => {
  const ft = Convert.convert("length", 1, "m", "ft");
  const back = Convert.convert("length", ft, "ft", "m");
  assert.ok(Math.abs(back - 1) < 1e-12);
});

test("normalizeState drops unknown category and units", () => {
  const state = Convert.normalizeState(
    { category: "nope", from: "x", to: "y", value: "9" },
    { category: "length", from: "m", to: "ft", value: "1" }
  );
  assert.equal(state.category, "length");
  assert.equal(state.from, "m");
  assert.equal(state.to, "ft");
  assert.equal(state.value, "9");
});

test("normalizeState caps a huge value and keeps numeric zero", () => {
  const huge = "9".repeat(200);
  const state = Convert.normalizeState(
    { category: "length", from: "m", to: "ft", value: huge },
    { category: "length", from: "m", to: "ft", value: "1" }
  );
  assert.equal(state.value.length, Convert.MAX_VALUE_CHARS);
  assert.equal(state.value, huge.slice(0, Convert.MAX_VALUE_CHARS));
  const zero = Convert.normalizeState(
    { category: "temperature", from: "C", to: "F", value: 0 },
    { category: "length", from: "m", to: "ft", value: "1" }
  );
  assert.equal(zero.value, "0");
  assert.equal(zero.category, "temperature");
});

test("oversized stored JSON is dropped", () => {
  const storage = {
    _v: {},
    getItem(k) { return k in this._v ? this._v[k] : null; },
    setItem(k, v) { this._v[k] = String(v); },
    removeItem(k) { delete this._v[k]; },
  };
  storage.setItem("seclusa.convert.data", JSON.stringify({ value: "1".repeat(9000) }));
  const { Store } = load("store.js", { localStorage: storage });
  assert.deepEqual(Store.getData(), {});
  assert.equal(storage.getItem("seclusa.convert.data"), null);
});

test("normalizeState keeps valid prefs", () => {
  const state = Convert.normalizeState(
    { category: "temperature", from: "C", to: "F", value: "100" },
    { category: "length", from: "m", to: "ft", value: "1" }
  );
  assert.deepEqual(state, {
    category: "temperature",
    from: "C",
    to: "F",
    value: "100",
  });
});
