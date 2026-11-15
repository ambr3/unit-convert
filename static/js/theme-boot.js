/*
 * Seclusa Convert theme boot — light or dark only, before first paint.
 *
 * Dark uses the orange ruled lines sky. Light uses a plain white sheet.
 * Never throw: this is the first script on the page.
 */

(function () {
  var KEY_THEME = "ssc.pref_key_night_mode";

  function readPref() {
    try {
      var v = localStorage.getItem(KEY_THEME);
      return v === "light" || v === "dark" ? v : null;
    } catch (err) {
      return null;
    }
  }

  try {
    var html = document.documentElement;
    var saved = readPref();
    var theme = saved || "dark";
    html.setAttribute("data-theme", theme);
    if (theme === "dark") {
      html.setAttribute("data-bg", "grid");
      html.removeAttribute("data-bg-tone");
    } else {
      html.setAttribute("data-bg", "white");
      html.setAttribute("data-bg-tone", "light");
    }
    try { html.removeAttribute("style"); } catch (err) { /* ignore */ }
  } catch (err) {
    /* Storage blocked. Markup defaults stand. */
  }
})();
