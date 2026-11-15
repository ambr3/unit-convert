/*
 * Seclusa Convert — light / dark only.
 *
 * Dark: instrument layout + orange ruled lines.
 * Light: dual-pane layout + plain white sheet.
 * No System mode, no background swatches.
 */

(function () {
  "use strict";

  var LIGHT = "#ffffff";
  var DARK = "#0a0a0a";

  function resolve(mode) {
    return mode === "light" ? "light" : "dark";
  }

  function syncSky(theme) {
    var root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-bg", "grid");
      root.removeAttribute("data-bg-tone");
    } else {
      root.setAttribute("data-bg", "white");
      root.setAttribute("data-bg-tone", "light");
    }
  }

  function apply(mode) {
    var theme = resolve(mode);
    var root = document.documentElement;
    if (root.getAttribute("data-theme") !== theme) {
      root.setAttribute("data-theme", theme);
    }
    syncSky(theme);
    var colour = theme === "dark" ? DARK : LIGHT;
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute("content", colour);
    }
    return theme;
  }

  function current() {
    if (window.Store && window.Store.getTheme) {
      var stored = window.Store.getTheme();
      return stored === "light" ? "light" : "dark";
    }
    return "dark";
  }

  function set(mode) {
    var value = resolve(mode);
    if (window.Store && window.Store.setTheme) window.Store.setTheme(value);
    return apply(value);
  }

  function paintModeChrome() {
    var mode = current();
    document.querySelectorAll("[data-theme-opt]").forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.getAttribute("data-theme-opt") === mode));
    });
  }

  function paintBackground() {
    syncSky(resolve(current()));
  }

  window.Theme = {
    apply: apply,
    resolve: resolve,
    current: current,
    set: set,
    paintBackground: paintBackground,
    paintModeChrome: paintModeChrome,
    paintBgChrome: function () { /* no background swatches */ },
    setBackground: function () { return syncSky(resolve(current())), resolve(current()) === "dark" ? "grid" : "white"; },
    setCustomBackground: function () { return "#ffffff"; }
  };
})();
