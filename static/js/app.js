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
    var data = window.Store.getData() || {};
    var category = window.Convert.categoryById(data.category) ? data.category : DEFAULTS.category;
    var cat = window.Convert.categoryById(category);
    var fallbackFrom = window.Convert.unitById(cat, DEFAULTS.from) ? DEFAULTS.from : cat.units[0].id;
    var fallbackTo = window.Convert.unitById(cat, DEFAULTS.to)
      ? DEFAULTS.to
      : (cat.units[1] ? cat.units[1].id : cat.units[0].id);
    var from = window.Convert.unitById(cat, data.from) ? data.from : fallbackFrom;
    var to = window.Convert.unitById(cat, data.to) ? data.to : fallbackTo;
    var value = typeof data.value === "string" ? data.value : DEFAULTS.value;
    return { category: category, from: from, to: to, value: value };
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
    select.innerHTML = "";
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
    row.innerHTML = "";
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
    closeSheet();
    openSheetId = id;
    var scrim = $("scrim");
    var sheet = $(id);
    if (scrim) scrim.classList.add("open");
    if (sheet) {
      sheet.classList.add("open");
      sheet.setAttribute("aria-hidden", "false");
    }
    if (id === "sheet-theme") syncThemeChrome();
  }

  function closeSheet() {
    if (openSheetId) {
      var sheet = $(openSheetId);
      if (sheet) {
        sheet.classList.remove("open");
        sheet.setAttribute("aria-hidden", "true");
      }
    }
    openSheetId = null;
    var scrim = $("scrim");
    if (scrim) scrim.classList.remove("open");
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
      if (event.key === "Escape") closeSheet();
    });
  }

  /* ---------------------------------------------------------------- boot */

  function boot() {
    wireTheme();

    var state = loadState();
    paint(state);

    $("category-row").addEventListener("click", function (event) {
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

    $("from-value").addEventListener("input", function () {
      state.value = $("from-value").value;
      saveState(state);
      updateResult(state);
    });

    $("from-unit").addEventListener("change", function () {
      state.from = $("from-unit").value;
      saveState(state);
      updateResult(state);
    });

    $("to-unit").addEventListener("change", function () {
      state.to = $("to-unit").value;
      saveState(state);
      updateResult(state);
    });

    $("btn-swap").addEventListener("click", function () {
      var parsed = window.Convert.parseInput(state.value);
      var result = window.Convert.convert(state.category, parsed, state.from, state.to);
      var tmp = state.from;
      state.from = state.to;
      state.to = tmp;
      if (isFinite(result)) state.value = window.Convert.format(result);
      saveState(state);
      paint(state);
    });

    $("btn-copy").addEventListener("click", function () {
      var text = $("result-value").textContent;
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

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(function () { /* ignore */ });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
