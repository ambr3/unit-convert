/*
 * Seclusa Convert — the app.
 *
 * Conversion math lives in convert.js. Preferences (last category, units,
 * value, theme) go through Store. Nothing here makes a network request.
 */

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var DEFAULTS = {
    category: "length",
    from: "m",
    to: "ft",
    value: "1"
  };

  function toast(message) {
    var node = $("toast");
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(function () { node.hidden = true; }, 2400);
  }

  function loadState() {
    var raw = window.Store.getData();
    var state = window.Convert.normalizeState(raw, DEFAULTS);
    var hasData = !!(raw && (
      raw.category || raw.from || raw.to
      || typeof raw.value === "string" || typeof raw.value === "number"
    ));
    var dirty = hasData && (
      raw.value !== state.value
      || raw.category !== state.category
      || raw.from !== state.from
      || raw.to !== state.to
    );
    if (dirty) saveState(state);
    return state;
  }

  function saveState(state) {
    window.Store.setData({
      category: state.category,
      from: state.from,
      to: state.to,
      value: state.value
    });
  }

  function fillUnitSelect(select, category, selectedId) {
    if (!select || !category) return;
    select.replaceChildren();
    category.units.forEach(function (unit) {
      var opt = document.createElement("option");
      opt.value = unit.id;
      opt.textContent = unit.label;
      if (unit.id === selectedId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function renderCategories(activeId) {
    var row = $("category-row");
    if (!row) return;
    row.replaceChildren();
    window.Convert.CATEGORIES.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-chip";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(cat.id === activeId));
      btn.dataset.category = cat.id;
      btn.textContent = cat.label;
      row.appendChild(btn);
    });
  }

  function updateResult(state) {
    var out = $("result-value");
    var hint = $("result-hint");
    var parsed = window.Convert.parseInput(state.value);
    if (!isFinite(parsed)) {
      if (out) out.textContent = "—";
      if (hint) hint.textContent = state.value.trim() === "" ? "Enter a number" : "Not a valid number";
      return;
    }
    var result = window.Convert.convert(state.category, parsed, state.from, state.to);
    if (out) out.textContent = window.Convert.format(result);
    if (hint) {
      var cat = window.Convert.categoryById(state.category);
      var from = window.Convert.unitById(cat, state.from);
      var to = window.Convert.unitById(cat, state.to);
      hint.textContent = (from && to)
        ? (window.Convert.format(parsed) + " " + from.label + " → " + to.label)
        : "";
    }
  }

  function paint(state) {
    var cat = window.Convert.categoryById(state.category);
    renderCategories(state.category);
    fillUnitSelect($("from-unit"), cat, state.from);
    fillUnitSelect($("to-unit"), cat, state.to);
    var input = $("from-value");
    if (input && input.value !== state.value) input.value = state.value;
    updateResult(state);
  }

  /* ---------------------------------------------------------------- theme */

  var openSheetId = null;

  function syncThemeChrome() {
    if (window.Theme.paintModeChrome) window.Theme.paintModeChrome();
    if (window.Theme.paintBgChrome) window.Theme.paintBgChrome();
  }

  function showSheet(id) {
    closeSheet({ returnFocus: false });
    openSheetId = id;
    var scrim = $("scrim");
    var sheet = $(id);
    if (scrim) scrim.classList.add("open");
    if (sheet) {
      sheet.inert = false;
      sheet.classList.add("open");
      sheet.setAttribute("aria-hidden", "false");
      sheet.setAttribute("aria-modal", "true");
    }
    if (id === "sheet-theme") {
      syncThemeChrome();
      var focus = sheet && sheet.querySelector("[data-theme-opt]");
      if (focus) focus.focus();
    }
  }

  function closeSheet(opts) {
    var was = openSheetId;
    if (openSheetId) {
      var sheet = $(openSheetId);
      if (sheet) {
        sheet.classList.remove("open");
        sheet.inert = true;
        sheet.setAttribute("aria-hidden", "true");
        sheet.setAttribute("aria-modal", "false");
      }
    }
    openSheetId = null;
    var scrim = $("scrim");
    if (scrim) scrim.classList.remove("open");
    if (was === "sheet-theme" && (!opts || opts.returnFocus !== false)) {
      var button = $("btn-theme");
      if (button) button.focus();
    }
  }

  function wireTheme() {
    window.Theme.apply(window.Theme.current());
    if (window.Theme.paintBackground) window.Theme.paintBackground();
    syncThemeChrome();

    var button = $("btn-theme");
    if (button) {
      button.addEventListener("click", function () {
        showSheet("sheet-theme");
      });
    }

    var scrim = $("scrim");
    if (scrim) scrim.addEventListener("click", closeSheet);

    document.querySelectorAll("[data-theme-opt]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var mode = chip.getAttribute("data-theme-opt");
        if (mode !== "system" && mode !== "light" && mode !== "dark") return;
        window.Theme.set(mode);
        syncThemeChrome();
      });
    });

    document.querySelectorAll("[data-bg-opt]").forEach(function (swatch) {
      swatch.addEventListener("click", function (event) {
        var opt = swatch.getAttribute("data-bg-opt");
        if (!opt) return;
        if (opt === "custom") {
          var picker = $("bgCustomPicker");
          if (picker && event.target !== picker) {
            try { picker.click(); } catch (err) { /* ignore */ }
          }
          window.Theme.setBackground("custom");
        } else {
          window.Theme.setBackground(opt);
        }
        syncThemeChrome();
      });
    });

    var picker = $("bgCustomPicker");
    if (picker) {
      var onCustom = function () {
        window.Theme.setCustomBackground(picker.value);
        syncThemeChrome();
      };
      picker.addEventListener("input", onCustom);
      picker.addEventListener("change", onCustom);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSheet();
        return;
      }
      if (event.key !== "Tab" || !openSheetId) return;
      var sheet = $(openSheetId);
      if (!sheet) return;
      var nodes = sheet.querySelectorAll("button, input, select, textarea, a[href]");
      var list = [];
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].disabled) continue;
        list.push(nodes[i]);
      }
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      var active = document.activeElement;
      if (event.shiftKey && (active === first || !sheet.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !sheet.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------------------------------------------------------------- boot */

  function on(id, event, handler) {
    var node = $(id);
    if (!node) return null;
    node.addEventListener(event, handler);
    return node;
  }

  function boot() {
    wireTheme();

    var state = loadState();
    paint(state);

    on("category-row", "click", function (event) {
      var btn = event.target.closest("[data-category]");
      if (!btn) return;
      var next = btn.getAttribute("data-category");
      var cat = window.Convert.categoryById(next);
      if (!cat) return;
      state.category = next;
      state.from = cat.units[0].id;
      state.to = cat.units[1] ? cat.units[1].id : cat.units[0].id;
      saveState(state);
      paint(state);
    });

    on("from-value", "input", function () {
      var input = $("from-value");
      if (!input) return;
      var cap = window.Convert.MAX_VALUE_CHARS || 64;
      if (input.value.length > cap) input.value = input.value.slice(0, cap);
      state.value = input.value;
      saveState(state);
      updateResult(state);
    });

    on("from-unit", "change", function () {
      var select = $("from-unit");
      if (!select) return;
      state.from = select.value;
      saveState(state);
      updateResult(state);
    });

    on("to-unit", "change", function () {
      var select = $("to-unit");
      if (!select) return;
      state.to = select.value;
      saveState(state);
      updateResult(state);
    });

    on("btn-swap", "click", function () {
      var parsed = window.Convert.parseInput(state.value);
      var result = window.Convert.convert(state.category, parsed, state.from, state.to);
      var tmp = state.from;
      state.from = state.to;
      state.to = tmp;
      if (isFinite(result)) state.value = window.Convert.format(result);
      saveState(state);
      paint(state);
    });

    on("btn-clear", "click", function () {
      window.Store.clearAll();
      state = {
        category: DEFAULTS.category,
        from: DEFAULTS.from,
        to: DEFAULTS.to,
        value: DEFAULTS.value
      };
      window.Theme.set("system");
      window.Theme.setBackground("grid");
      syncThemeChrome();
      paint(state);
      closeSheet();
      toast("Cleared data on this device");
    });

    on("btn-copy", "click", function () {
      var out = $("result-value");
      var text = out ? out.textContent : "";
      if (!text || text === "—") {
        toast("Nothing to copy");
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          toast("Copied");
        }).catch(function () {
          toast("Copy failed");
        });
      } else {
        toast("Copy not available");
      }
    });

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(function () {
        try {
          console.warn("Seclusa Convert: service worker registration failed");
        } catch (e) { /* ignore */ }
        toast("Offline install failed");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
