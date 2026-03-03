let allProducts = [];
let currentGroup = "ALL";
let currentSub = "";
let searchText = "";

/* ---------- URL / HISTORY HELPERS ---------- */
function setUrlFromState(push = true) {
  const url = new URL(window.location.href);

  if (currentGroup && currentGroup !== "ALL") url.searchParams.set("group", currentGroup);
  else url.searchParams.delete("group");

  if (currentSub) url.searchParams.set("sub", currentSub);
  else url.searchParams.delete("sub");

  if (searchText) url.searchParams.set("q", searchText);
  else url.searchParams.delete("q");

  const state = { group: currentGroup, sub: currentSub, q: searchText };

  if (push) history.pushState(state, "", url.toString());
  else history.replaceState(state, "", url.toString());
}

function readStateFromUrl() {
  const url = new URL(window.location.href);
  const g = (url.searchParams.get("group") || "").trim();
  const s = (url.searchParams.get("sub") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();

  currentGroup = g ? g : "ALL";
  currentSub = s ? s : "";
  searchText = q ? q.toLowerCase() : "";

  const input = document.getElementById("searchInput");
  if (input) input.value = q || "";

  setCurrentFilterText(
    currentGroup === "ALL"
      ? "Tümü"
      : (currentSub ? `${currentGroup} > ${currentSub}` : currentGroup)
  );

  applyFilters(false);
}

/* Geri/ileri tuşu */
window.addEventListener("popstate", () => {
  readStateFromUrl();
});

/* ---------- JSON yükle ---------- */
fetch("products.json")
  .then(res => res.json())
  .then(data => {
    allProducts = Array.isArray(data) ? data : [];
    buildMenu();

    readStateFromUrl();
    setUrlFromState(false);
  })
  .catch(err => console.error("products.json okunamadı:", err));

/* ---------- Arama ---------- */
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", function () {
    searchText = this.value.toLowerCase().trim();
    applyFilters(true);
  });
}

/* ---------- Menü aç/kapat ---------- */
const productsBtn = document.getElementById("productsBtn");
const productsMenu = document.getElementById("productsMenu");
const menuClose = document.getElementById("menuClose");

function openMenu() {
  if (!productsMenu || !productsBtn) return;
  productsMenu.classList.add("open");
  productsMenu.setAttribute("aria-hidden", "false");
  productsBtn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  if (!productsMenu || !productsBtn) return;
  productsMenu.classList.remove("open");
  productsMenu.setAttribute("aria-hidden", "true");
  productsBtn.setAttribute("aria-expanded", "false");
}

if (productsBtn) {
  productsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    productsMenu.classList.contains("open") ? closeMenu() : openMenu();
  });
}
if (menuClose) menuClose.addEventListener("click", closeMenu);

document.addEventListener("click", (e) => {
  if (!productsMenu) return;
  const wrap = e.target.closest(".menu-wrap");
  if (!wrap) closeMenu();
});

/* ---------- Menü: Grup -> alt grup ---------- */
function buildMenu() {
  const menuBody = document.getElementById("menuBody");
  if (!menuBody) return;

  // ✅ Menüde de products.json sırasını korumak için:
  // groupOrder ve subOrder set gibi çalışır (ilk göründüğü sıra)
  const groupOrder = [];
  const subOrderMap = new Map();

  allProducts.forEach(p => {
    const g = (p.group || "").trim();
    const s = (p.subcategory || "").trim();
    if (!g) return;

    if (!subOrderMap.has(g)) {
      subOrderMap.set(g, []);
      groupOrder.push(g);
    }

    if (s) {
      const arr = subOrderMap.get(g);
      if (!arr.includes(s)) arr.push(s);
    }
  });

  menuBody.innerHTML = `
    <div class="menu-top">
      <button class="menu-all" id="showAllBtn" type="button">Tümü (Genel)</button>
    </div>
  `;

  const showAllBtn = document.getElementById("showAllBtn");
  if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
      currentGroup = "ALL";
      currentSub = "";
      setCurrentFilterText("Tümü");
      applyFilters(true);
      closeMenu();
    });
  }

  groupOrder.forEach(groupName => {
    const subs = subOrderMap.get(groupName) || [];

    const item = document.createElement("div");
    item.className = "group-item";

    item.innerHTML = `
      <div class="group-row" data-role="selectGroup">
        <div class="group-name">${escapeHtml(groupName)}</div>
        <button class="group-toggle" type="button" data-role="toggleSubs" aria-label="Alt gruplar">▾</button>
      </div>
      <div class="sub-list">
        ${subs.map(s => `<button class="sub-item" type="button" data-sub="${escapeHtmlAttr(s)}">${escapeHtml(s)}</button>`).join("")}
      </div>
    `;

    const row = item.querySelector('[data-role="selectGroup"]');
    const toggleBtn = item.querySelector('[data-role="toggleSubs"]');
    const subList = item.querySelector(".sub-list");

    row.addEventListener("click", (e) => {
      if (e.target && e.target.closest('[data-role="toggleSubs"]')) return;
      currentGroup = groupName;
      currentSub = "";
      setCurrentFilterText(groupName);
      applyFilters(true);
      closeMenu();
    });

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      subList.classList.toggle("open");
    });

    item.querySelectorAll(".sub-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sub = btn.getAttribute("data-sub") || "";
        currentGroup = groupName;
        currentSub = sub;
        setCurrentFilterText(`${groupName} > ${sub}`);
        applyFilters(true);
        closeMenu();
      });
    });

    menuBody.appendChild(item);
  });
}

