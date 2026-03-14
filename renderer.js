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

async function loadPrompts() {
  try {
    assertElectron();
    const stored = await electronAPI.getPrompts();
    if (!Array.isArray(stored) || stored.length === 0) {
      return DEFAULT_PROMPTS.slice();
    }
    return stored;
  } catch {
    return DEFAULT_PROMPTS.slice();
  }
}

async function persistPrompts(list) {
  assertElectron();
  await electronAPI.setPrompts(list);
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

document.addEventListener("DOMContentLoaded", () => {
  const navItemsContainer = document.getElementById("sidebar");
  const cardGrid = document.getElementById("cardGrid");
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const modal = document.getElementById("modalOverlay");
  const modalTitle = modal.querySelector("h2");
  const settingsBtn = document.getElementById("settingsBtn");

  const previewPanel = document.getElementById("previewPanel");
  const previewTitle = document.getElementById("previewTitle");
  const previewBody = document.getElementById("previewBody");
  const previewTag = document.getElementById("previewTag");
  const previewCopy = document.getElementById("previewCopy");
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
  const moreMenu = document.getElementById("moreMenu");
  const webdavOverlay = document.getElementById("webdavOverlay");
  const webdavUrl = document.getElementById("webdavUrl");
  const webdavUsername = document.getElementById("webdavUsername");
  const webdavPassword = document.getElementById("webdavPassword");
  const webdavDir = document.getElementById("webdavDir");
  const webdavConfigJson = document.getElementById("webdavConfigJson");
  const webdavRestorePath = document.getElementById("webdavRestorePath");
  const webdavTest = document.getElementById("webdavTest");
  const webdavCopyConfig = document.getElementById("webdavCopyConfig");
  const webdavApplyConfig = document.getElementById("webdavApplyConfig");
  const webdavBackup = document.getElementById("webdavBackup");
  const webdavRestore = document.getElementById("webdavRestore");
  const webdavClose = document.getElementById("webdavClose");

  let allPrompts = [];
  let editingIndex = null;
  let selectedIndex = null;

  (async () => {
    allPrompts = await loadPrompts();
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
    if (e.target === settingsBtn) return;
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

  async function saveWebdavConfig() {
    if (!electronAPI?.setWebdavConfig) return;
    const config = {
      url: webdavUrl?.value?.trim() || "",
      username: webdavUsername?.value?.trim() || "",
      password: webdavPassword?.value || "",
      directory: webdavDir?.value?.trim() || "prompt-master-backups",
    };
    await electronAPI.setWebdavConfig(config);
    return config;
  }

  function openWebdavModal() {
    if (!webdavOverlay) return;
    webdavOverlay.style.display = "flex";
  }

  function closeWebdavModal() {
    if (!webdavOverlay) return;
    webdavOverlay.style.display = "none";
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

  function renderAll() {
    updateSidebarAndDropdown();
    renderCards();
  }

  function applyPreviewTheme(item) {
    if (!previewPanel) return;
    const base = item ? `${item.name || ""}|${item.tag || ""}` : "default";
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
    if (previewTitle) previewTitle.textContent = "选择一个提示词";
    if (previewBody) previewBody.textContent = "在左侧选择一个卡片，这里会展示完整内容。";
    if (previewTag) previewTag.textContent = "标签";
    if (previewPanel) previewPanel.style.opacity = "0.9";
    applyPreviewTheme(null);
    if (resultCount) resultCount.textContent = "0";
  }

  function updatePreview(item) {
    if (!item) return;
    if (previewTitle) previewTitle.textContent = item.name || "未命名";
    if (previewBody) previewBody.textContent = item.content || "";
    if (previewTag) previewTag.textContent = item.tag || "默认";
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
    const tags = [
      ...new Set(
        allPrompts.map((p) => p.tag).filter((t) => t && t.trim() !== ""),
      ),
    ];

    if (tags.length === 0) {
      tagDropdown.innerHTML =
        '<div style="padding: 10px; color: #94a3b8; font-size: 12px; text-align: center;">暂无已有标签</div>';
    } else {
      tagDropdown.innerHTML = tags
        .map(
          (tag) => `
                <div class="tag-option" style="padding: 10px 12px; cursor: pointer; font-size: 14px; color: #475569; transition: background 0.2s;">
                    ${tag}
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
      allPrompts.length,
      currentFilter === "all",
    );
    navItemsContainer.insertBefore(allLink, document.getElementById("addTagBtn"));

    tags.forEach((tag) => {
      const count = allPrompts.filter((p) => p.tag === tag).length;
      const tagLink = createNavLink(tag, tag, count, currentFilter === tag);
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
    });
  }

  function createNavLink(filter, text, count, isActive) {
    const a = document.createElement("a");
    a.href = "#";
    a.className = `nav-item ${isActive ? "active" : ""}`;
    a.dataset.filter = filter;
    a.style.display = "flex";
    a.style.alignItems = "center";
    a.style.justifyContent = "space-between";
    a.innerHTML = `<span>${text}</span><span style="font-size: 10px; opacity: 0.6; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 10px;">${count}</span>`;
    return a;
  }

  async function saveData() {
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
    const displayList = [...allPrompts]
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    displayList.forEach((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term);
      const matchesCategory =
        activeFilter === "all" || item.tag === activeFilter;

      if (matchesSearch && matchesCategory) {
        visibleCount += 1;
        const card = document.createElement("div");
        card.className = "card";
        if (item.isPinned) {
          card.style.border = "2px solid #0a84ff";
          card.style.boxShadow = "0 4px 12px rgba(10, 132, 255, 0.18)";
          card.style.backgroundColor = "#f4f7ff";
          card.classList.add("pinned-card");
        }

        card.tabIndex = 0;
        card.dataset.originalIndex = item.originalIndex;
        card.addEventListener("mouseenter", () => selectCard(item.originalIndex, true));
        card.addEventListener("focus", () => selectCard(item.originalIndex, true));

        card.onkeydown = (e) => {
          const cards = document.querySelectorAll(".card");
          const currentIndex = Array.from(cards).indexOf(card);

          if (e.key === "Enter") {
            selectCard(item.originalIndex);
            card.click();
          } else if (e.key === "ArrowRight" || e.key === "Tab") {
            if (currentIndex < cards.length - 1) {
              cards[currentIndex + 1].focus();
              e.preventDefault();
            }
          } else if (e.key === "ArrowLeft") {
            if (currentIndex > 0) {
              cards[currentIndex - 1].focus();
              e.preventDefault();
            }
          }
        };

        card.innerHTML = `
          <div class="card-header">
            <div>
              <div class="card-title">${item.name}</div>
              <div class="card-body">${item.content}</div>
            </div>
            <div class="card-actions">
              <span class="card-meta">
                <span class="card-tag">${item.tag || "默认"}</span>
              </span>
              <button class="copy-btn" title="复制并隐藏" data-index="${item.originalIndex}">Copy</button>
              <button class="pin-btn" data-index="${item.originalIndex}" style="color: ${item.isPinned ? "#0a84ff" : "#9a9aa0"};">Pin</button>
              <button class="edit-btn" data-index="${item.originalIndex}">Edit</button>
              <button class="delete-btn" data-index="${item.originalIndex}">Del</button>
            </div>
          </div>
        `;

        card.onclick = async (e) => {
          if (
            ["pin-btn", "edit-btn", "delete-btn", "copy-btn"].some((cls) =>
              e.target.classList.contains(cls),
            )
          ) {
            return;
          }

          const copied = await copyText(item.content);
          if (!copied) {
            console.error("复制失败");
            showToast("复制失败，请手动复制");
            return;
          }

          card.style.boxShadow = "0 0 0 3px rgba(10, 132, 255, 0.2)";
          setTimeout(() => (card.style.boxShadow = ""), 500);
          showToast("已复制，窗口已隐藏");

          card.style.backgroundColor = "rgba(10, 132, 255, 0.12)";
          setTimeout(() => {
            card.style.backgroundColor = item.isPinned ? "rgba(10, 132, 255, 0.08)" : "white";
          }, 200);

          closeCurrentWindowSilently();
          selectCard(item.originalIndex);
        };
        cardGrid.appendChild(card);
      }
    });

    if (resultCount) {
      resultCount.textContent = String(visibleCount);
    }
    if (selectedIndex === null || !displayList.some((i) => i.originalIndex === selectedIndex)) {
      if (displayList.length > 0) {
        selectCard(displayList[0].originalIndex);
      } else {
        clearPreview();
      }
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

    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.index);
        const data = allPrompts[idx];
        if (!data) return;

        const copied = await copyText(data.content);
        if (!copied) {
          showToast("复制失败，请手动复制");
          return;
        }

        const card = btn.closest(".card");
        if (card) {
          card.style.boxShadow = "0 0 0 3px rgba(10, 132, 255, 0.2)";
          setTimeout(() => (card.style.boxShadow = ""), 500);
        }
        showToast("已复制，窗口已隐藏");
        closeCurrentWindowSilently();
      };
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        editingIndex = Number(btn.dataset.index);
        const data = allPrompts[editingIndex];
        selectCard(editingIndex);
        document.getElementById("newName").value = data.name;
        document.getElementById("newTag").value = data.tag;
        document.getElementById("newContent").value = data.content;
        modalTitle.innerText = "编辑提示词";
        modal.style.display = "flex";
      };
    });
  }

  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
      clearSearchBtn.style.display = "flex";
    } else {
      clearSearchBtn.style.display = "none";
    }
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

  clearSearchBtn.onclick = () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    searchInput.focus();
    renderCards();
  };

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

  if (menuWebdav) menuWebdav.onclick = () => {
    showToast("WebDAV 同步待配置");
    if (moreMenu) moreMenu.style.display = "none";
  };

  if (menuImport) menuImport.onclick = async () => {
    try {
      assertElectron();
      const result = await electronAPI.importPrompts();
      if (result?.canceled) return;
      const parsed = JSON.parse(result.raw);
      if (!Array.isArray(parsed)) {
        alert("文件格式错误：必须是数组");
        return;
      }
      allPrompts = parsed;
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

  if (previewCopy) {
    previewCopy.onclick = async () => {
      if (selectedIndex === null) return;
      const item = allPrompts[selectedIndex];
      if (!item) return;
      const copied = await copyText(item.content);
      if (copied) {
        showToast("已复制，窗口已隐藏");
        closeCurrentWindowSilently();
      }
    };
  }

  if (previewEdit) {
    previewEdit.onclick = () => {
      if (selectedIndex === null) return;
      const data = allPrompts[selectedIndex];
      if (!data) return;
      editingIndex = selectedIndex;
      document.getElementById("newName").value = data.name;
      document.getElementById("newTag").value = data.tag;
      document.getElementById("newContent").value = data.content;
      modalTitle.innerText = "编辑提示词";
      modal.style.display = "flex";
    };
  }

    window.addEventListener("load", () => {
    searchInput.focus();
  });

  if (electronAPI?.onFocusSearch) {
    electronAPI.onFocusSearch(() => {
      searchInput.focus();
      searchInput.select();
    });
  }
});
