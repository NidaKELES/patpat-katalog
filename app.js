let allProducts = [];
let currentGroup = "ALL";
let searchText = "";

// JSON'u yükle
fetch("products.json")
  .then(res => res.json())
  .then(data => {
    allProducts = data;
    createFilters();
    applyFilters();
  })
  .catch(err => console.error("products.json okunamadı:", err));

function createFilters() {
  const filterDiv = document.getElementById("filters");
  if (!filterDiv) return;

  filterDiv.innerHTML = "";

  const allBtn = createButton("ALL");
  allBtn.classList.add("active");
  filterDiv.appendChild(allBtn);

  const groups = [...new Set(allProducts.map(p => p.group).filter(Boolean))];

  groups.forEach(group => {
    const btn = createButton(group);
    filterDiv.appendChild(btn);
  });
}

function createButton(group) {
  const btn = document.createElement("button");
  btn.innerText = group === "ALL" ? "GENEL" : group;

  btn.addEventListener("click", () => {
    currentGroup = group;

    document.querySelectorAll("#filters button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    applyFilters();
  });

  return btn;
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", function () {
    searchText = this.value.toLowerCase().trim();
    applyFilters();
  });
}

function applyFilters() {
  let filtered = allProducts;

  if (currentGroup !== "ALL") {
    filtered = filtered.filter(p => p.group === currentGroup);
  }

  if (searchText) {
    filtered = filtered.filter(p => {
      const name = (p.name || "").toLowerCase();
      const code = (p.code || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const sub = (p.subcategory || "").toLowerCase();
      return (
        name.includes(searchText) ||
        code.includes(searchText) ||
        brand.includes(searchText) ||
        sub.includes(searchText)
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

    const imgSrc = p.image ? `images/${p.image}` : "";

    card.innerHTML = `
      ${imgSrc ? `<img src="${imgSrc}" alt="">` : ""}
      <div class="name">${p.name || ""}</div>
      <div class="code">${p.code || ""}</div>
      <div class="brand">${p.brand || ""}</div>
    `;

    card.addEventListener("click", () => {
      alert(
        "ÜRÜN DETAYI\n\n" +
        "Ürün: " + (p.name || "") + "\n" +
        "Kod: " + (p.code || "") + "\n" +
        "Marka: " + (p.brand || "") + "\n" +
        "Grup: " + (p.group || "") + "\n" +
        "Alt Grup: " + (p.subcategory || "")
      );
    });

    grid.appendChild(card);
  });
}