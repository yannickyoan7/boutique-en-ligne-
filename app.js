const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[char]));

let products = [];
let currentProducts = [];
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("samira_cart") || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}
let toastTimer;

function saveCart() {
  localStorage.setItem("samira_cart", JSON.stringify(cart));
  renderCart();
}
function showToast(message) {
  const t = $("#toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2300);
}
function renderProducts() {
  const grid = $("#productGrid");
  grid.innerHTML = "";
  if (!currentProducts.length) {
    $("#emptyState").textContent = "Aucun produit disponible pour le moment.";
    $("#emptyState").classList.remove("hidden");
    return;
  }
  $("#emptyState").classList.add("hidden");
  currentProducts.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    const unavailable = p.stock !== null && p.stock !== undefined && Number(p.stock) <= 0;
    const image = p.img || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80";
    card.innerHTML = `
      <div class="product-photo">
        <img src="${escapeHTML(image)}" alt="${escapeHTML(p.name)}" loading="lazy">
        <span class="product-tag">${unavailable ? "ÉPUISÉ" : "SAMIRA"}</span>
        <button class="add-button" data-add="${escapeHTML(p.id)}" ${unavailable ? "disabled" : ""}>${unavailable ? "Indisponible" : "Ajouter au panier +"}</button>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHTML(p.category || "Beauté")}</span>
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.desc || "")}</p>
        <span class="product-price">${money(p.price)}</span>
      </div>`;
    grid.appendChild(card);
  });
}
function renderCart() {
  const count = cart.reduce((n, x) => n + x.qty, 0);
  const total = cart.reduce((n, x) => n + x.price * x.qty, 0);
  $("#cartCount").textContent = count;
  $("#drawerCount").textContent = `(${count})`;
  $("#cartSubtotal").textContent = money(total);
  $("#checkoutTotal").textContent = money(total);
  const wrap = $("#cartItems");
  wrap.innerHTML = "";
  if (!cart.length) {
    wrap.innerHTML = '<p class="muted" style="text-align:center;padding:45px 0">Votre panier est encore vide.</p>';
  }
  cart.forEach(item => {
    const line = document.createElement("div");
    line.className = "cart-line";
    line.innerHTML = `
      <img src="${escapeHTML(item.img || "")}" alt="">
      <div>
        <h4>${escapeHTML(item.name)}</h4>
        <small>${money(item.price)}</small>
        <div class="qty-control">
          <button data-qty="${escapeHTML(item.id)}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button data-qty="${escapeHTML(item.id)}" data-delta="1">+</button>
          <button class="remove-item" data-remove="${escapeHTML(item.id)}">Supprimer</button>
        </div>
      </div>
      <strong>${money(item.price * item.qty)}</strong>`;
    wrap.appendChild(line);
  });
}
function addToCart(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  if (p.stock !== null && p.stock !== undefined && Number(p.stock) <= 0) {
    showToast("Ce produit est momentanément indisponible.");
    return;
  }
  const found = cart.find(x => String(x.id) === String(id));
  if (found) found.qty++;
  else cart.push({...p, qty:1});
  saveCart();
  showToast("Produit ajouté à votre panier.");
}
function openCart() {
  $("#overlay").classList.remove("hidden");
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
}
function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  $("#overlay").classList.add("hidden");
}
function filterProducts() {
  const cat = $("#categoryFilter").value;
  const term = $("#searchInput").value.trim().toLowerCase();
  currentProducts = products.filter(p =>
    (cat === "Toutes" || p.category === cat) &&
    (p.name + " " + p.desc + " " + p.category).toLowerCase().includes(term)
  );
  const sort = $("#sortFilter").value;
  if (sort === "price-asc") currentProducts.sort((a,b) => a.price - b.price);
  if (sort === "price-desc") currentProducts.sort((a,b) => b.price - a.price);
  renderProducts();
}
async function loadProducts() {
  const client = window.samiraSupabase;
  if (!client) {
    showToast("La connexion à la boutique n'a pas pu démarrer.");
    $("#emptyState").textContent = "Impossible de se connecter au catalogue. Réessayez plus tard.";
    $("#emptyState").classList.remove("hidden");
    return;
  }
  $("#emptyState").textContent = "Chargement des produits…";
  $("#emptyState").classList.remove("hidden");
  const { data, error } = await client
    .from("products")
    .select("id, name, description, price, image_url, category, stock")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erreur Supabase products:", error);
    $("#emptyState").textContent = "Le catalogue n'a pas pu être chargé. Vérifiez votre connexion puis réessayez.";
    showToast("Erreur lors du chargement des produits.");
    return;
  }
  products = (data || []).map(p => ({
    id: p.id,
    name: p.name || "Produit SAMIRA",
    category: p.category || "Beauté",
    price: Number(p.price) || 0,
    desc: p.description || "",
    img: p.image_url || "",
    stock: p.stock
  }));
  // Les anciens articles du panier avaient des identifiants de démonstration numériques.
  // On conserve uniquement les articles correspondant aux vrais UUID du catalogue.
  cart = cart
    .map(item => {
      const product = products.find(p => String(p.id) === String(item.id));
      return product ? {...product, qty: Math.max(1, Number(item.qty) || 1)} : null;
    })
    .filter(Boolean);
  saveCart();
  filterProducts();
}

