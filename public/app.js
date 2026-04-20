const localTimeEl = document.getElementById("local-time");
const utcTimeEl = document.getElementById("utc-time");
const secondsEl = document.getElementById("timestamp-seconds");
const millisecondsEl = document.getElementById("timestamp-milliseconds");
const timestampInputEl = document.getElementById("timestamp-input");
const timestampUnitEl = document.getElementById("timestamp-unit");
const timestampLocalResultEl = document.getElementById("timestamp-local-result");
const timestampUtcResultEl = document.getElementById("timestamp-utc-result");
const timestampConvertMessageEl = document.getElementById("timestamp-convert-message");
const localDatetimeInputEl = document.getElementById("local-datetime-input");
const utcDatetimeInputEl = document.getElementById("utc-datetime-input");
const datetimeSourceEl = document.getElementById("datetime-source");
const datetimeSecondsResultEl = document.getElementById("datetime-seconds-result");
const datetimeMillisecondsResultEl = document.getElementById("datetime-milliseconds-result");
const datetimeConvertMessageEl = document.getElementById("datetime-convert-message");

const jsonInputEl = document.getElementById("json-input");
const jsonOutputTreeEl = document.getElementById("json-output-tree");
const formatMessageEl = document.getElementById("format-message");
const jsonHistoryListEl = document.getElementById("json-history-list");
const jsonFavoritesListEl = document.getElementById("json-favorites-list");

const jsonStringInputEl = document.getElementById("json-string-input");
const jsonObjectOutputEl = document.getElementById("json-object-output");
const parseMessageEl = document.getElementById("parse-message");
const urlInputEl = document.getElementById("url-input");
const urlOutputEl = document.getElementById("url-output");
const urlMessageEl = document.getElementById("url-message");

const formatButton = document.getElementById("format-json");
const favoriteJsonButton = document.getElementById("favorite-json");
const clearButton = document.getElementById("clear-json");
const clearJsonHistoryButton = document.getElementById("clear-json-history");
const parseButton = document.getElementById("parse-string");
const copyButton = document.getElementById("copy-object");
const convertTimestampButton = document.getElementById("convert-timestamp");
const clearTimestampButton = document.getElementById("clear-timestamp");
const convertDatetimeButton = document.getElementById("convert-datetime");
const clearDatetimeButton = document.getElementById("clear-datetime");
const encodeUrlButton = document.getElementById("encode-url");
const decodeUrlButton = document.getElementById("decode-url");
const clearUrlButton = document.getElementById("clear-url");
const tabJsonFormatButton = document.getElementById("tab-json-format");
const tabJsonStringButton = document.getElementById("tab-json-string");
const tabTimeButton = document.getElementById("tab-time");
const tabUrlButton = document.getElementById("tab-url");
const panelJsonFormat = document.getElementById("panel-json-format");
const panelJsonString = document.getElementById("panel-json-string");
const panelTime = document.getElementById("panel-time");
const panelUrl = document.getElementById("panel-url");
const STORAGE_KEYS = {
  jsonFormatInput: "localtools_json_format_input",
  jsonFormatHistory: "localtools_json_format_history",
  jsonFormatFavorites: "localtools_json_format_favorites",
  jsonStringInput: "localtools_json_string_input",
  urlInput: "localtools_url_input"
};
const JSON_HISTORY_LIMIT = 20;
let jsonHistoryRecords = [];
let jsonFavoriteRecords = [];
let formattedJsonValue = null;
let formattedJsonText = "";
const collapsedJsonPaths = new Set();

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = "message";

  if (type) {
    element.classList.add(type);
  }
}

function saveInputValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage failures so the tool remains usable in restricted browsers.
  }
}

function loadInputValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function loadJsonArray(key) {
  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveJsonArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage failures so the tool remains usable in restricted browsers.
  }
}

function removeInputValue(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore storage failures so clear actions still work visually.
  }
}

function restorePersistedInputs() {
  jsonInputEl.value = loadInputValue(STORAGE_KEYS.jsonFormatInput);
  jsonStringInputEl.value = loadInputValue(STORAGE_KEYS.jsonStringInput);
  urlInputEl.value = loadInputValue(STORAGE_KEYS.urlInput);
}

