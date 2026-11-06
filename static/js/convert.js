/*
 * Seclusa Convert — pure conversion logic.
 *
 * Every category converts through a SI (or category) base unit. Temperature is
 * the exception: it uses explicit formulas rather than a linear scale factor.
 * Nothing here touches the network or the DOM.
 */

(function (global) {
  "use strict";

  /**
   * Categories. Each unit has:
   *   id    — stable key stored in preferences
   *   label — short display name
   *   toBase / fromBase — for linear units; omitted for temperature
   *
   * Storage uses SI decimal prefixes (kB = 1000 B). Binary prefixes are
   * separate units (KiB, MiB, …).
   */
  var CATEGORIES = [
    {
      id: "length",
      label: "Length",
      units: [
        { id: "m", label: "metre (m)", toBase: 1 },
        { id: "km", label: "kilometre (km)", toBase: 1000 },
        { id: "cm", label: "centimetre (cm)", toBase: 0.01 },
        { id: "mm", label: "millimetre (mm)", toBase: 0.001 },
        { id: "um", label: "micrometre (µm)", toBase: 1e-6 },
        { id: "nm", label: "nanometre (nm)", toBase: 1e-9 },
        { id: "mi", label: "mile (mi)", toBase: 1609.344 },
        { id: "yd", label: "yard (yd)", toBase: 0.9144 },
        { id: "ft", label: "foot (ft)", toBase: 0.3048 },
        { id: "in", label: "inch (in)", toBase: 0.0254 },
        { id: "nmi", label: "nautical mile (nmi)", toBase: 1852 }
      ]
    },
    {
      id: "mass",
      label: "Mass",
      units: [
        { id: "kg", label: "kilogram (kg)", toBase: 1 },
        { id: "g", label: "gram (g)", toBase: 0.001 },
        { id: "mg", label: "milligram (mg)", toBase: 1e-6 },
        { id: "t", label: "tonne (t)", toBase: 1000 },
        { id: "lb", label: "pound (lb)", toBase: 0.45359237 },
        { id: "oz", label: "ounce (oz)", toBase: 0.028349523125 },
        { id: "st", label: "stone (st)", toBase: 6.35029318 }
      ]
    },
    {
      id: "temperature",
      label: "Temperature",
      units: [
        { id: "C", label: "Celsius (°C)" },
        { id: "F", label: "Fahrenheit (°F)" },
        { id: "K", label: "Kelvin (K)" }
      ]
    },
    {
      id: "volume",
      label: "Volume",
      units: [
        { id: "L", label: "litre (L)", toBase: 1 },
        { id: "mL", label: "millilitre (mL)", toBase: 0.001 },
        { id: "m3", label: "cubic metre (m³)", toBase: 1000 },
        { id: "cm3", label: "cubic centimetre (cm³)", toBase: 0.001 },
        { id: "gal_us", label: "US gallon (gal)", toBase: 3.785411784 },
        { id: "gal_uk", label: "Imperial gallon (gal)", toBase: 4.54609 },
        { id: "qt_us", label: "US quart (qt)", toBase: 0.946352946 },
        { id: "pt_us", label: "US pint (pt)", toBase: 0.473176473 },
        { id: "cup_us", label: "US cup", toBase: 0.2365882365 },
        { id: "floz_us", label: "US fluid ounce (fl oz)", toBase: 0.0295735295625 },
        { id: "tbsp_us", label: "US tablespoon", toBase: 0.01478676478125 },
        { id: "tsp_us", label: "US teaspoon", toBase: 0.00492892159375 }
      ]
    },
    {
      id: "area",
      label: "Area",
      units: [
        { id: "m2", label: "square metre (m²)", toBase: 1 },
        { id: "km2", label: "square kilometre (km²)", toBase: 1e6 },
        { id: "ha", label: "hectare (ha)", toBase: 10000 },
        { id: "acre", label: "acre", toBase: 4046.8564224 },
        { id: "ft2", label: "square foot (ft²)", toBase: 0.09290304 },
        { id: "in2", label: "square inch (in²)", toBase: 0.00064516 },
        { id: "yd2", label: "square yard (yd²)", toBase: 0.83612736 },
        { id: "mi2", label: "square mile (mi²)", toBase: 2589988.110336 }
      ]
    },
    {
      id: "speed",
      label: "Speed",
      units: [
        { id: "mps", label: "metre per second (m/s)", toBase: 1 },
        { id: "kmh", label: "kilometre per hour (km/h)", toBase: 1000 / 3600 },
        { id: "mph", label: "mile per hour (mph)", toBase: 0.44704 },
        { id: "kn", label: "knot (kn)", toBase: 1852 / 3600 },
        { id: "fps", label: "foot per second (ft/s)", toBase: 0.3048 }
      ]
    },
    {
      id: "time",
      label: "Time",
      units: [
        { id: "s", label: "second (s)", toBase: 1 },
        { id: "ms", label: "millisecond (ms)", toBase: 0.001 },
        { id: "min", label: "minute (min)", toBase: 60 },
        { id: "h", label: "hour (h)", toBase: 3600 },
        { id: "d", label: "day (d)", toBase: 86400 },
        { id: "wk", label: "week (wk)", toBase: 604800 },
        { id: "mo", label: "month (30 d)", toBase: 2592000 },
        { id: "yr", label: "year (365 d)", toBase: 31536000 }
      ]
    },
    {
      id: "pressure",
      label: "Pressure",
      units: [
        { id: "Pa", label: "pascal (Pa)", toBase: 1 },
        { id: "kPa", label: "kilopascal (kPa)", toBase: 1000 },
        { id: "bar", label: "bar", toBase: 1e5 },
        { id: "mbar", label: "millibar (mbar)", toBase: 100 },
        { id: "psi", label: "pound per square inch (psi)", toBase: 6894.757293168 },
        { id: "atm", label: "atmosphere (atm)", toBase: 101325 },
        { id: "mmHg", label: "millimetre of mercury (mmHg)", toBase: 133.322387415 },
        { id: "inHg", label: "inch of mercury (inHg)", toBase: 3386.389 }
      ]
    },
    {
      id: "energy",
      label: "Energy",
      units: [
        { id: "J", label: "joule (J)", toBase: 1 },
        { id: "kJ", label: "kilojoule (kJ)", toBase: 1000 },
        { id: "cal", label: "calorie (cal)", toBase: 4.184 },
        { id: "kcal", label: "kilocalorie (kcal)", toBase: 4184 },
        { id: "Wh", label: "watt-hour (Wh)", toBase: 3600 },
        { id: "kWh", label: "kilowatt-hour (kWh)", toBase: 3.6e6 },
        { id: "BTU", label: "British thermal unit (BTU)", toBase: 1055.05585262 }
      ]
    },
    {
      id: "data",
      label: "Data",
      units: [
        { id: "B", label: "byte (B)", toBase: 1 },
        { id: "kB", label: "kilobyte (kB)", toBase: 1e3 },
        { id: "MB", label: "megabyte (MB)", toBase: 1e6 },
        { id: "GB", label: "gigabyte (GB)", toBase: 1e9 },
        { id: "TB", label: "terabyte (TB)", toBase: 1e12 },
        { id: "KiB", label: "kibibyte (KiB)", toBase: 1024 },
        { id: "MiB", label: "mebibyte (MiB)", toBase: Math.pow(1024, 2) },
        { id: "GiB", label: "gibibyte (GiB)", toBase: Math.pow(1024, 3) },
        { id: "TiB", label: "tebibyte (TiB)", toBase: Math.pow(1024, 4) },
        { id: "bit", label: "bit", toBase: 0.125 }
      ]
    },
    {
      id: "angle",
      label: "Angle",
      units: [
        { id: "deg", label: "degree (°)", toBase: 1 },
        { id: "rad", label: "radian (rad)", toBase: 180 / Math.PI },
        { id: "grad", label: "gradian (gon)", toBase: 0.9 },
        { id: "arcmin", label: "arcminute (′)", toBase: 1 / 60 },
        { id: "arcsec", label: "arcsecond (″)", toBase: 1 / 3600 },
        { id: "turn", label: "turn", toBase: 360 }
      ]
    }
  ];

  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function unitById(category, unitId) {
    if (!category || !category.units) return null;
    for (var i = 0; i < category.units.length; i++) {
      if (category.units[i].id === unitId) return category.units[i];
    }
    return null;
  }

  function tempToKelvin(value, fromId) {
    if (fromId === "K") return value;
    if (fromId === "C") return value + 273.15;
    if (fromId === "F") return (value - 32) * (5 / 9) + 273.15;
    return NaN;
  }

  function tempFromKelvin(kelvin, toId) {
    if (toId === "K") return kelvin;
    if (toId === "C") return kelvin - 273.15;
    if (toId === "F") return (kelvin - 273.15) * (9 / 5) + 32;
    return NaN;
  }

  /**
   * Convert `value` from `fromId` to `toId` within `categoryId`.
   * Returns a finite number, or NaN when the request is invalid.
   */
  function convert(categoryId, value, fromId, toId) {
    if (typeof value !== "number" || !isFinite(value)) return NaN;
    var category = categoryById(categoryId);
    if (!category) return NaN;

    if (categoryId === "temperature") {
      if (!unitById(category, fromId) || !unitById(category, toId)) return NaN;
      return tempFromKelvin(tempToKelvin(value, fromId), toId);
    }

    var from = unitById(category, fromId);
    var to = unitById(category, toId);
    if (!from || !to || !(from.toBase > 0) || !(to.toBase > 0)) return NaN;
    return (value * from.toBase) / to.toBase;
  }

  /**
   * Format a converted value for display.
   * Trims trailing zeros. Ordinary sizes stay decimal; huge and tiny values
   * use compact exponential form.
   */
  function format(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    if (value === 0) return "0";

    var abs = Math.abs(value);
    if (abs >= 1e9 || abs < 1e-6) {
      var parts = value.toExponential(6).split("e");
      var coeff = parts[0].replace(/\.?0+$/, "");
      var expPart = parts[1].charAt(0) === "+" ? parts[1].slice(1) : parts[1];
      return coeff + "e" + expPart;
    }
    var digits = abs >= 1000 ? 4 : abs >= 1 ? 6 : 8;
    var fixed = value.toFixed(digits);
    return fixed.replace(/\.?0+$/, "");
  }

  /**
   * Parse a user-typed number.
   * Handles US (1,234.56) and European (1.234,56) grouping; a lone comma with
   * 1–2 fractional digits is treated as a decimal (1,5 → 1.5).
   * A single dot is a decimal point, so 1.234 stays 1.234. Dots are thousands
   * separators only when the groups repeat (1.234.567).
   */
  function parseInput(raw) {
    if (typeof raw !== "string") {
      if (typeof raw === "number") return isFinite(raw) ? raw : NaN;
      return NaN;
    }
    var cleaned = raw.trim().replace(/\s/g, "");
    if (cleaned.charAt(0) === "+") cleaned = cleaned.slice(1);
    if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === ","
      || cleaned === "-." || cleaned === "-,") {
      return NaN;
    }
    if (/[.,]$/.test(cleaned)) {
      cleaned = cleaned.slice(0, -1);
      if (cleaned === "" || cleaned === "-") return NaN;
    }

    var lastComma = cleaned.lastIndexOf(",");
    var lastDot = cleaned.lastIndexOf(".");
    var normalized;

    if (lastComma !== -1 && lastDot !== -1) {
      if (lastComma > lastDot) {
        /* European: 1.234,56 */
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        /* US: 1,234.56 */
        normalized = cleaned.replace(/,/g, "");
      }
    } else if (lastComma !== -1) {
      /* Only commas. Groups of three → thousands; otherwise decimal. */
      if (/^-?\d{1,3}(,\d{3})+([eE][+-]?\d+)?$/.test(cleaned)) {
        normalized = cleaned.replace(/,/g, "");
      } else {
        normalized = cleaned.replace(",", ".");
      }
    } else if (lastDot !== -1) {
      /* One dot is a decimal (1.234). Two or more groups of three are thousands. */
      if (/^-?\d{1,3}(\.\d{3}){2,}([eE][+-]?\d+)?$/.test(cleaned)) {
        normalized = cleaned.replace(/\./g, "");
      } else {
        normalized = cleaned;
      }
    } else {
      normalized = cleaned;
    }

    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(normalized)) return NaN;
    var n = Number(normalized);
    return isFinite(n) ? n : NaN;
  }

  var MAX_VALUE_CHARS = 64;

  function clipValue(value) {
    if (typeof value === "string") {
      return value.length > MAX_VALUE_CHARS ? value.slice(0, MAX_VALUE_CHARS) : value;
    }
    if (typeof value === "number" && isFinite(value)) return String(value);
    return null;
  }

  /**
   * Validate persisted prefs against the catalog. Unknown ids fall back to
   * `defaults` (or the first units in the chosen category).
   */
  function normalizeState(data, defaults) {
    var d = defaults || {};
    var bag = data && typeof data === "object" ? data : {};
    var category = categoryById(bag.category) ? bag.category : (d.category || "length");
    var cat = categoryById(category);
    var fallbackFrom = unitById(cat, d.from) ? d.from : cat.units[0].id;
    var fallbackTo = unitById(cat, d.to)
      ? d.to
      : (cat.units[1] ? cat.units[1].id : cat.units[0].id);
    var clipped = clipValue(bag.value);
    var fallbackValue = clipValue(d.value);
    return {
      category: category,
      from: unitById(cat, bag.from) ? bag.from : fallbackFrom,
      to: unitById(cat, bag.to) ? bag.to : fallbackTo,
      value: clipped === null ? (fallbackValue === null ? "1" : fallbackValue) : clipped
    };
  }

  global.Convert = {
    CATEGORIES: CATEGORIES,
    categoryById: categoryById,
    unitById: unitById,
    convert: convert,
    format: format,
    parseInput: parseInput,
    normalizeState: normalizeState,
    MAX_VALUE_CHARS: MAX_VALUE_CHARS
  };
})(typeof window !== "undefined" ? window : globalThis);
