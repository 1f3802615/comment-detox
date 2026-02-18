"use strict";

const findElementsByInnerText = (searchText, tagName = "*") => {
  const allElements = document.querySelectorAll(tagName);
  return Array.from(allElements).filter((element) => {
    const elementText = element.innerText || "";
    return elementText.includes(searchText);
  });
};

const editComments = (response) => {
  if (!response || response.response === "x") return;

  const foundElements = findElementsByInnerText(response.original, "div");
  const targetElement = foundElements.at(-1);
  if (!targetElement) return;

  const newDiv = document.createElement("div");
  newDiv.className = "style-scope ytd-comment-renderer comment-detox-content";
  newDiv.style.background = "#eaf5e0";
  newDiv.style.fontSize = "1.4rem";

  const toggleButton = document.createElement("div");
  toggleButton.setAttribute("role", "button");
  toggleButton.setAttribute("aria-label", "Toggle original comment");
  toggleButton.tabIndex = 0;
  toggleButton.style.position = "absolute";
  toggleButton.style.width = "15px";
  toggleButton.style.height = "15px";
  toggleButton.style.top = "3px";
  toggleButton.style.right = "40px";
  toggleButton.style.backgroundImage = `url(${chrome.runtime.getURL(
    "images/indicator-nontoxic.svg"
  )})`;
  toggleButton.style.backgroundSize = "contain";
  toggleButton.style.backgroundRepeat = "no-repeat";
  toggleButton.style.cursor = "pointer";

  let showTranslated = true;

  const setContent = (text, isTranslated) => {
    newDiv.innerHTML = text;
    toggleButton.style.backgroundImage = `url(${chrome.runtime.getURL(
      isTranslated
        ? "images/indicator-nontoxic.svg"
        : "images/indicator-toxic.svg"
    )})`;
    newDiv.style.background = isTranslated ? "#eaf5e0" : "#f5e0e0";
    newDiv.appendChild(toggleButton);
  };

  const toggle = () => {
    showTranslated = !showTranslated;
    setContent(showTranslated ? response.response : response.original, showTranslated);
  };

  newDiv.addEventListener("click", toggle);
  toggleButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  });

  setContent(response.response, true);
  targetElement.replaceChildren(newDiv);
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "editComment") {
    editComments(request.comment);
  }
});