/* ---------- Filtre metni ---------- */
function setCurrentFilterText(text) {
  const el = document.getElementById("currentFilterText");
  if (el) el.textContent = text || "Tümü";
}

/* ---------- Filtre uygula ---------- */
function applyFilters(pushHistory = true) {
  let filtered = allProducts;

  if (currentGroup !== "ALL") {
    filtered = filtered.filter(p => (p.group || "").trim() === currentGroup);
  }

  if (currentSub) {
    filtered = filtered.filter(p => (p.subcategory || "").trim() === currentSub);
  }

  if (searchText) {
    filtered = filtered.filter(p => {
      const name = (p.name || "").toLowerCase();
      const code = (p.code || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const group = (p.group || "").toLowerCase();
      const sub = (p.subcategory || "").toLowerCase();
      return (
        name.includes(searchText) ||
        code.includes(searchText) ||
        brand.includes(searchText) ||
        group.includes(searchText) ||
        sub.includes(searchText)
      );
    });
  }

  renderCatalogKeepJsonOrder(filtered);

  if (pushHistory) setUrlFromState(true);
}

/* ---------- ✅ KATALOG: products.json sırasını KORU ---------- */
function renderCatalogKeepJsonOrder(products) {
  const root = document.getElementById("productGrid");
  if (!root) return;

  root.innerHTML = "";

  // groupOrder: grup ilk göründüğü sırayla
  const groupOrder = [];
  // subOrderMap: alt gruplar ilk göründüğü sırayla
  const subOrderMap = new Map();
  // itemsMap: group -> sub -> items (ürünler de JSON sırasıyla push)
  const itemsMap = new Map();

  products.forEach(p => {
    const g = (p.group || "GRUPSUZ").trim() || "GRUPSUZ";
    const s = (p.subcategory || "ALT GRUP YOK").trim() || "ALT GRUP YOK";

    if (!itemsMap.has(g)) {
      itemsMap.set(g, new Map());
      groupOrder.push(g);
      subOrderMap.set(g, []);
    }

    const subList = subOrderMap.get(g);
    if (!subList.includes(s)) subList.push(s);

    const subMap = itemsMap.get(g);
    if (!subMap.has(s)) subMap.set(s, []);
    subMap.get(s).push(p); // ✅ burada JSON sırası korunur
  });

  groupOrder.forEach(groupName => {
    const groupSection = document.createElement("section");
    groupSection.className = "cat-group";
    groupSection.innerHTML = `<div class="cat-group-title">${escapeHtml(groupName)}</div>`;

    const subs = subOrderMap.get(groupName) || [];
    const subMap = itemsMap.get(groupName) || new Map();

    subs.forEach(subName => {
      const subWrap = document.createElement("div");
      subWrap.className = "cat-sub";
      subWrap.innerHTML = `
        <div class="cat-sub-title">${escapeHtml(subName)}</div>
        <div class="grid"></div>
      `;

      const grid = subWrap.querySelector(".grid");
      const items = subMap.get(subName) || [];

      items.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";

        const imgSrc = p.image ? `images/${p.image}` : "images/placeholder.png";

        card.innerHTML = `
          <img src="${imgSrc}" alt="" onerror="this.src='images/placeholder.png'">
          <div class="name">${escapeHtml(p.name || "")}</div>
          <div class="code">${escapeHtml(p.code || "")}</div>
          <div class="brand">${escapeHtml(p.brand || "")}</div>
        `;

        card.addEventListener("click", () => {
          const ref = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `product.html?id=${encodeURIComponent(p.id)}&ref=${ref}`;
        });

        grid.appendChild(card);
      });

      groupSection.appendChild(subWrap);
    });

    root.appendChild(groupSection);
  });

  if (products.length === 0) {
    root.innerHTML = `<div style="padding:20px;color:#666;">Bu filtrede ürün bulunamadı.</div>`;
  }
}

/* ---------- helpers ---------- */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeHtmlAttr(str) {
  return escapeHtml(str).replaceAll('"', "&quot;");
}

/* ---------- Logo: anasayfaya dön (Tümü) ---------- */
const homeLogoBtn = document.getElementById("homeLogoBtn");
if (homeLogoBtn) {
  homeLogoBtn.addEventListener("click", () => {
    currentGroup = "ALL";
    currentSub = "";
    searchText = "";

    const input = document.getElementById("searchInput");
    if (input) input.value = "";

    setCurrentFilterText("Tümü");
    applyFilters(true);
    closeMenu();
  });
}