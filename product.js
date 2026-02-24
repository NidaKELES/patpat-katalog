const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const from = params.get("from"); // index'ten geldiğimiz sayfa (filtre/arama ile)

const backLink = document.getElementById("backLink");
if (backLink) {
  backLink.href = from ? decodeURIComponent(from) : "index.html";
  backLink.addEventListener("click", (e) => {
    // Eğer kullanıcı tarayıcı geçmişi ile geldiyse daha doğal dönüş:
    if (window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  });
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
    } else {
      img.src = "images/placeholder.png";
    }
  })
  .catch(err => console.error(err));