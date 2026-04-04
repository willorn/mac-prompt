const DEFAULT_PROMPTS = [
  {
    name: "文章润色专家",
    tag: "writing",
    content:
      "请将下面的文本润色为更通顺、更专业的中文，同时保留原意并给出三种不同风格（正式、亲切、技术性）的改写版本。",
    isPinned: false,
  },
  {
    name: "Tailwind 助手",
    tag: "coding",
    content:
      "根据下面的 UI 描述，生成对应的 Tailwind CSS 类名与简短示例 HTML，包含响应式样式和可访问性建议。",
    isPinned: false,
  },
  {
    name: "市场文案生成器",
    tag: "marketing",
    content:
      "为一款目标用户为职场人士的时间管理工具，生成三条不同角度的产品宣传文案（简洁、情感、功能导向），并包含一句 30 字以内的广告语。",
    isPinned: false,
  },
];

const electronAPI = window.electronAPI;

function assertElectron() {
  if (!electronAPI) {
    throw new Error("Electron API 不可用");
  }
}

function normalizePrompt(prompt) {
  if (!prompt || typeof prompt !== "object") return null;
  const name = String(prompt.name ?? "").trim();
  const content = String(prompt.content ?? "").trim();
  if (!name || !content) return null;
  return {
    name,
    tag: typeof prompt.tag === "string" ? prompt.tag.trim() : "",
    content,
    isPinned: prompt.isPinned === true,
  };
}

function sanitizePromptList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => normalizePrompt(item)).filter(Boolean);
}

async function loadPrompts() {
  try {
    assertElectron();
    const stored = await electronAPI.getPrompts();
    if (!Array.isArray(stored)) {
      return DEFAULT_PROMPTS.slice();
    }
    const sanitized = sanitizePromptList(stored);
    if (sanitized.length === 0 && stored.length > 0) {
      return DEFAULT_PROMPTS.slice();
    }
    return sanitized;
  } catch {
    return DEFAULT_PROMPTS.slice();
  }
}

