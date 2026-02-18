"use strict";

(() => {
  const commentSelectors = [
    "#comment #content-text",
  ];

  const comments = [];
  commentSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      const text = (element.innerText || "").trim();
      if (text) comments.push(text);
    });
  });

  const titleElement = document.querySelector(
    ".watch-active-metadata #title"
  );
  const title =
    (titleElement?.innerText || "").trim() || (document.title || "").trim();

  return [title, comments];
})();
