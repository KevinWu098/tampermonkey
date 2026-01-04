// ==UserScript==
// @name         GitHub Open Links in New Tab
// @namespace    https://github.com/kevinwu098/tampermonkey
// @version      1.0.1
// @description  Opens cross-section links in new tabs on GitHub PR, Issue, and Actions pages
// @match        https://github.com/*/*/pull/*
// @match        https://github.com/*/*/pulls
// @match        https://github.com/*/*/issues
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/actions
// @match        https://github.com/*/*/actions/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/github-open-links-new-tab.user.js
// @updateURL    https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/github-open-links-new-tab.user.js
// ==/UserScript==

(function () {
  "use strict";

  // Sections we care about - "pull" and "pulls" are treated as the same section
  const SECTIONS = ["pull", "pulls", "issues", "actions"];

  // Extract the section from a GitHub URL path (e.g., /owner/repo/issues/123 -> "issues")
  function getSection(url) {
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      const parts = pathname.split("/").filter(Boolean);
      // GitHub URLs: /owner/repo/section/...
      if (parts.length >= 3) {
        const section = parts[2];
        if (SECTIONS.includes(section)) {
          // Normalize "pull" and "pulls" to the same section
          return section === "pull" ? "pulls" : section;
        }
      }
    } catch {
      // Invalid URL, ignore
    }
    return null;
  }

  function getCurrentSection() {
    return getSection(window.location.href);
  }

  function isSkippableLink(anchor) {
    if (!anchor.href) return true;

    const href = anchor.getAttribute("href");

    // Skip empty, hash-only, or javascript links
    if (!href || href === "#" || href.startsWith("javascript:")) return true;

    // Skip if it's just a hash on the current page
    if (href.startsWith("#")) return true;

    // Skip if already configured to open in new tab/window
    if (anchor.target === "_blank") return true;

    return false;
  }

  // Only force new tab if navigating to a different section
  function shouldForceNewTab(anchor) {
    if (isSkippableLink(anchor)) return false;

    const currentSection = getCurrentSection();
    const targetSection = getSection(anchor.href);

    // If target isn't one of our tracked sections, let it navigate normally
    if (!targetSection) return false;

    // If we can't determine current section, be safe and open new tab
    if (!currentSection) return true;

    // Force new tab only if crossing sections
    return currentSection !== targetSection;
  }

  function updateAnchor(anchor) {
    if (shouldForceNewTab(anchor)) {
      anchor.target = "_blank";
      // Security: prevent the new page from accessing window.opener
      anchor.rel = anchor.rel ? anchor.rel + " noopener" : "noopener";
    }
  }

  function processAllLinks(root = document) {
    const anchors = root.querySelectorAll("a[href]");
    anchors.forEach(updateAnchor);
  }

  // Process existing links on page load
  processAllLinks();

  // Observe DOM changes for dynamically added links (GitHub is a SPA)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle added nodes
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // If the node itself is an anchor
        if (node.tagName === "A") {
          updateAnchor(node);
        }

        // Process any anchors within the added subtree
        if (node.querySelectorAll) {
          const anchors = node.querySelectorAll("a[href]");
          anchors.forEach(updateAnchor);
        }
      }

      // Handle attribute changes on anchor elements
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "href" &&
        mutation.target.tagName === "A"
      ) {
        updateAnchor(mutation.target);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });

  // Intercept clicks for cross-section navigation
  document.addEventListener(
    "click",
    (e) => {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      if (!shouldForceNewTab(anchor)) return;

      // Force open in new tab if crossing sections
      if (anchor.target !== "_blank") {
        e.preventDefault();
        e.stopPropagation();
        window.open(anchor.href, "_blank", "noopener");
      }
    },
    true // capture phase to intercept before other handlers
  );
})();