function createRecordId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function buildRecordPreview(content) {
  return content.length > 320 ? `${content.slice(0, 320)}...` : content;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatJsonPrimitive(value) {
  if (typeof value === "string") {
    return `<span class="json-string">"${escapeHtml(value)}"</span>`;
  }

  if (typeof value === "number") {
    return `<span class="json-number">${String(value)}</span>`;
  }

  if (typeof value === "boolean") {
    return `<span class="json-boolean">${String(value)}</span>`;
  }

  return `<span class="json-null">null</span>`;
}

function buildJsonLine(content, depth) {
  return `<div class="json-line" style="padding-left: ${depth * 20}px">${content}</div>`;
}

function renderJsonNode(value, path, depth, trailingComma, keyLabel) {
  const keyPrefix = keyLabel === null ? "" : `<span class="json-key">"${escapeHtml(keyLabel)}"</span>: `;

  if (value === null || typeof value !== "object") {
    return buildJsonLine(`${keyPrefix}${formatJsonPrimitive(value)}${trailingComma ? "," : ""}`, depth);
  }

  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((item, index) => [String(index), item]) : Object.entries(value);
  const openToken = isArray ? "[" : "{";
  const closeToken = isArray ? "]" : "}";

  if (!entries.length) {
    return buildJsonLine(`${keyPrefix}${openToken}${closeToken}${trailingComma ? "," : ""}`, depth);
  }

  const isCollapsed = collapsedJsonPaths.has(path);
  const toggleButton = `<button class="json-toggle" type="button" data-action="toggle-json-node" data-path="${path}" aria-label="${isCollapsed ? "展开" : "收起"}">${isCollapsed ? "+" : "-"}</button>`;

  if (isCollapsed) {
    return buildJsonLine(
      `${toggleButton}${keyPrefix}${openToken} ... ${closeToken}${trailingComma ? "," : ""}`,
      depth
    );
  }

  let html = buildJsonLine(`${toggleButton}${keyPrefix}${openToken}`, depth);

  entries.forEach(([entryKey, entryValue], index) => {
    const childPath = `${path}.${entryKey}`;
    const childTrailingComma = index < entries.length - 1;
    const childKeyLabel = isArray ? null : entryKey;
    html += renderJsonNode(entryValue, childPath, depth + 1, childTrailingComma, childKeyLabel);
  });

  html += buildJsonLine(`${closeToken}${trailingComma ? "," : ""}`, depth);
  return html;
}

function renderFormattedJsonTree() {
  if (formattedJsonValue === null) {
    jsonOutputTreeEl.className = "json-tree output empty";
    jsonOutputTreeEl.textContent = "格式化后的 JSON 会显示在这里";
    return;
  }

  jsonOutputTreeEl.className = "json-tree output";
  jsonOutputTreeEl.innerHTML = renderJsonNode(formattedJsonValue, "root", 0, false, null);
}

function setFormattedJsonOutput(value) {
  formattedJsonValue = value;
  formattedJsonText = JSON.stringify(value, null, 2);
  renderFormattedJsonTree();
}

function clearFormattedJsonOutput() {
  formattedJsonValue = null;
  formattedJsonText = "";
  collapsedJsonPaths.clear();
  renderFormattedJsonTree();
}

function renderRecordList(container, records, emptyText, type) {
  if (!records.length) {
    container.className = "record-list empty";
    container.textContent = emptyText;
    return;
  }

  container.className = "record-list";
  container.innerHTML = records
    .map((record) => {
      const useLabel = type === "history" ? "使用" : "使用";
      const secondaryButton = type === "history"
        ? `<button class="record-button" type="button" data-action="delete-history" data-id="${record.id}">删除</button>`
        : `<button class="record-button" type="button" data-action="delete-favorite" data-id="${record.id}">取消收藏</button>`;

      return `
        <article class="record-item">
          <div class="record-meta">
            <span class="record-time">${record.savedAt}</span>
            <div class="record-actions">
              <button class="record-button" type="button" data-action="use-record" data-id="${record.id}" data-source="${type}">${useLabel}</button>
              ${secondaryButton}
            </div>
          </div>
          <pre class="record-preview">${escapeHtml(record.preview)}</pre>
        </article>
      `;
    })
    .join("");
}

function renderJsonFormatRecords() {
  renderRecordList(jsonHistoryListEl, jsonHistoryRecords, "暂无历史记录", "history");
  renderRecordList(jsonFavoritesListEl, jsonFavoriteRecords, "暂无收藏内容", "favorite");
}

function persistJsonFormatRecords() {
  saveJsonArray(STORAGE_KEYS.jsonFormatHistory, jsonHistoryRecords);
  saveJsonArray(STORAGE_KEYS.jsonFormatFavorites, jsonFavoriteRecords);
}

function restoreJsonFormatRecords() {
  jsonHistoryRecords = loadJsonArray(STORAGE_KEYS.jsonFormatHistory);
  jsonFavoriteRecords = loadJsonArray(STORAGE_KEYS.jsonFormatFavorites);
  renderJsonFormatRecords();
}

function addJsonHistoryRecord(content) {
  jsonHistoryRecords = [
    {
      id: createRecordId(),
      savedAt: formatLocalDateTime(new Date()),
      preview: buildRecordPreview(content),
      content
    },
    ...jsonHistoryRecords.filter((record) => record.content !== content)
  ].slice(0, JSON_HISTORY_LIMIT);

  persistJsonFormatRecords();
  renderJsonFormatRecords();
}

function addJsonFavoriteRecord(content) {
  if (jsonFavoriteRecords.some((record) => record.content === content)) {
    setMessage(formatMessageEl, "当前 JSON 已在收藏中。", "success");
    return;
  }

  jsonFavoriteRecords = [
    {
      id: createRecordId(),
      savedAt: formatLocalDateTime(new Date()),
      preview: buildRecordPreview(content),
      content
    },
    ...jsonFavoriteRecords
  ];

  persistJsonFormatRecords();
  renderJsonFormatRecords();
  setMessage(formatMessageEl, "已加入收藏。", "success");
}

function useJsonRecord(recordId, source) {
  const records = source === "history" ? jsonHistoryRecords : jsonFavoriteRecords;
  const targetRecord = records.find((record) => record.id === recordId);

  if (!targetRecord) {
    return;
  }

  jsonInputEl.value = targetRecord.content;
  saveInputValue(STORAGE_KEYS.jsonFormatInput, targetRecord.content);
  try {
    setFormattedJsonOutput(JSON.parse(targetRecord.content));
  } catch (error) {
    clearFormattedJsonOutput();
  }
  setMessage(formatMessageEl, "已回填到 JSON 格式化输入区。", "success");
}

function removeJsonRecord(recordId, type) {
  if (type === "history") {
    jsonHistoryRecords = jsonHistoryRecords.filter((record) => record.id !== recordId);
  } else {
    jsonFavoriteRecords = jsonFavoriteRecords.filter((record) => record.id !== recordId);
  }

  persistJsonFormatRecords();
  renderJsonFormatRecords();
}

function updateTime() {
  const now = new Date();
  localTimeEl.textContent = formatLocalDateTime(now);
  utcTimeEl.textContent = now.toUTCString();
  secondsEl.textContent = String(Math.floor(now.getTime() / 1000));
  millisecondsEl.textContent = String(now.getTime());
}

function activateTab(tabName) {
  const isJsonFormat = tabName === "json-format";
  const isJsonString = tabName === "json-string";
  const isTime = tabName === "time";
  const isUrl = tabName === "url";

  tabJsonFormatButton.classList.toggle("active", isJsonFormat);
  tabJsonFormatButton.setAttribute("aria-selected", String(isJsonFormat));
  panelJsonFormat.classList.toggle("active", isJsonFormat);
  panelJsonFormat.hidden = !isJsonFormat;

  tabJsonStringButton.classList.toggle("active", isJsonString);
  tabJsonStringButton.setAttribute("aria-selected", String(isJsonString));
  panelJsonString.classList.toggle("active", isJsonString);
  panelJsonString.hidden = !isJsonString;

  tabTimeButton.classList.toggle("active", isTime);
  tabTimeButton.setAttribute("aria-selected", String(isTime));
  panelTime.classList.toggle("active", isTime);
  panelTime.hidden = !isTime;

  tabUrlButton.classList.toggle("active", isUrl);
  tabUrlButton.setAttribute("aria-selected", String(isUrl));
  panelUrl.classList.toggle("active", isUrl);
  panelUrl.hidden = !isUrl;
}

function formatLocalDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function detectTimestampUnit(rawValue) {
  const normalizedValue = rawValue.replace(/[,_\s]/g, "");

  if (!/^-?\d+$/.test(normalizedValue)) {
    throw new Error("请输入纯数字时间戳。");
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue)) {
    throw new Error("时间戳超出可处理范围。");
  }

  const absoluteValue = Math.abs(numericValue);
  const isMilliseconds = absoluteValue >= 100000000000;
  const unit = isMilliseconds ? "毫秒" : "秒";
  const milliseconds = isMilliseconds ? numericValue : numericValue * 1000;
  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    throw new Error("时间戳无法转换为有效时间。");
  }

  return {
    unit,
    date
  };
}

