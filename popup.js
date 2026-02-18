"use strict";

const byId = (id) => document.getElementById(id);

const translateButton = byId("translate-button");
const apiKeyInput = byId("api-key-input");
const saveApiKeyButton = byId("save-api-key");
const clearApiKeyButton = byId("clear-api-key");
const toggleApiKeyButton = byId("toggle-api-key");
const apiKeyStatus = byId("api-key-status");
const modelSelect = byId("model-select");
const saveModelButton = byId("save-model");
const modelStatus = byId("model-status");
const toxicDefinitionInput = byId("toxic-definition-input");
const translateIntoInput = byId("translate-into-input");
const savePromptButton = byId("save-prompt");
const resetPromptButton = byId("reset-prompt");
const promptStatus = byId("prompt-status");

const injectedTabs = new Set();

const setStatus = (el, message, isError = false) => {
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#b91c1c" : "#2563eb";
};

const normalizeTrim = (value) => (value || "").trim();

const extractMovingParts = (fullPrompt) => {
  if (!fullPrompt) {
    return {
      toxicDefinition: _appmeta.defaultToxicDefinition,
      translateInto: _appmeta.defaultTranslateInto,
    };
  }
  const toxicMatch = fullPrompt.match(
    /toxic shall mean\s+(.+?)\.\s+If you deem the following comment to be toxic/i
  );
  const translateMatch = fullPrompt.match(
    /translated into\s+(.+?)\.\s+If you do not deem the comment to be toxic/i
  );
  return {
    toxicDefinition:
      toxicMatch?.[1]?.trim() || _appmeta.defaultToxicDefinition,
    translateInto:
      translateMatch?.[1]?.trim() || _appmeta.defaultTranslateInto,
  };
};

const getSettings = async () =>
  new Promise((resolve) => {
    chrome.storage.local.get(
      [
        "userApiKey",
        "userModel",
        "userToxicDefinition",
        "userTranslateInto",
        "userInstruction",
        "userPrompt",
      ],
      (result) => {
        let toxicDefinition = normalizeTrim(result.userToxicDefinition);
        let translateInto = normalizeTrim(result.userTranslateInto);
        const legacyPrompt = normalizeTrim(result.userPrompt);

        if ((!toxicDefinition || !translateInto) && legacyPrompt) {
          const extracted = extractMovingParts(legacyPrompt);
          toxicDefinition = toxicDefinition || extracted.toxicDefinition;
          translateInto = translateInto || extracted.translateInto;
          chrome.storage.local.set({
            userToxicDefinition: toxicDefinition,
            userTranslateInto: translateInto,
          });
        }

        resolve({
          apiKey: normalizeTrim(result.userApiKey),
          model: normalizeTrim(result.userModel || _appmeta.defaultModel),
          toxicDefinition: normalizeTrim(
            toxicDefinition || _appmeta.defaultToxicDefinition
          ),
          translateInto: normalizeTrim(
            translateInto || _appmeta.defaultTranslateInto
          ),
        });
      }
    );
  });

const loadStoredApiKey = () => {
  chrome.storage.local.get(["userApiKey"], (result) => {
    const storedKey = normalizeTrim(result.userApiKey);
    if (apiKeyInput) apiKeyInput.value = storedKey;
    setStatus(apiKeyStatus, storedKey ? "Custom key loaded." : "No key saved.");
  });
};

const populateModels = () => {
  if (!modelSelect) return;
  modelSelect.innerHTML = "";
  _appmeta.models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });
};

const loadStoredModel = () => {
  chrome.storage.local.get(["userModel"], (result) => {
    const storedModel = normalizeTrim(result.userModel || _appmeta.defaultModel);
    if (modelSelect) modelSelect.value = storedModel;
    setStatus(modelStatus, storedModel ? "Model loaded." : "No model saved.");
  });
};

const loadStoredPrompt = () => {
  chrome.storage.local.get(
    ["userToxicDefinition", "userTranslateInto", "userPrompt"],
    (result) => {
      let storedToxicDefinition = normalizeTrim(result.userToxicDefinition);
      let storedTranslateInto = normalizeTrim(result.userTranslateInto);
      const legacyPrompt = normalizeTrim(result.userPrompt);

      if ((!storedToxicDefinition || !storedTranslateInto) && legacyPrompt) {
        const extracted = extractMovingParts(legacyPrompt);
        storedToxicDefinition =
          storedToxicDefinition || extracted.toxicDefinition;
        storedTranslateInto = storedTranslateInto || extracted.translateInto;
        chrome.storage.local.set({
          userToxicDefinition: storedToxicDefinition,
          userTranslateInto: storedTranslateInto,
        });
      }

      if (!storedToxicDefinition) {
        storedToxicDefinition = _appmeta.defaultToxicDefinition;
      }
      if (!storedTranslateInto) {
        storedTranslateInto = _appmeta.defaultTranslateInto;
      }

      if (toxicDefinitionInput) {
        toxicDefinitionInput.value = storedToxicDefinition;
      }
      if (translateIntoInput) {
        translateIntoInput.value = storedTranslateInto;
      }

      setStatus(
        promptStatus,
        storedToxicDefinition && storedTranslateInto
          ? "Prompt settings loaded."
          : "No prompt settings saved."
      );
    }
  );
};

