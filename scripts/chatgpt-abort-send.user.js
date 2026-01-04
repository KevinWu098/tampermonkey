// ==UserScript==
// @name         ChatGPT Cmd+Enter Abort + Send (Keyboard)
// @namespace    https://github.com/kevinwu098/tampermonkey
// @version      1.0.0
// @description  Cmd+Enter stops streaming and sends prompt using real keyboard event
// @match        https://chatgpt.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/chatgpt-abort-send.user.js
// @updateURL    https://raw.githubusercontent.com/kevinwu098/tampermonkey/main/scripts/chatgpt-abort-send.user.js
// ==/UserScript==

(function () {
    "use strict";

    const INPUT_SELECTOR = "#prompt-textarea";
    const BUTTON_SELECTOR = "#composer-submit-button";

    function getInput() {
        return document.querySelector(INPUT_SELECTOR);
    }

    function getButton() {
        return document.querySelector(BUTTON_SELECTOR);
    }

    function hasText(input) {
        return input.innerText.replace(/\s+/g, "").length > 0;
    }

    function isStreaming(button) {
        return button?.getAttribute("aria-label") === "Stop streaming";
    }

    function sendViaKeyboard(input) {
        input.focus();

        const event = new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true,
        });

        input.dispatchEvent(event);
    }

    function waitUntilNotStreamingThenSend(input) {
        const button = getButton();
        if (!button) return;

        // Already idle → send immediately
        if (!isStreaming(button)) {
            sendViaKeyboard(input);
            return;
        }

        const observer = new MutationObserver(() => {
            if (!isStreaming(button)) {
                observer.disconnect();
                // small microtask delay to allow state flush
                queueMicrotask(() => sendViaKeyboard(input));
            }
        });

        observer.observe(button, {
            attributes: true,
            attributeFilter: ["aria-label"],
        });
    }

    document.addEventListener(
        "keydown",
        (e) => {
            if (e.metaKey && e.key === "Enter") {
                const input = getInput();
                const button = getButton();
                if (!input || !button) return;

                e.preventDefault();
                e.stopPropagation();

                if (!hasText(input)) return;

                // Abort streaming if needed
                if (isStreaming(button)) {
                    button.click();
                }

                // Send using keyboard semantics
                waitUntilNotStreamingThenSend(input);
            }
        },
        true // capture phase is critical
    );
})();