function resetTimestampConversion() {
  timestampInputEl.value = "";
  timestampUnitEl.textContent = "--";
  timestampLocalResultEl.textContent = "--";
  timestampUtcResultEl.textContent = "--";
  setMessage(timestampConvertMessageEl, "", "");
}

function parseLocalDateTime(rawValue) {
  const normalizedValue = rawValue.trim().replace("T", " ");
  const match = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) {
    throw new Error("本地时间格式应为 YYYY-MM-DD HH:mm:ss。");
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error("本地时间无法解析。");
  }

  return date;
}

function parseUtcDateTime(rawValue) {
  const trimmed = rawValue.trim();
  const normalizedValue = trimmed.endsWith("Z") ? trimmed : `${trimmed}Z`;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error("UTC 时间格式应为 YYYY-MM-DDTHH:mm:ssZ。");
  }

  return date;
}

function resetDatetimeConversion() {
  localDatetimeInputEl.value = "";
  utcDatetimeInputEl.value = "";
  datetimeSourceEl.textContent = "--";
  datetimeSecondsResultEl.textContent = "--";
  datetimeMillisecondsResultEl.textContent = "--";
  setMessage(datetimeConvertMessageEl, "", "");
}

function resetUrlTool() {
  urlOutputEl.value = "";
  setMessage(urlMessageEl, "", "");
}

