let allProducts = [];
let currentGroup = "ALL";
let currentSub = "";
let currentSubSub = "";
let searchText = "";

// JSON'u yükle
fetch("products.json")
  .then(res => res.json())
  .then(data => {
    allProducts = data;
    buildMegaMenu();
    applyFilters();
  })
  .catch(err => console.error("products.json okunamadı:", err));

/* =========================
   ARAMA
========================= */
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", function () {
    searchText = this.value.toLowerCase().trim();
    applyFilters();
  });
}

/* =========================
   ÜRÜNLER (MEGA MENÜ)
========================= */
const menuBtn = document.getElementById("menuBtn");
const megaMenu = document.getElementById("megaMenu");
const menuWrap = document.getElementById("menuWrap");

const menuGroups = document.getElementById("menuGroups");
const menuSubs = document.getElementById("menuSubs");
const menuSubSubs = document.getElementById("menuSubSubs");

if (menuBtn && megaMenu) {
  menuBtn.addEventListener("click", () => {
    megaMenu.classList.toggle("open");
  });

  // Dışarı tıklayınca kapat
  document.addEventListener("click", (e) => {
    if (!menuWrap.contains(e.target)) {
      megaMenu.classList.remove("open");
    }
  });
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function buildMegaMenu() {
  if (!menuGroups || !menuSubs || !menuSubSubs) return;

  // 1) Gruplar
  const groups = uniq(allProducts.map(p => p.group));
  menuGroups.innerHTML = "";

  // "GENEL" = ALL
  menuGroups.appendChild(makeMenuItem("GENEL", true, () => {
    currentGroup = "ALL";
    currentSub = "";
    currentSubSub = "";
    setActive(menuGroups, "GENEL");
    menuSubs.innerHTML = "";
    menuSubSubs.innerHTML = "";
    applyFilters();
    megaMenu.classList.remove("open");
  }, false));

  groups.forEach(g => {
    const hasNext = true;
    menuGroups.appendChild(makeMenuItem(g, false, () => {
      currentGroup = g;
      currentSub = "";
      currentSubSub = "";
      setActive(menuGroups, g);
      populateSubs(g);
      menuSubSubs.innerHTML = "";
      applyFilters();
      // mega kapanmasın, kullanıcı alt gruba geçsin
    }, hasNext));
  });
}

function populateSubs(group) {
  const subs = uniq(allProducts.filter(p => p.group === group).map(p => p.subcategory));
  menuSubs.innerHTML = "";
  menuSubSubs.innerHTML = "";

  subs.forEach(sub => {
    // Bu sub altında 3.seviye var mı?
    const hasSubSub = allProducts.some(p =>
      p.group === group &&
      p.subcategory === sub &&
      (p.subsubcategory && String(p.subsubcategory).trim() !== "")
    );

    menuSubs.appendChild(makeMenuItem(sub, false, () => {
      currentSub = sub;
      currentSubSub = "";
      setActive(menuSubs, sub);

      if (hasSubSub) {
        populateSubSubs(group, sub); // sağ kolonu doldur
      } else {
        menuSubSubs.innerHTML = "";
        // 3.seviye yoksa direkt filtre uygula ve menüyü kapat
        applyFilters();
        megaMenu.classList.remove("open");
      }
    }, hasSubSub));
  });
}

function populateSubSubs(group, sub) {
  const subsubs = uniq(
    allProducts
      .filter(p => p.group === group && p.subcategory === sub)
      .map(p => p.subsubcategory)
  );

  menuSubSubs.innerHTML = "";

  subsubs.forEach(ss => {
    menuSubSubs.appendChild(makeMenuItem(ss, false, () => {
      // TARAL’dan “sağa basınca” işte burası: 3.seviyeyi seçiyorsun
      currentSubSub = ss;
      setActive(menuSubSubs, ss);
      applyFilters();
      megaMenu.classList.remove("open"); // seçince kapansın
    }, false));
  });
}

function makeMenuItem(text, active, onClick, showArrow) {
  const li = document.createElement("li");
  li.className = "mega-item" + (active ? " active" : "");
  li.dataset.val = text;

  li.innerHTML = `
    <span>${text}</span>
    ${showArrow ? `<span class="mega-arrow">›</span>` : `<span></span>`}
  `;

  li.addEventListener("click", onClick);
  return li;
}

function setActive(listEl, val) {
  listEl.querySelectorAll(".mega-item").forEach(x => x.classList.remove("active"));
  const target = listEl.querySelector(`.mega-item[data-val="${cssEscape(val)}"]`);
  if (target) target.classList.add("active");
}

// basit escape
function cssEscape(str) {
  return String(str).replace(/"/g, '\\"');
}

/* =========================
   FİLTRE + RENDER
========================= */
function applyFilters() {
  let filtered = allProducts;

  // group
  if (currentGroup !== "ALL") {
    filtered = filtered.filter(p => p.group === currentGroup);
  }

  // subcategory
  if (currentSub) {
    filtered = filtered.filter(p => p.subcategory === currentSub);
  }

  // subsubcategory (3.seviye)
  if (currentSubSub) {
    filtered = filtered.filter(p => (p.subsubcategory || "") === currentSubSub);
  }

  // arama
  if (searchText) {
    filtered = filtered.filter(p => {
      const name = (p.name || "").toLowerCase();
      const code = (p.code || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const sub = (p.subcategory || "").toLowerCase();
      const ss = (p.subsubcategory || "").toLowerCase();
      return (
        name.includes(searchText) ||
        code.includes(searchText) ||
        brand.includes(searchText) ||
        sub.includes(searchText) ||
        ss.includes(searchText)
      );
    });
  }

  renderProducts(filtered);
}

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
      <div class="name">${p.name || ""}</div>
      <div class="code">${p.code || ""}</div>
      <div class="brand">${p.brand || ""}</div>
    `;

    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${encodeURIComponent(p.id)}`;
    });

    grid.appendChild(card);
  });
}