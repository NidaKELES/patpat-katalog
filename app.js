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
    if (productsMenu.classList.contains("open")) closeMenu();
    else openMenu();
  });
}
if (menuClose) menuClose.addEventListener("click", closeMenu);

document.addEventListener("click", (e) => {
  if (!productsMenu) return;
  const wrap = e.target.closest(".menu-wrap");
  if (!wrap) closeMenu();
});

/* Menü içeriği: Grup -> Alt grup */
function buildMenu() {
  const menuBody = document.getElementById("menuBody");
  if (!menuBody) return;

  // Grup -> Set(subcategory)
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
    <div class="top-actions">
      <button class="small-btn secondary" id="showAllBtn" type="button">Tümü (Genel)</button>
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
      <div class="group-row">
        <div class="group-name">${escapeHtml(groupName)}</div>
        <div class="group-actions">
          <button class="small-btn" data-action="selectGroup" type="button">Seç</button>
          <button class="small-btn secondary" data-action="toggleSubs" type="button">Alt ▾</button>
        </div>
      </div>
      <div class="sub-list">
        ${subs.map(s => `<button class="sub-item" type="button" data-sub="${escapeHtmlAttr(s)}">${escapeHtml(s)}</button>`).join("")}
      </div>
    `;

    // Seç / Alt aç-kapa
    const selectBtn = item.querySelector('[data-action="selectGroup"]');
    const toggleBtn = item.querySelector('[data-action="toggleSubs"]');
    const subList = item.querySelector(".sub-list");

    if (selectBtn) {
      selectBtn.addEventListener("click", () => {
        currentGroup = groupName;
        currentSub = "";
        setCurrentFilterText(groupName);
        applyFilters();
        closeMenu();
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        subList.classList.toggle("open");
      });
    }

    // Alt gruba tık
    item.querySelectorAll(".sub-item").forEach(btn => {
      btn.addEventListener("click", () => {
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

  // Grup filtresi
  if (currentGroup !== "ALL") {
    filtered = filtered.filter(p => (p.group || "").trim() === currentGroup);
  }

  // Alt grup filtresi
  if (currentSub) {
    filtered = filtered.filter(p => (p.subcategory || "").trim() === currentSub);
  }

  // Arama filtresi
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