function normalizeJsonInput(rawValue) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    throw new Error("请输入 JSON 内容。");
  }

  const parsed = JSON.parse(trimmed);
  return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
}

formatButton.addEventListener("click", () => {
  try {
    const result = normalizeJsonInput(jsonInputEl.value);
    const formattedResult = JSON.stringify(result, null, 2);
    collapsedJsonPaths.clear();
    setFormattedJsonOutput(result);
    addJsonHistoryRecord(formattedResult);
    setMessage(formatMessageEl, "JSON 格式化成功。", "success");
  } catch (error) {
    clearFormattedJsonOutput();
    setMessage(formatMessageEl, `解析失败：${error.message}`, "error");
  }
});

favoriteJsonButton.addEventListener("click", () => {
  const candidate = formattedJsonText || jsonInputEl.value.trim();

  if (!candidate) {
    setMessage(formatMessageEl, "没有可收藏的 JSON 内容。", "error");
    return;
  }

  try {
    const result = normalizeJsonInput(candidate);
    addJsonFavoriteRecord(JSON.stringify(result, null, 2));
  } catch (error) {
    setMessage(formatMessageEl, `收藏失败：${error.message}`, "error");
  }
});

clearButton.addEventListener("click", () => {
  jsonInputEl.value = "";
  clearFormattedJsonOutput();
  removeInputValue(STORAGE_KEYS.jsonFormatInput);
  setMessage(formatMessageEl, "", "");
});

clearJsonHistoryButton.addEventListener("click", () => {
  jsonHistoryRecords = [];
  persistJsonFormatRecords();
  renderJsonFormatRecords();
  setMessage(formatMessageEl, "历史记录已清空。", "success");
});

parseButton.addEventListener("click", () => {
  try {
    const rawValue = jsonStringInputEl.value.trim();

    if (!rawValue) {
      throw new Error("请输入 JSON 字符串。");
    }

    const parsedString = JSON.parse(rawValue);

    if (typeof parsedString !== "string") {
      throw new Error("当前输入不是 JSON string，请输入带引号的 JSON 字符串。");
    }

    const parsedObject = JSON.parse(parsedString);
    jsonObjectOutputEl.textContent = JSON.stringify(parsedObject, null, 2);
    setMessage(parseMessageEl, "JSON string 已转换为对象。", "success");
  } catch (error) {
    jsonObjectOutputEl.textContent = "{}";
    setMessage(parseMessageEl, `转换失败：${error.message}`, "error");
  }
});

