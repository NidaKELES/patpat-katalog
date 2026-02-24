let allProducts = [];
let currentGroup = "ALL";
let currentSub = "";
let searchText = "";

/* JSON yükle */
fetch("products.json")
  .then(res => res.json())
  .then(data => {
    allProducts = Array.isArray(data) ? data : [];
    buildMenu();
    applyFilters();
  })
  .catch(err => console.error("products.json okunamadı:", err));

/* Arama */
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", function () {
    searchText = this.value.toLowerCase().trim();
    applyFilters();
  });
}

/* Menü aç/kapat */
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

/* Menü: Grup -> alt grup (altlar altta açılır) */
function buildMenu() {
  const menuBody = document.getElementById("menuBody");
  if (!menuBody) return;

  // group -> Set(subcategory)
  const map = new Map();
  allProducts.forEach(p => {
    const g = (p.group || "").trim();
    const s = (p.subcategory || "").trim();
    if (!g) return;
    if (!map.has(g)) map.set(g, new Set());
    if (s) map.get(g).add(s);
  });

  const groups = Array.from(map.keys()).sort((a,b) => a.localeCompare(b, "tr"));

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
      applyFilters();
      closeMenu();
    });
  }

  groups.forEach(groupName => {
    const subs = Array.from(map.get(groupName)).sort((a,b) => a.localeCompare(b, "tr"));

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

    // Grup adına tıkla = grubu seç
    row.addEventListener("click", (e) => {
      // toggle butona basıldıysa burada seçme yapmayalım
      if (e.target && e.target.closest('[data-role="toggleSubs"]')) return;

      currentGroup = groupName;
      currentSub = "";
      setCurrentFilterText(groupName);
      applyFilters();
      closeMenu();
    });

    // ok butonu = altları aç/kapat (kibar)
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      subList.classList.toggle("open");
    });

    // Alt gruba tıkla = alt grubu seç
    item.querySelectorAll(".sub-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sub = btn.getAttribute("data-sub") || "";
        currentGroup = groupName;
        currentSub = sub;
        setCurrentFilterText(`${groupName} > ${sub}`);
        applyFilters();
        closeMenu();
      });
    });

    menuBody.appendChild(item);
  });
}

/* Filtre metni */
function setCurrentFilterText(text) {
  const el = document.getElementById("currentFilterText");
  if (el) el.textContent = text || "Tümü";
}

/* Filtre uygula */
function applyFilters() {
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

  renderProducts(filtered);
}

/* Ürünleri bas */
function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  products.forEach(p => {
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
      window.location.href = `product.html?id=${encodeURIComponent(p.id)}`;
    });

    grid.appendChild(card);
  });
}

/* küçük güvenli html helpers */
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