$("#productGrid").addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if (b) addToCart(b.dataset.add);
});
$("#cartItems").addEventListener("click", e => {
  const q = e.target.closest("[data-qty]");
  const r = e.target.closest("[data-remove]");
  if (q) {
    const item = cart.find(x => String(x.id) === q.dataset.qty);
    if (!item) return;
    item.qty += Number(q.dataset.delta);
    if (item.qty <= 0) cart = cart.filter(x => String(x.id) !== q.dataset.qty);
    saveCart();
  }
  if (r) {
    cart = cart.filter(x => String(x.id) !== r.dataset.remove);
    saveCart();
  }
});
$("#openCart").onclick = openCart;
$("#closeCart").onclick = closeCart;
$("#continueShopping").onclick = closeCart;
$("#overlay").onclick = closeCart;
$("#checkoutButton").onclick = () => {
  if (!cart.length) { showToast("Votre panier est vide."); return; }
  closeCart();
  $("#checkoutModal").classList.remove("hidden");
};
$("#closeCheckout").onclick = () => $("#checkoutModal").classList.add("hidden");
$("#categoryFilter").onchange = filterProducts;
$("#sortFilter").onchange = filterProducts;
$("#searchToggle").onclick = () => {
  $("#searchBar").classList.toggle("hidden");
  $("#searchInput").focus();
};
$("#closeSearch").onclick = () => {
  $("#searchBar").classList.add("hidden");
  $("#searchInput").value = "";
  filterProducts();
};
$("#searchInput").oninput = filterProducts;
document.querySelectorAll("[data-category]").forEach(b => b.onclick = () => {
  $("#categoryFilter").value = b.dataset.category;
  filterProducts();
  $("#shop").scrollIntoView({behavior:"smooth"});
});
$("#countrySelect").onchange = e => {
  const international = e.target.value !== "Gabon";
  $("#paymentSelect").value = international ? "Paiement international à configurer" : "Airtel Money";
  $("#paymentSelect").querySelector('option[value="Paiement international à configurer"]').disabled = false;
};
$("#checkoutForm").onsubmit = e => {
  e.preventDefault();
  if (!cart.length) return;
  const form = new FormData(e.currentTarget);
  const order = {
    reference: "SAM-" + Date.now().toString().slice(-8),
    createdAt: new Date().toISOString(),
    customer: Object.fromEntries(form.entries()),
    items: cart.map(({id,name,price,qty}) => ({id,name,price,qty})),
    total: cart.reduce((n,x) => n + x.price * x.qty, 0),
    status: "En attente de paiement — intégration marchand requise"
  };
  const orders = JSON.parse(localStorage.getItem("samira_orders") || "[]");
  orders.push(order);
  localStorage.setItem("samira_orders", JSON.stringify(orders));
  const lines = order.items.map(item => `- ${item.name} x${item.qty} : ${money(item.price * item.qty)}`).join("\n");
  const message = [
    "Bonjour Samira ! Je souhaite confirmer cette commande sur SAMIRA Beauty.",
    `Référence : ${order.reference}`,
    `Nom : ${order.customer.name || ""}`,
    `Téléphone : ${order.customer.phone || ""}`,
    `E-mail : ${order.customer.email || ""}`,
    `Livraison : ${order.customer.address || ""}, ${order.customer.country || ""}`,
    `Paiement choisi : ${order.customer.payment || ""}`,
    "Articles :",
    lines,
    `Total provisoire : ${money(order.total)}`,
    "Merci de me confirmer la disponibilité et les modalités de paiement. Je comprends qu'aucun paiement n'a encore été effectué."
  ].join("\n");
  const whatsappUrl = `https://wa.me/24107877070?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  $("#checkoutModal").classList.add("hidden");
  $("#confirmationText").textContent = `Votre référence est ${order.reference}. WhatsApp s'est ouvert avec le récapitulatif : appuyez sur Envoyer pour transmettre votre commande à Samira. Une copie locale est aussi conservée sur cet appareil.`;
  $("#confirmationModal").classList.remove("hidden");
  cart = [];
  saveCart();
  e.currentTarget.reset();
};
$("#finishOrder").onclick = () => $("#confirmationModal").classList.add("hidden");
$("#newsletterForm").onsubmit = e => {
  e.preventDefault();
  showToast("Merci ! L'inscription sera activée prochainement.");
  e.currentTarget.reset();
};
$("#menuToggle").onclick = () => document.querySelector(".main-nav").classList.toggle("open");
$("#year").textContent = new Date().getFullYear();
renderCart();
loadProducts();