copyButton.addEventListener("click", async () => {
  const content = jsonObjectOutputEl.textContent;

  if (!content || content === "{}") {
    setMessage(parseMessageEl, "没有可复制的对象结果。", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(content);
    setMessage(parseMessageEl, "对象结果已复制。", "success");
  } catch (error) {
    setMessage(parseMessageEl, "复制失败，请手动复制。", "error");
  }
});

convertTimestampButton.addEventListener("click", () => {
  try {
    const rawValue = timestampInputEl.value.trim();

    if (!rawValue) {
      throw new Error("请输入时间戳。");
    }

    const { unit, date } = detectTimestampUnit(rawValue);
    timestampUnitEl.textContent = unit;
    timestampLocalResultEl.textContent = formatLocalDateTime(date);
    timestampUtcResultEl.textContent = date.toUTCString();
    setMessage(timestampConvertMessageEl, `转换成功，输入单位识别为${unit}。`, "success");
  } catch (error) {
    timestampUnitEl.textContent = "--";
    timestampLocalResultEl.textContent = "--";
    timestampUtcResultEl.textContent = "--";
    setMessage(timestampConvertMessageEl, `转换失败：${error.message}`, "error");
  }
});

clearTimestampButton.addEventListener("click", () => {
  resetTimestampConversion();
});

convertDatetimeButton.addEventListener("click", () => {
  try {
    const localValue = localDatetimeInputEl.value.trim();
    const utcValue = utcDatetimeInputEl.value.trim();

    if (!localValue && !utcValue) {
      throw new Error("请输入本地时间或 UTC 时间。");
    }

    if (localValue && utcValue) {
      throw new Error("请只填写一种时间输入，避免歧义。");
    }

    const source = localValue ? "本地时间" : "UTC 时间";
    const date = localValue ? parseLocalDateTime(localValue) : parseUtcDateTime(utcValue);
    const milliseconds = date.getTime();
    const seconds = Math.floor(milliseconds / 1000);

    datetimeSourceEl.textContent = source;
    datetimeSecondsResultEl.textContent = String(seconds);
    datetimeMillisecondsResultEl.textContent = String(milliseconds);
    setMessage(datetimeConvertMessageEl, `${source}已转换为时间戳。`, "success");
  } catch (error) {
    datetimeSourceEl.textContent = "--";
    datetimeSecondsResultEl.textContent = "--";
    datetimeMillisecondsResultEl.textContent = "--";
    setMessage(datetimeConvertMessageEl, `转换失败：${error.message}`, "error");
  }
});

clearDatetimeButton.addEventListener("click", () => {
  resetDatetimeConversion();
});

encodeUrlButton.addEventListener("click", () => {
  try {
    const rawValue = urlInputEl.value;

    if (!rawValue.trim()) {
      throw new Error("请输入需要编码的内容。");
    }

    urlOutputEl.value = encodeURIComponent(rawValue);
    setMessage(urlMessageEl, "URL 编码成功。", "success");
  } catch (error) {
    urlOutputEl.value = "";
    setMessage(urlMessageEl, `编码失败：${error.message}`, "error");
  }
});

decodeUrlButton.addEventListener("click", () => {
  try {
    const rawValue = urlInputEl.value;

    if (!rawValue.trim()) {
      throw new Error("请输入需要解码的内容。");
    }

    urlOutputEl.value = decodeURIComponent(rawValue);
    setMessage(urlMessageEl, "URL 解码成功。", "success");
  } catch (error) {
    urlOutputEl.value = "";
    setMessage(urlMessageEl, `解码失败：${error.message}`, "error");
  }
});

clearUrlButton.addEventListener("click", () => {
  urlInputEl.value = "";
  removeInputValue(STORAGE_KEYS.urlInput);
  resetUrlTool();
});

jsonInputEl.addEventListener("input", () => {
  saveInputValue(STORAGE_KEYS.jsonFormatInput, jsonInputEl.value);
});

jsonStringInputEl.addEventListener("input", () => {
  saveInputValue(STORAGE_KEYS.jsonStringInput, jsonStringInputEl.value);
});

urlInputEl.addEventListener("input", () => {
  saveInputValue(STORAGE_KEYS.urlInput, urlInputEl.value);
});

jsonHistoryListEl.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const { action, id, source } = target.dataset;

  if (action === "use-record" && id && source) {
    useJsonRecord(id, source);
  }

  if (action === "delete-history" && id) {
    removeJsonRecord(id, "history");
  }
});

jsonFavoritesListEl.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const { action, id, source } = target.dataset;

  if (action === "use-record" && id && source) {
    useJsonRecord(id, source);
  }

  if (action === "delete-favorite" && id) {
    removeJsonRecord(id, "favorite");
  }
});

jsonOutputTreeEl.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const { action, path } = target.dataset;

  if (action !== "toggle-json-node" || !path) {
    return;
  }

  if (collapsedJsonPaths.has(path)) {
    collapsedJsonPaths.delete(path);
  } else {
    collapsedJsonPaths.add(path);
  }

  renderFormattedJsonTree();
});

tabJsonFormatButton.addEventListener("click", () => activateTab("json-format"));
tabJsonStringButton.addEventListener("click", () => activateTab("json-string"));
tabTimeButton.addEventListener("click", () => activateTab("time"));
tabUrlButton.addEventListener("click", () => activateTab("url"));

restorePersistedInputs();
restoreJsonFormatRecords();
activateTab("json-format");
clearFormattedJsonOutput();
resetTimestampConversion();
resetDatetimeConversion();
resetUrlTool();
updateTime();
setInterval(updateTime, 1000);
