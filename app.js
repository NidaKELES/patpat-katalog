let allProducts = [];
let currentGroup = "ALL";
let currentSub = "";
let searchText = "";

// JSON yükle
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
  const wrap = e.target.closest(".menu-wrap");
  if (!wrap) closeMenu();
});

/* Menü içeriği: Grup -> Alt grup (hover sağda göster) */
function buildMenu() {
  const groupsList = document.getElementById("groupsList");
  const subsList = document.getElementById("subsList");
  const subsTitle = document.getElementById("subsTitle");
  const showAllBtn = document.getElementById("showAllBtn");

  if (!groupsList || !subsList || !subsTitle) return;

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

  // Genel
  if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
      currentGroup = "ALL";
      currentSub = "";
      setCurrentFilterText("Tümü");
      applyFilters();
      closeMenu();
      clearSubsPanel(subsList, subsTitle);
      setActiveGroupButton(null);
    });
  }

  groupsList.innerHTML = "";

  groups.forEach(groupName => {
    const btn = document.createElement("button");
    btn.className = "group-btn";
    btn.type = "button";
    btn.dataset.group = groupName;
    btn.innerHTML = `<span>${escapeHtml(groupName)}</span><span class="arrow">›</span>`;

    // WEB: üstüne gelince altları sağda göster
    btn.addEventListener("mouseenter", () => {
      populateSubsPanel(groupName, map, subsList, subsTitle);
      setActiveGroupButton(groupName);
    });

    // MOBİL: hover yok -> tıklayınca sağ panel doldursun
    btn.addEventListener("click", () => {
      populateSubsPanel(groupName, map, subsList, subsTitle);
      setActiveGroupButton(groupName);
      // Eğer kullanıcı direkt grubu seçmek isterse: ikinci tıkla kapatmak yerine
      // alt gruptan seçmesi daha iyi; o yüzden burada filtreyi hemen uygulamıyoruz.
      // İstersen buraya "gruba tıkla direkt filtrele" de ekleriz.
    });

    groupsList.appendChild(btn);
  });

  // Sayfa ilk açılışta sağ panel boş
  clearSubsPanel(subsList, subsTitle);
}

function populateSubsPanel(groupName, map, subsList, subsTitle) {
  const subs = Array.from(map.get(groupName) || []).sort((a,b) => a.localeCompare(b, "tr"));
  subsTitle.textContent = `${groupName} / Alt Gruplar`;

  if (subs.length === 0) {
    subsList.innerHTML = `<div class="panel-empty">Bu grupta alt grup yok.</div>`;
    return;
  }

  subsList.innerHTML = "";
  subs.forEach(sub => {
    const b = document.createElement("button");
    b.className = "sub-btn";
    b.type = "button";
    b.textContent = sub;

    // Alt gruba tıklayınca filtre uygula + menüyü kapat
    b.addEventListener("click", () => {
      currentGroup = groupName;
      currentSub = sub;
      setCurrentFilterText(`${groupName} > ${sub}`);
      applyFilters();
      closeMenu();
    });

    subsList.appendChild(b);
  });
}

function clearSubsPanel(subsList, subsTitle) {
  subsTitle.textContent = "Alt Gruplar";
  subsList.innerHTML = `<div class="panel-empty">Bir grup seçin.</div>`;
}

function setActiveGroupButton(groupName) {
  document.querySelectorAll(".group-btn").forEach(b => b.classList.remove("active"));
  if (!groupName) return;
  const target = document.querySelector(`.group-btn[data-group="${cssEscape(groupName)}"]`);
  if (target) target.classList.add("active");
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

/* helpers */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function cssEscape(str) {
  return String(str).replace(/"/g, '\\"');
}