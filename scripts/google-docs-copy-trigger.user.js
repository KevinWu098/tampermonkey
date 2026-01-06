// ==UserScript==
// @name         Google Docs Copy Text (Trigger)
// @namespace    https://github.com/kevinwu098/tampermonkey
// @version      1.0.1
// @description  Right-click context menu to copy Google Docs text via mobile basic view
// @match        https://docs.google.com/document/d/*/edit*
// @match        https://docs.google.com/document/u/*/d/*/edit*
// @grant        none
// @run-at       context-menu
// @downloadURL  https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/google-docs-copy-trigger.user.js
// @updateURL    https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/google-docs-copy-trigger.user.js
// ==/UserScript==

(function () {
  "use strict";

  const MOBILEBASIC_PATH = "/mobilebasic";
  const AUTOCOPY_PARAM = "autocopy";

  // Get base path and replace /edit with /mobilebasic
  const pathname = window.location.pathname;
  const newPathname = pathname.replace(/\/[^/]+$/, MOBILEBASIC_PATH);

  // Build new URL with autocopy param
  const url = new URL(window.location.origin + newPathname);
  url.searchParams.set(AUTOCOPY_PARAM, "1");

  window.location.href = url.toString();
})();