if (saveApiKeyButton) {
  saveApiKeyButton.addEventListener("click", () => {
    const value = normalizeTrim(apiKeyInput?.value);
    if (!value) {
      setStatus(apiKeyStatus, "Enter a key before saving.", true);
      return;
    }
    chrome.storage.local.set({ userApiKey: value }, () => {
      setStatus(apiKeyStatus, "Custom key saved.");
    });
  });
}

if (clearApiKeyButton) {
  clearApiKeyButton.addEventListener("click", () => {
    chrome.storage.local.remove("userApiKey", () => {
      if (apiKeyInput) apiKeyInput.value = "";
      setStatus(apiKeyStatus, "Custom key cleared.");
    });
  });
}

if (toggleApiKeyButton) {
  toggleApiKeyButton.addEventListener("click", () => {
    if (!apiKeyInput) return;
    const isMasked = apiKeyInput.type === "password";
    apiKeyInput.type = isMasked ? "text" : "password";
    toggleApiKeyButton.textContent = isMasked ? "Hide" : "Show";
    toggleApiKeyButton.setAttribute(
      "aria-label",
      isMasked ? "Hide API key" : "Show API key"
    );
  });
}

if (saveModelButton) {
  saveModelButton.addEventListener("click", () => {
    const value = normalizeTrim(modelSelect?.value);
    if (!value) {
      setStatus(modelStatus, "Select a model.", true);
      return;
    }
    chrome.storage.local.set({ userModel: value }, () => {
      setStatus(modelStatus, "Model saved.");
    });
  });
}

if (savePromptButton) {
  savePromptButton.addEventListener("click", () => {
    const toxicDefinition = normalizeTrim(toxicDefinitionInput?.value);
    const translateInto = normalizeTrim(translateIntoInput?.value);
    if (!toxicDefinition || !translateInto) {
      setStatus(promptStatus, "Fill out both fields.", true);
      return;
    }
    chrome.storage.local.set(
      { userToxicDefinition: toxicDefinition, userTranslateInto: translateInto },
      () => {
        setStatus(promptStatus, "Prompt settings saved.");
      }
    );
  });
}

if (resetPromptButton) {
  resetPromptButton.addEventListener("click", () => {
    const defaultToxicDefinition = normalizeTrim(_appmeta.defaultToxicDefinition);
    const defaultTranslateInto = normalizeTrim(_appmeta.defaultTranslateInto);
    if (toxicDefinitionInput) toxicDefinitionInput.value = defaultToxicDefinition;
    if (translateIntoInput) translateIntoInput.value = defaultTranslateInto;
    chrome.storage.local.set(
      {
        userToxicDefinition: defaultToxicDefinition,
        userTranslateInto: defaultTranslateInto,
      },
      () => {
        setStatus(promptStatus, "Prompt settings reset.");
      }
    );
  });
}

loadStoredApiKey();
populateModels();
loadStoredModel();
loadStoredPrompt();

const buildPrompt = (settings, videoTitle, comment) =>
  `For the purposes of this request, toxic shall mean ${settings.toxicDefinition}. ` +
  `If you deem the following comment to be toxic, return a new version of it translated into language that is ${settings.translateInto}. ` +
  `If you do not deem the comment to be toxic, return only the character 'x'. ` +
  `In either case do not return any explanation. Only return the translated comment, or the character 'x'. ` +
  `The video title: "{title}", The comment: {comment}`
    .replaceAll("{title}", String(videoTitle))
    .replaceAll("{comment}", String(comment));

const translateComments = async (tabId) => {
  if (!tabId) return;

  const settings = await getSettings();
  if (!settings.apiKey) {
    setStatus(apiKeyStatus, "Please save an API key first.", true);
    return;
  }

  let textContent;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ["processText.js"],
    });
    textContent = results?.[0]?.result;
  } catch (error) {
    console.error("Failed to run processText.js", error);
    return;
  }

  if (!textContent || !Array.isArray(textContent) || textContent.length < 2) {
    console.warn("No text content returned from processText.js");
    return;
  }

  const [videoTitle, comments] = textContent;
  if (!Array.isArray(comments) || comments.length === 0) {
    console.warn("No comments found on this page.");
    return;
  }

  for (const comment of comments) {
    if (!comment) continue;
    const prompt = buildPrompt(settings, videoTitle, comment);

    let responseData;
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI request failed", response.status, errorText);
        continue;
      }

      responseData = await response.json();
    } catch (error) {
      console.error("OpenAI request failed", error);
      continue;
    }

    const responseStr = responseData?.choices?.[0]?.message?.content;
    if (typeof responseStr !== "string") {
      console.warn("OpenAI response missing content", responseData);
      continue;
    }

    chrome.tabs.sendMessage(tabId, {
      action: "editComment",
      comment: {
        original: comment,
        response: responseStr,
      },
    });
  }
};

if (translateButton) {
  translateButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab?.id;
    if (!tabId) return;

    if (!injectedTabs.has(tabId)) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["editComments.js"],
      });
      injectedTabs.add(tabId);
    }

    translateComments(tabId);
  });
}
