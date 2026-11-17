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
$("#checkoutForm").onsubmit = async e => {
  e.preventDefault();
  if (!cart.length) return;

  const client = window.samiraSupabase;
  if (!client) {
    showToast("Connexion à Supabase indisponible. Réessayez.");
    return;
  }

  const submitButton = e.currentTarget.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : "";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Enregistrement…";
  }

  // Ouvre une fenêtre pendant le clic utilisateur : certains navigateurs bloquent
  // les fenêtres ouvertes après une requête réseau asynchrone.
  

  try {
    const form = new FormData(e.currentTarget);
    const customer = Object.fromEntries(form.entries());
    const orderReference = "SAM-" + Date.now().toString().slice(-8);
    const orderTotal = cart.reduce((n, item) => n + Number(item.price) * Number(item.qty), 0);
    const orderItems = cart.map(({id, name, price, qty}) => ({
      product_id: id,
      product_name: name,
      quantity: Number(qty),
      unit_price: Number(price)
    }));

    // Générer l'UUID côté navigateur pour ne pas demander au visiteur
    // de relire la commande (la lecture est réservée à l'administrateur par RLS).
    const orderId = crypto.randomUUID();

    // Enregistrer la commande sans .select() : un visiteur peut INSERT,
    // mais ne doit pas pouvoir lire les commandes des autres clients.
    const { error: orderError } = await client
      .from("orders")
      .insert({
        id: orderId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        delivery_address: customer.address,
        delivery_country: customer.country,
        total: orderTotal,
        payment_method: customer.payment,
        payment_status: "Non payé",
        order_status: "En attente"
      });

    if (orderError) throw new Error("Enregistrement de la commande impossible : " + orderError.message);

    // Enregistrer les articles avec le même UUID généré côté navigateur.
    const itemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: orderId
    }));
    const { error: itemsError } = await client
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Commande créée, mais articles non enregistrés :", itemsError);
      throw new Error("La commande a été créée, mais ses articles n'ont pas pu être enregistrés : " + itemsError.message);
    }

    const lines = cart.map(item => `- ${item.name} x${item.qty} : ${money(item.price * item.qty)}`).join("\\n");
    const message = [
      "Bonjour Samira ! Je souhaite confirmer cette commande sur SAMIRA Beauty.",
      `Référence : ${orderReference}`,
      `Nom : ${customer.name || ""}`,
      `Téléphone : ${customer.phone || ""}`,
      `E-mail : ${customer.email || ""}`,
      `Livraison : ${customer.address || ""}, ${customer.country || ""}`,
      `Paiement choisi : ${customer.payment || ""}`,
      "Articles :",
      lines,
      `Total provisoire : ${money(orderTotal)}`,
      "Merci de me confirmer la disponibilité et les modalités de paiement. Aucun paiement n'a encore été effectué."
    ].join("\\n");
    const whatsappUrl = `https://wa.me/24107877070?text=${encodeURIComponent(message)}`;
    const whatsappLink = $("#whatsappOrderLink");
whatsappLink.href = whatsappUrl;
whatsappLink.classList.remove("hidden");


 $("#checkoutModal").classList.add("hidden");

$("#confirmationText").textContent =
  `Merci pour votre commande ! Votre commande est enregistrée. Votre numéro de référence est : ${orderReference}. Cliquez ci-dessous pour envoyer votre commande à Samira sur WhatsApp.`;

$("#confirmationModal").classList.remove("hidden");
    cart = [];
    saveCart();
    e.currentTarget.reset();
  } catch (error) {
    console.error("Erreur lors de la création de la commande :", error);
    
    showToast(error.message || "La commande n'a pas pu être enregistrée. Réessayez.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
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
