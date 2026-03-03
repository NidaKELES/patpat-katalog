const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const ref = params.get("ref");

const backLink = document.getElementById("backLink");
if (backLink) {
  if (ref) backLink.href = decodeURIComponent(ref);
  else backLink.href = "index.html";
}

fetch("products.json")
  .then(res => res.json())
  .then(products => {
    const product = (products || []).find(p => p.id === productId);
    if (!product) return;

    document.getElementById("detailName").innerText = product.name || "";
    document.getElementById("detailCode").innerText = product.code || "";
    document.getElementById("detailBrand").innerText = product.brand || "";
    document.getElementById("detailGroup").innerText = product.group || "";
    document.getElementById("detailSub").innerText = product.subcategory || "";

    const img = document.getElementById("detailImage");
    if (product.image) {
      img.src = `images/${product.image}`;
      img.onerror = () => { img.src = "images/placeholder.png"; };
    }
  })
  .catch(err => console.error(err));