async function persistPrompts(list) {
  assertElectron();
  await electronAPI.setPrompts(sanitizePromptList(list));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

async function copyPromptForUse(text) {
  try {
    assertElectron();
    if (electronAPI?.copyPastePrompt) {
      return await electronAPI.copyPastePrompt(text);
    }
  } catch (err) {
    console.error("主进程复制粘贴失败，回退为仅复制", err);
  }

  const copied = await copyText(text);
  return { copied, pasted: false };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

  document.addEventListener("DOMContentLoaded", () => {
  const navItemsContainer = document.getElementById("sidebar");
  const cardGrid = document.getElementById("cardGrid");
  const searchInput = document.getElementById("searchInput");
  const modal = document.getElementById("modalOverlay");
  const modalTitle = modal.querySelector("h2");
  const settingsBtn = document.getElementById("settingsBtn");

  const previewPanel = document.getElementById("previewPanel");
  const previewTitle = document.getElementById("previewTitle");
  const previewBody = document.getElementById("previewBody");
  const previewTag = document.getElementById("previewTag");
  const previewEdit = document.getElementById("previewEdit");
  const resultCount = document.getElementById("resultCount");

  const tagInput = document.getElementById("newTag");
  const tagDropdown = document.getElementById("tagDropdown");

  const addBtn = document.getElementById("addBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");
  const menuImport = document.getElementById("menuImport");
  const menuExport = document.getElementById("menuExport");
  const menuWebdav = document.getElementById("menuWebdav");
  const menuHiddenTags = document.getElementById("menuHiddenTags");
  const moreMenu = document.getElementById("moreMenu");
  const webdavOverlay = document.getElementById("webdavOverlay");
  const webdavUrl = document.getElementById("webdavUrl");
  const webdavUsername = document.getElementById("webdavUsername");
  const webdavPassword = document.getElementById("webdavPassword");
  const webdavDir = document.getElementById("webdavDir");
  const webdavConfigJson = document.getElementById("webdavConfigJson");
  const webdavRestorePath = document.getElementById("webdavRestorePath");
  const webdavTest = document.getElementById("webdavTest");
  const webdavAutoBackup = document.getElementById("webdavAutoBackup");
  const webdavIntervalDays = document.getElementById("webdavIntervalDays");
  const webdavBackupList = document.getElementById("webdavBackupList");
  const webdavRefresh = document.getElementById("webdavRefresh");
  const webdavCopyConfig = document.getElementById("webdavCopyConfig");
  const webdavPasteConfig = document.getElementById("webdavPasteConfig");
  const webdavBackup = document.getElementById("webdavBackup");
  const webdavRestore = document.getElementById("webdavRestore");
  const webdavClose = document.getElementById("webdavClose");

  const hiddenTagsOverlay = document.getElementById("hiddenTagsOverlay");
  const hiddenTagsList = document.getElementById("hiddenTagsList");
  const hiddenTagsEmpty = document.getElementById("hiddenTagsEmpty");
  const hiddenTagsClose = document.getElementById("hiddenTagsClose");
  const hiddenTagsCancel = document.getElementById("hiddenTagsCancel");
  const hiddenTagsSave = document.getElementById("hiddenTagsSave");

  const renameTagOverlay = document.getElementById("renameTagOverlay");
  const renameTagInput = document.getElementById("renameTagInput");
  const renameTagError = document.getElementById("renameTagError");
  const renameTagClose = document.getElementById("renameTagClose");
  const renameTagCancel = document.getElementById("renameTagCancel");
  const renameTagSave = document.getElementById("renameTagSave");

  // Copy/Paste Config Modal Elements
  const copyConfigOverlay = document.getElementById("copyConfigOverlay");
  const copyConfigClose = document.getElementById("copyConfigClose");
  const copyConfigText = document.getElementById("copyConfigText");
  const copyConfigBtn = document.getElementById("copyConfigBtn");
  const pasteConfigOverlay = document.getElementById("pasteConfigOverlay");
  const pasteConfigClose = document.getElementById("pasteConfigClose");
  const pasteConfigCancel = document.getElementById("pasteConfigCancel");
  const pasteConfigText = document.getElementById("pasteConfigText");
  const pasteConfigApply = document.getElementById("pasteConfigApply");

  let allPrompts = [];
  let hiddenTags = [];
  let editingIndex = null;
  let selectedIndex = null;
  let contextMenuTargetIndex = null;
  let renameTagOriginal = null;

  const normalizeTag = (tag) => (typeof tag === "string" ? tag.trim() : "");

  function sanitizeTagList(list) {
    if (list == null) return [];
    const arr = Array.isArray(list) ? list : [list];
    return Array.from(
      new Set(
        arr
          .map((tag) => normalizeTag(tag))
          .filter((tag) => tag.length > 0),
      ),
    );
  }

  function isTagHidden(tag) {
    const normalized = normalizeTag(tag);
    return normalized.length > 0 && hiddenTags.includes(normalized);
  }

  function getAllTagNames() {
    return [
      ...new Set(
        allPrompts
          .map((p) => normalizeTag(p.tag))
          .filter((tag) => tag.length > 0),
      ),
    ];
  }

  function getVisibleInAllCount() {
    return allPrompts.filter((item) => !isTagHidden(item.tag)).length;
  }

  async function loadHiddenTags() {
    if (!electronAPI?.getHiddenTags) return [];
    try {
      const stored = await electronAPI.getHiddenTags();
      return sanitizeTagList(stored);
    } catch (err) {
      console.error("加载隐藏分类失败", err);
      return [];
    }
  }

  async function persistHiddenTags(tags) {
    const sanitized = sanitizeTagList(tags);
    if (!electronAPI?.setHiddenTags) {
      hiddenTags = sanitized;
      return hiddenTags;
    }
    try {
      const saved = await electronAPI.setHiddenTags(sanitized);
      hiddenTags = sanitizeTagList(saved);
    } catch (err) {
      console.error("保存隐藏分类失败", err);
      hiddenTags = sanitized;
    }
    return hiddenTags;
  }

  function setRenameTagError(message = "") {
    if (!renameTagError) return;
    renameTagError.textContent = message;
    renameTagError.style.visibility = message ? "visible" : "hidden";
  }

  function openRenameTagModal(tag) {
    if (!renameTagOverlay) return;
    renameTagOriginal = tag;
    if (renameTagInput) {
      renameTagInput.value = tag || "";
      setTimeout(() => {
        renameTagInput.focus();
        renameTagInput.select();
      }, 0);
    }
    setRenameTagError("");
    renameTagOverlay.style.display = "flex";
  }

  function closeRenameTagModal() {
    if (!renameTagOverlay) return;
    renameTagOverlay.style.display = "none";
    renameTagOriginal = null;
    setRenameTagError("");
  }

  async function handleRenameTagSave() {
    if (!renameTagOriginal) {
      closeRenameTagModal();
      return;
    }
    const normalizedOld = normalizeTag(renameTagOriginal);
    if (!normalizedOld) {
      closeRenameTagModal();
      return;
    }
    const newValue = renameTagInput?.value ?? "";
    const trimmed = newValue.trim();
    if (!trimmed) {
      setRenameTagError("分类名称不能为空");
      return;
    }
    const normalizedNew = normalizeTag(trimmed);

    if (normalizedNew === normalizedOld && trimmed === renameTagOriginal) {
      closeRenameTagModal();
      showToast("未做任何更改");
      return;
    }

    let changed = false;
    const updatedPrompts = allPrompts.map((prompt) => {
      if (normalizeTag(prompt.tag) === normalizedOld) {
        if (prompt.tag === trimmed) return prompt;
        changed = true;
        return { ...prompt, tag: trimmed };
      }
      return prompt;
    });

    if (!changed) {
      setRenameTagError("未找到需要更新的提示词或未做更改");
      return;
    }

    allPrompts = updatedPrompts;

    if (hiddenTags.includes(normalizedOld)) {
      let updatedHidden = hiddenTags.filter((tag) => tag !== normalizedOld);
      if (normalizedNew && !updatedHidden.includes(normalizedNew)) {
        updatedHidden.push(normalizedNew);
      }
      await persistHiddenTags(updatedHidden);
    }

    await saveData();
    closeRenameTagModal();
    showToast("分类已重命名");
  }

  // Context Menu Elements
  const contextMenu = document.getElementById("contextMenu");
  const contextPinText = document.getElementById("contextPinText");

  (async () => {
    const [prompts, storedHidden] = await Promise.all([
      loadPrompts(),
      loadHiddenTags(),
    ]);
    allPrompts = prompts;
    hiddenTags = storedHidden;
    renderAll();
    if (!allPrompts.length) {
      clearPreview();
    }
  })();

  if (settingsBtn) {
    settingsBtn.onclick = (e) => {
      e.stopPropagation();
      if (!moreMenu) return;
      moreMenu.style.display = moreMenu.style.display === "block" ? "none" : "block";
    };
  }

  document.addEventListener("click", (e) => {
    if (!moreMenu) return;
    if (e.target && moreMenu.contains(e.target)) return;
    if (settingsBtn && (e.target === settingsBtn || settingsBtn.contains(e.target))) return;
    moreMenu.style.display = "none";
  });

  function buildWebdavSnapshot(config) {
    return {
      version: "1.0",
      webdavConfig: config,
    };
  }

  async function loadWebdavConfig() {
    if (!electronAPI?.getWebdavConfig) return null;
    const config = await electronAPI.getWebdavConfig();
    return config || null;
  }

  function collectWebdavConfig() {
    return {
      url: webdavUrl?.value?.trim() || "",
      username: webdavUsername?.value?.trim() || "",
      password: webdavPassword?.value || "",
      directory: webdavDir?.value?.trim() || "prompt-box-backups",
    };
  }

  async function saveWebdavConfig() {
    if (!electronAPI?.setWebdavConfig) return;
    const config = collectWebdavConfig();
    await electronAPI.setWebdavConfig(config);
    return config;
  }

  function renderWebdavBackups(list) {
    if (!webdavBackupList) return;
    webdavBackupList.innerHTML = "";
    if (webdavRestorePath) {
      webdavRestorePath.value = "";
    }
    if (!Array.isArray(list) || list.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "暂无备份";
      opt.disabled = true;
      opt.selected = true;
      webdavBackupList.appendChild(opt);
      return;
    }
    list.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.path;
      const size = Number(item.size);
      const sizeText =
        Number.isFinite(size) && size >= 0
          ? `${(size / 1024).toFixed(size >= 1024 ? 1 : 0)} KB`
          : "未知大小";
      opt.textContent = `${item.name} ｜ ${item.lastMod || "未知时间"} ｜ ${sizeText}`;
      webdavBackupList.appendChild(opt);
    });
    webdavBackupList.selectedIndex = 0;
  }

  async function loadWebdavBackups() {
    if (!electronAPI?.listWebdavBackups) return;
    const list = await electronAPI.listWebdavBackups();
    renderWebdavBackups(list);
  }

  function openWebdavModal() {
    if (!webdavOverlay) return;
    webdavOverlay.style.display = "flex";
  }

  function closeWebdavModal() {
    if (!webdavOverlay) return;
    webdavOverlay.style.display = "none";
  }

  function openHiddenTagsModal() {
    if (!hiddenTagsOverlay) return;
    renderHiddenTagsList();
    hiddenTagsOverlay.style.display = "flex";
  }

  function closeHiddenTagsModal() {
    if (!hiddenTagsOverlay) return;
    hiddenTagsOverlay.style.display = "none";
  }

  function renderHiddenTagsList() {
    if (!hiddenTagsList || !hiddenTagsEmpty) return;
    const tags = getAllTagNames();
    hiddenTagsList.innerHTML = "";
    if (!tags.length) {
      hiddenTagsEmpty.style.display = "block";
      hiddenTagsList.style.display = "none";
      return;
    }
    hiddenTagsEmpty.style.display = "none";
    hiddenTagsList.style.display = "flex";
    tags.forEach((tag) => {
      const row = document.createElement("label");
      row.className = "hidden-tag-row";
      const left = document.createElement("div");
      left.className = "hidden-tag-row-left";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = tag;
      checkbox.checked = hiddenTags.includes(tag);
      const span = document.createElement("span");
      span.textContent = tag;
      left.appendChild(checkbox);
      left.appendChild(span);
      const hint = document.createElement("small");
      hint.textContent = checkbox.checked
        ? "已从“全部提示词”隐藏"
        : "显示在“全部提示词”";
      checkbox.onchange = () => {
        hint.textContent = checkbox.checked
          ? "已从“全部提示词”隐藏"
          : "显示在“全部提示词”";
      };
      row.appendChild(left);
      row.appendChild(hint);
      hiddenTagsList.appendChild(row);
    });
  }

  async function saveHiddenTagsSelection() {
    if (!hiddenTagsList) return;
    const checkboxes = hiddenTagsList.querySelectorAll('input[type="checkbox"]');
    const selected = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
    await persistHiddenTags(selected);
    closeHiddenTagsModal();
    renderAll();
    showToast("隐藏分类设置已更新");
  }

  function showToast(message = "已复制到剪贴板") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.display = "block";
    toast.style.opacity = "1";

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.style.display = "none";
      }, 300);
    }, 1500);
  }

  async function closeCurrentWindowSilently() {
    try {
      assertElectron();
      await electronAPI.minimizeWindow();
    } catch {
      showToast("隐藏失败，请检查快捷键/权限设置");
    }
  }

  // Context Menu Functions
  function showContextMenu(e, item) {
    if (!contextMenu) return;
    contextMenuTargetIndex = item.originalIndex;

    // 更新置顶按钮文字
    if (contextPinText) {
      contextPinText.textContent = item.isPinned ? "取消置顶" : "置顶";
    }

    // 定位菜单
    const x = Math.min(e.clientX, window.innerWidth - 160);
    const y = Math.min(e.clientY, window.innerHeight - 120);
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = "block";
  }

  function hideContextMenu() {
    if (contextMenu) {
      contextMenu.style.display = "none";
    }
    contextMenuTargetIndex = null;
  }

  // 点击其他地方关闭右键菜单
  document.addEventListener("click", (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  // 右键菜单项点击处理
  if (contextMenu) {
    contextMenu.querySelectorAll(".context-menu-item").forEach((item) => {
      item.onclick = async () => {
        const action = item.dataset.action;
        const index = contextMenuTargetIndex;
        if (index === null) return;

        const data = allPrompts[index];
        if (!data) return;

        switch (action) {
          case "pin":
            data.isPinned = !data.isPinned;
            await saveData();
            showToast(data.isPinned ? "已置顶" : "已取消置顶");
            break;
          case "edit":
            openEditModal(index);
            break;
          case "delete":
            if (confirm(`确定要删除 "${data.name}" 吗？`)) {
              allPrompts.splice(index, 1);
              await saveData();
              showToast("已删除");
            }
            break;
        }
        hideContextMenu();
      };
    });
  }

  function renderAll() {
    updateSidebarAndDropdown();
    renderCards();
    if (hiddenTagsOverlay && hiddenTagsOverlay.style.display === "flex") {
      renderHiddenTagsList();
    }
  }

  function openEditModal(index) {
    const data = allPrompts[index];
    if (!data) return;
    editingIndex = index;
    selectCard(index);
    const nameInput = document.getElementById("newName");
    const contentInput = document.getElementById("newContent");
    if (nameInput) nameInput.value = data.name;
    if (tagInput) tagInput.value = data.tag;
    if (contentInput) contentInput.value = data.content;
    if (modalTitle) modalTitle.innerText = "编辑提示词";
    if (modal) modal.style.display = "flex";
  }

  function applyPreviewTheme(item) {
    if (!previewPanel) return;
    const base = item
      ? `${item.name || ""}|${normalizeTag(item.tag) || ""}`
      : "default";
    let hash = 0;
    for (let i = 0; i < base.length; i += 1) {
      hash = (hash * 31 + base.charCodeAt(i)) % 360;
    }
    const hue = (hash + 220) % 360;
    previewPanel.style.setProperty("--preview-hue", hue);
    previewPanel.classList.remove("preview-change");
    void previewPanel.offsetWidth;
    previewPanel.classList.add("preview-change");
  }

  function clearPreview() {
    selectedIndex = null;
    if (previewTitle) previewTitle.textContent = "提示词详情";
    if (previewBody) previewBody.textContent = "从左侧选择一条提示词，这里会显示完整内容。";
    if (previewTag) previewTag.textContent = "未选择";
    if (previewPanel) previewPanel.style.opacity = "0.9";
    applyPreviewTheme(null);
    if (resultCount) resultCount.textContent = "0";
  }

  function updatePreview(item) {
    if (!item) return;
    if (previewTitle) previewTitle.textContent = item.name || "未命名";
    if (previewBody) previewBody.textContent = item.content || "";
    if (previewTag) previewTag.textContent = normalizeTag(item.tag) || "默认";
    if (previewPanel) previewPanel.style.opacity = "1";
    applyPreviewTheme(item);
  }

  function selectCard(originalIndex, fromHover = false) {
    if (selectedIndex === originalIndex && fromHover) return;
    selectedIndex = originalIndex;
    document.querySelectorAll(".card").forEach((el) => {
      el.classList.toggle("active-card", Number(el.dataset.originalIndex) === originalIndex);
    });
    const item = allPrompts[originalIndex];
    updatePreview(item);
  }

  function updateSidebarAndDropdown() {
    const tags = getAllTagNames();

    if (tags.length === 0) {
      tagDropdown.innerHTML =
        '<div style="padding: 10px; color: #94a3b8; font-size: 12px; text-align: center;">暂无已有标签</div>';
    } else {
      tagDropdown.innerHTML = tags
        .map(
          (tag) => `
                <div class="tag-option" style="padding: 10px 12px; cursor: pointer; font-size: 14px; color: #475569; transition: background 0.2s;">
                    ${escapeHtml(tag)}
                </div>
            `,
        )
        .join("");
    }

    tagDropdown.querySelectorAll(".tag-option").forEach((option) => {
      option.onmousedown = () => {
        tagInput.value = option.innerText.trim();
        tagDropdown.style.display = "none";
      };
      option.onmouseenter = () => (option.style.background = "#f1f5f9");
      option.onmouseleave = () => (option.style.background = "transparent");
    });

    const currentFilter =
      document.querySelector(".nav-item.active")?.dataset.filter || "all";
    const existingLinks = navItemsContainer.querySelectorAll("a.nav-item");
    existingLinks.forEach((link) => link.remove());

    const allLink = createNavLink(
      "all",
      "全部提示词",
      getVisibleInAllCount(),
      currentFilter === "all",
    );
    navItemsContainer.insertBefore(allLink, document.getElementById("addTagBtn"));

    tags.forEach((tag) => {
      const count = allPrompts.filter((p) => normalizeTag(p.tag) === tag).length;
      const tagLink = createNavLink(tag, tag, count, currentFilter === tag, {
        hidden: hiddenTags.includes(tag),
      });
      navItemsContainer.insertBefore(tagLink, document.getElementById("addTagBtn"));
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.onclick = (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".nav-item")
          .forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");
        renderCards();
      };
      item.oncontextmenu = (e) => {
        const targetFilter = item.dataset.filter;
        if (!targetFilter || targetFilter === "all") return;
        e.preventDefault();
        openRenameTagModal(targetFilter);
      };
    });
  }

  function createNavLink(filter, text, count, isActive, options = {}) {
    const { hidden = false } = options;
    const a = document.createElement("a");
    a.href = "#";
    a.className = `nav-item ${isActive ? "active" : ""}`;
    a.dataset.filter = filter;
    a.style.display = "flex";
    a.style.alignItems = "center";
    a.style.justifyContent = "space-between";
    const label = document.createElement("span");
    label.textContent = text;
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.gap = "4px";
    if (hidden && filter !== "all") {
      const flag = document.createElement("span");
      flag.className = "nav-hidden-flag";
      flag.textContent = "隐藏";
      label.appendChild(flag);
    }
    const countBadge = document.createElement("span");
    countBadge.style.fontSize = "10px";
    countBadge.style.opacity = "0.6";
    countBadge.style.background = "rgba(0,0,0,0.05)";
    countBadge.style.padding = "2px 6px";
    countBadge.style.borderRadius = "10px";
    countBadge.textContent = count;
    a.appendChild(label);
    a.appendChild(countBadge);
    return a;
  }

  async function saveData() {
    allPrompts = sanitizePromptList(allPrompts);
    try {
      await persistPrompts(allPrompts);
    } catch (err) {
      console.error("保存失败", err);
    }
    renderAll();
  }

  function renderCards() {
    const term = searchInput.value.toLowerCase().trim();
    const activeFilter =
      document.querySelector(".nav-item.active")?.dataset.filter || "all";

    cardGrid.innerHTML = "";
    let visibleCount = 0;
    const visibleIndices = [];
    const displayList = [...allPrompts]
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    displayList.forEach((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term);
      const normalizedTag = normalizeTag(item.tag);
      const matchesCategory =
        activeFilter === "all"
          ? !isTagHidden(normalizedTag)
          : normalizedTag === activeFilter;

      if (matchesSearch && matchesCategory) {
        visibleCount += 1;
        const card = document.createElement("div");
        card.className = "card";
        if (item.isPinned) {
          card.style.border = "1px solid #eadfce";
          card.style.boxShadow = "0 14px 30px rgba(15, 23, 42, 0.08)";
          card.style.backgroundColor = "#fffaf2";
          card.classList.add("pinned-card");
        }

        card.tabIndex = 0;
        card.dataset.originalIndex = item.originalIndex;
        card.addEventListener("mouseenter", () => selectCard(item.originalIndex, true));
        card.addEventListener("focus", () => selectCard(item.originalIndex, true));

        const handleUsePrompt = async () => {
          const result = await copyPromptForUse(item.content);
          if (!result?.copied) {
            console.error("复制失败");
            showToast("复制失败，请手动复制");
            return;
          }

          card.style.boxShadow = "0 0 0 3px rgba(217, 119, 87, 0.12), 0 16px 34px rgba(15, 23, 42, 0.1)";
          setTimeout(() => (card.style.boxShadow = item.isPinned ? "0 14px 30px rgba(15, 23, 42, 0.08)" : ""), 500);

          if (result.pasted) {
            showToast("已粘贴到当前输入位置");
          } else if (result.requiresAccessibilityPermission) {
            showToast("已复制，请先授予辅助功能权限");
          } else {
            showToast("已复制，未自动粘贴");
          }

          card.style.backgroundColor = "#f8efe2";
          setTimeout(() => {
            card.style.backgroundColor = item.isPinned ? "#fffaf2" : "";
          }, 200);

          if (!result.pasted) {
            closeCurrentWindowSilently();
          }
          selectCard(item.originalIndex);
        };

        card.onkeydown = (e) => {
          const cards = document.querySelectorAll(".card");
          const currentIndex = Array.from(cards).indexOf(card);

          if (e.key === "Enter") {
            e.preventDefault();
            selectCard(item.originalIndex);
            handleUsePrompt();
          } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "Tab") {
            if (currentIndex < cards.length - 1) {
              cards[currentIndex + 1].focus();
              e.preventDefault();
            }
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            if (currentIndex > 0) {
              cards[currentIndex - 1].focus();
              e.preventDefault();
            }
          }
        };

        card.innerHTML = `
          <div class="card-header">
            <div class="card-content">
              <div class="card-title">${escapeHtml(item.name)}</div>
              <div class="card-body">${escapeHtml(item.content)}</div>
            </div>
            <div class="card-actions">
              <span class="card-meta">
                <span class="card-tag">${escapeHtml(normalizedTag || "默认")}</span>
              </span>
              <button class="pin-btn" data-index="${item.originalIndex}" style="color: #101010;">置顶</button>
              <button class="edit-btn" data-index="${item.originalIndex}">编辑</button>
              <button class="delete-btn" data-index="${item.originalIndex}">删除</button>
            </div>
          </div>
        `;

        // 右键菜单
        card.oncontextmenu = (e) => {
          e.preventDefault();
          showContextMenu(e, item);
        };

        // 只有内容区域点击才复制
        const cardContent = card.querySelector('.card-content');
        if (cardContent) {
          cardContent.onclick = async (e) => {
            e.stopPropagation();
            await handleUsePrompt();
          };
        }
        cardGrid.appendChild(card);
        visibleIndices.push(item.originalIndex);
      }
    });

    if (resultCount) {
      resultCount.textContent = String(visibleCount);
    }
    if (visibleIndices.length === 0) {
      clearPreview();
    } else if (!visibleIndices.includes(selectedIndex)) {
      selectCard(visibleIndices[0]);
    }

    attachDynamicEvents();
  }

  function attachDynamicEvents() {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm("确定删除此提示词吗？")) {
          allPrompts.splice(btn.dataset.index, 1);
          await saveData();
        }
      };
    });

    document.querySelectorAll(".pin-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.index);
        allPrompts[idx].isPinned = !allPrompts[idx].isPinned;
        await saveData();
      };
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.index);
        openEditModal(idx);
      };
    });
  }

  searchInput.addEventListener("input", () => {
    renderCards();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      const firstCard = document.querySelector(".card");
      if (firstCard) {
        firstCard.focus();
        e.preventDefault();
      }
    }
  });

  saveBtn.onclick = async () => {
    const name = document.getElementById("newName").value.trim();
    const tag = document.getElementById("newTag").value.trim();
    const content = document.getElementById("newContent").value.trim();

    if (!name || !content) return alert("名称和内容不能为空");

    if (editingIndex !== null) {
      allPrompts[editingIndex] = {
        ...allPrompts[editingIndex],
        name,
        tag,
        content,
      };
    } else {
      allPrompts.push({ name, tag, content, isPinned: false });
    }

    modal.style.display = "none";
    await saveData();
    resetForm();
  };

  function resetForm() {
    editingIndex = null;
    document.getElementById("newName").value = "";
    document.getElementById("newTag").value = "";
    document.getElementById("newContent").value = "";
    modalTitle.innerText = "新增提示词";
  }

  tagInput.onfocus = () => {
    updateSidebarAndDropdown();
    tagDropdown.style.display = "block";
  };

  tagInput.onblur = () => {
    setTimeout(() => {
      tagDropdown.style.display = "none";
    }, 200);
  };

  addBtn.onclick = () => {
    resetForm();
    modal.style.display = "flex";
  };

  cancelBtn.onclick = () => (modal.style.display = "none");

  if (menuExport) menuExport.onclick = async () => {
    try {
      const content = JSON.stringify(allPrompts, null, 2);
      assertElectron();
      const result = await electronAPI.exportPrompts(content);
      if (!result?.canceled && result?.filePath) {
        showToast(`已导出：${result.filePath.split(/[\\/]/).pop()}`);
      }
    } catch (err) {
      if (!String(err).includes("取消")) {
        alert(`导出失败: ${err}`);
      }
    }
    if (moreMenu) moreMenu.style.display = "none";
  };

  if (menuHiddenTags) {
    menuHiddenTags.onclick = () => {
      openHiddenTagsModal();
      if (moreMenu) moreMenu.style.display = "none";
    };
  }

  if (menuWebdav) menuWebdav.onclick = () => {
    (async () => {
      openWebdavModal();
      if (moreMenu) moreMenu.style.display = "none";
      const config = await loadWebdavConfig();
      if (config) {
        if (webdavUrl) webdavUrl.value = config.url || "";
        if (webdavUsername) webdavUsername.value = config.username || "";
        if (webdavPassword) webdavPassword.value = config.password || "";
        if (webdavDir) webdavDir.value = config.directory || "prompt-box-backups";
        if (webdavConfigJson) {
          webdavConfigJson.value = JSON.stringify(buildWebdavSnapshot(config), null, 2);
        }
      }
      if (electronAPI?.getWebdavSettings) {
        const settings = await electronAPI.getWebdavSettings();
        if (webdavAutoBackup) webdavAutoBackup.checked = !!settings?.autoBackupEnabled;
        if (webdavIntervalDays) webdavIntervalDays.value = String(settings?.intervalDays ?? 3);
      }
      await loadWebdavBackups();
    })();
  };

  if (menuImport) menuImport.onclick = async () => {
    try {
      assertElectron();
      const result = await electronAPI.importPrompts();
      if (result?.canceled) return;
      const parsed = JSON.parse(result.raw);
      const prompts = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.prompts) ? parsed.prompts : null;
      if (!prompts) {
        alert("文件格式错误：必须是提示词数组，或包含 prompts 数组的备份文件");
        return;
      }
      const importedPrompts = sanitizePromptList(prompts);
      if (prompts.length > 0 && importedPrompts.length === 0) {
        alert("导入失败：文件中的提示词格式无效");
        return;
      }
      allPrompts = importedPrompts;
      selectedIndex = null;
      await saveData();
      showToast("导入成功");
    } catch (err) {
      if (!String(err).includes("取消")) {
        alert(`导入失败: ${err}`);
      }
    }
    if (moreMenu) moreMenu.style.display = "none";
  };

  if (previewEdit) {
    previewEdit.onclick = () => {
      if (selectedIndex === null) return;
      openEditModal(selectedIndex);
    };
  }

  if (webdavClose) {
    webdavClose.onclick = () => closeWebdavModal();
  }

  if (hiddenTagsClose) {
    hiddenTagsClose.onclick = () => closeHiddenTagsModal();
  }

  if (hiddenTagsCancel) {
    hiddenTagsCancel.onclick = () => closeHiddenTagsModal();
  }

  if (hiddenTagsSave) {
    hiddenTagsSave.onclick = () => {
      saveHiddenTagsSelection();
    };
  }

  if (renameTagClose) {
    renameTagClose.onclick = () => closeRenameTagModal();
  }

  if (renameTagCancel) {
    renameTagCancel.onclick = () => closeRenameTagModal();
  }

  if (renameTagSave) {
    renameTagSave.onclick = () => {
      handleRenameTagSave().catch((err) => {
        console.error("重命名分类失败", err);
        setRenameTagError(err?.message || "重命名失败");
      });
    };
  }

  if (webdavOverlay) {
    webdavOverlay.addEventListener("click", (e) => {
      if (e.target === webdavOverlay) closeWebdavModal();
    });
  }

  if (hiddenTagsOverlay) {
    hiddenTagsOverlay.addEventListener("click", (e) => {
      if (e.target === hiddenTagsOverlay) closeHiddenTagsModal();
    });
  }

  if (renameTagOverlay) {
    renameTagOverlay.addEventListener("click", (e) => {
      if (e.target === renameTagOverlay) closeRenameTagModal();
    });
  }

  if (renameTagInput) {
    renameTagInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleRenameTagSave().catch((err) => {
          console.error("重命名分类失败", err);
          setRenameTagError(err?.message || "重命名失败");
        });
      }
    });
  }

  if (webdavRefresh) {
    webdavRefresh.onclick = async () => {
      try {
        await saveWebdavConfig();
        await loadWebdavBackups();
        showToast("已刷新");
      } catch (err) {
        alert(`刷新失败: ${err}`);
      }
    };
  }

  if (webdavTest) {
    webdavTest.onclick = async () => {
      try {
        await saveWebdavConfig();
        await electronAPI.testWebdav();
        showToast("WebDAV 连接成功");
      } catch (err) {
        alert(`连接失败: ${err}`);
      }
    };
  }

  if (webdavBackup) {
    webdavBackup.onclick = async () => {
      try {
        await saveWebdavConfig();
        const result = await electronAPI.backupWebdav();
        await loadWebdavBackups();
        if (result?.fileName) {
          showToast(`已备份：${result.fileName}`);
        } else {
          showToast("已备份");
        }
      } catch (err) {
        alert(`备份失败: ${err}`);
      }
    };
  }

  if (webdavRestore) {
    webdavRestore.onclick = async () => {
      try {
        await saveWebdavConfig();
        if (!confirm("将从 WebDAV 恢复，当前本地内容将被覆盖。继续吗？")) {
          return;
        }
        let result;
        const path = webdavRestorePath?.value?.trim();
        const selected = webdavBackupList?.value;
        if (path) {
          result = await electronAPI.restoreWebdavPath(path);
        } else if (selected && selected.trim()) {
          result = await electronAPI.restoreWebdavPath(selected);
        } else {
          alert("暂无可恢复的云端备份，请先刷新列表或立即备份。");
          return;
        }
        allPrompts = await loadPrompts();
        renderAll();
        showToast(`已恢复 ${result?.promptsCount ?? 0} 条`);
      } catch (err) {
        alert(`恢复失败: ${err}`);
      }
    };
  }

  const intervalField = document.getElementById("intervalField");
  
  function updateIntervalFieldVisibility() {
    if (intervalField) {
      intervalField.style.display = webdavAutoBackup?.checked ? "block" : "none";
    }
  }
  
  if (webdavAutoBackup || webdavIntervalDays) {
    const saveSettings = async () => {
      if (!electronAPI?.setWebdavSettings) return;
      const enabled = !!webdavAutoBackup?.checked;
      const days = Number(webdavIntervalDays?.value || 3);
      await electronAPI.setWebdavSettings({
        autoBackupEnabled: enabled,
        intervalDays: Math.max(1, Math.min(days, 30)),
      });
      updateIntervalFieldVisibility();
    };
    if (webdavAutoBackup) {
      webdavAutoBackup.onchange = saveSettings;
      // Initialize visibility
      updateIntervalFieldVisibility();
    }
    if (webdavIntervalDays) webdavIntervalDays.onchange = saveSettings;
  }

  // Copy Config Modal Functions
  function openCopyConfigModal() {
    if (!copyConfigOverlay || !copyConfigText) return;
    const config = collectWebdavConfig();
    const json = JSON.stringify(buildWebdavSnapshot(config), null, 2);
    copyConfigText.value = json;
    copyConfigOverlay.style.display = "flex";
  }

  function closeCopyConfigModal() {
    if (copyConfigOverlay) copyConfigOverlay.style.display = "none";
  }

  // Paste Config Modal Functions
  function openPasteConfigModal() {
    if (!pasteConfigOverlay) return;
    if (pasteConfigText) pasteConfigText.value = "";
    pasteConfigOverlay.style.display = "flex";
  }

  function closePasteConfigModal() {
    if (pasteConfigOverlay) pasteConfigOverlay.style.display = "none";
  }

  async function applyPastedConfig() {
    try {
      const raw = pasteConfigText?.value?.trim();
      if (!raw) {
        alert("请粘贴配置 JSON");
        return;
      }
      const parsed = JSON.parse(raw);
      const cfg = parsed.webdavConfig || {};
      let url = cfg.url || "";
      if (typeof url === "string" && url.includes("jianguoyun-dav-proxy")) {
        url = "https://dav.jianguoyun.com/dav/";
      }
      if (webdavUrl) webdavUrl.value = url;
      if (webdavUsername) webdavUsername.value = cfg.username || "";
      if (webdavPassword) webdavPassword.value = cfg.password || "";
      if (webdavDir) webdavDir.value = cfg.directory || "prompt-box-backups";
      await saveWebdavConfig();
      closePasteConfigModal();
      showToast("配置已应用");
    } catch (err) {
      alert(`解析失败: ${err}`);
    }
  }

  // Copy Config Button
  if (webdavCopyConfig) {
    webdavCopyConfig.onclick = openCopyConfigModal;
  }

  // Paste Config Button
  if (webdavPasteConfig) {
    webdavPasteConfig.onclick = openPasteConfigModal;
  }

  // Copy Config Modal Events
  if (copyConfigClose) copyConfigClose.onclick = closeCopyConfigModal;
  if (copyConfigOverlay) {
    copyConfigOverlay.onclick = (e) => {
      if (e.target === copyConfigOverlay) closeCopyConfigModal();
    };
  }
  if (copyConfigBtn) {
    copyConfigBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(copyConfigText?.value || "");
        showToast("已复制到剪贴板");
        closeCopyConfigModal();
      } catch (err) {
        alert(`复制失败: ${err}`);
      }
    };
  }

  // Paste Config Modal Events
  if (pasteConfigClose) pasteConfigClose.onclick = closePasteConfigModal;
  if (pasteConfigCancel) pasteConfigCancel.onclick = closePasteConfigModal;
  if (pasteConfigOverlay) {
    pasteConfigOverlay.onclick = (e) => {
      if (e.target === pasteConfigOverlay) closePasteConfigModal();
    };
  }
  if (pasteConfigApply) pasteConfigApply.onclick = applyPastedConfig;

  window.addEventListener("load", () => {
    searchInput.focus();
  });

  if (electronAPI?.onFocusSearch) {
    electronAPI.onFocusSearch(() => {
      searchInput.focus();
      searchInput.select();
    });
  }

  if (electronAPI?.onAutoBackup) {
    electronAPI.onAutoBackup((fileName) => {
      if (fileName) {
        showToast(`已自动备份：${fileName}`);
      } else {
        showToast("已自动备份");
      }
    });
  }
});
