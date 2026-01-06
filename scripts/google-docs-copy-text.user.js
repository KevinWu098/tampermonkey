// ==UserScript==
// @name         Google Docs Copy Text (Mobile Basic)
// @namespace    https://github.com/kevinwu098/tampermonkey
// @version      1.0.1
// @description  Auto-copy document text when navigating to mobile basic view with autocopy flag
// @match        https://docs.google.com/document/d/*/mobilebasic*
// @match        https://docs.google.com/document/u/*/d/*/mobilebasic*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/google-docs-copy-text.user.js
// @updateURL    https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/google-docs-copy-text.user.js
// ==/UserScript==

(function () {
  "use strict";

  const CONTENT_SELECTOR = "body > div.app-container > div > div";
  const AUTOCOPY_PARAM = "autocopy";
  const MAX_FOCUS_WAIT_MS = 5000;
  const FOCUS_CHECK_INTERVAL_MS = 100;

  function shouldAutoCopy() {
    const params = new URLSearchParams(window.location.search);
    return params.get(AUTOCOPY_PARAM) === "1";
  }

  function cleanAutoCopyParam() {
    const url = new URL(window.location.href);
    url.searchParams.delete(AUTOCOPY_PARAM);
    window.history.replaceState({}, "", url.toString());
  }

  function copyDocumentText() {
    const contentElement = document.querySelector(CONTENT_SELECTOR);

    if (!contentElement) {
      console.warn("[Google Docs Copy] Content element not found");
      showNotification("Content not found", "error");
      return;
    }

    const text = contentElement.innerText;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("[Google Docs Copy] Text copied to clipboard");
        showNotification("Document text copied!", "success");
      })
      .catch((err) => {
        console.error("[Google Docs Copy] Failed to copy:", err);
        showNotification("Failed to copy text", "error");
      });
  }

  function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      transition: opacity 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      ${type === "success" ? "background: #10b981; color: white;" : "background: #ef4444; color: white;"}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  function waitForFocusAndCopy() {
    const startTime = Date.now();

    function checkFocusAndContent() {
      const elapsed = Date.now() - startTime;

      // Timeout - give up waiting for focus
      if (elapsed > MAX_FOCUS_WAIT_MS) {
        console.warn("[Google Docs Copy] Timed out waiting for focus");
        showNotification("Could not copy - page not focused", "error");
        cleanAutoCopyParam();
        return;
      }

      // Check if content is available
      const content = document.querySelector(CONTENT_SELECTOR);
      if (!content) {
        setTimeout(checkFocusAndContent, FOCUS_CHECK_INTERVAL_MS);
        return;
      }

      // Check if document has focus
      if (!document.hasFocus()) {
        setTimeout(checkFocusAndContent, FOCUS_CHECK_INTERVAL_MS);
        return;
      }

      // Content exists and document is focused - copy!
      cleanAutoCopyParam();
      copyDocumentText();
    }

    checkFocusAndContent();
  }

  // Only run if autocopy param is present
  if (shouldAutoCopy()) {
    console.log("[Google Docs Copy] Autocopy triggered, waiting for focus...");

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", waitForFocusAndCopy);
    } else {
      waitForFocusAndCopy();
    }
  }
})();
