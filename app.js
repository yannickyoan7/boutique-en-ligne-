const products = [
  {id:1,name:"Sérum éclat vitamine C",category:"Visage",price:12500,tag:"BEST-SELLER",desc:"Un soin quotidien pour une peau lumineuse.",img:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80"},
  {id:2,name:"Crème hydratante douceur",category:"Visage",price:9800,tag:"ESSENTIEL",desc:"Hydratation et confort au quotidien.",img:"https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=700&q=80"},
  {id:3,name:"Huile sèche satinée",category:"Corps",price:11000,tag:"COUP DE CŒUR",desc:"Une touche satinée pour votre peau.",img:"https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80"},
  {id:4,name:"Masque nourrissant",category:"Cheveux",price:8500,tag:"SOIN",desc:"Un moment de douceur pour vos cheveux.",img:"https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=700&q=80"},
  {id:5,name:"Nettoyant visage délicat",category:"Visage",price:7500,tag:"DOUCEUR",desc:"Nettoie la peau sans l'agresser.",img:"https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=80"},
  {id:6,name:"Lait corps velours",category:"Corps",price:9000,tag:"QUOTIDIEN",desc:"Une texture confortable et soyeuse.",img:"https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=700&q=80"},
  {id:7,name:"Palette nude élégance",category:"Maquillage",price:14500,tag:"BEAUTÉ",desc:"Des teintes faciles à porter.",img:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=80"},
  {id:8,name:"Brume parfumée",category:"Parfums",price:10500,tag:"NOUVEAUTÉ",desc:"Une note délicate à porter chaque jour.",img:"https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=80"}
];
const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
let cart = JSON.parse(localStorage.getItem("samira_cart") || "[]");
let currentProducts = [...products];
let toastTimer;
function saveCart(){localStorage.setItem("samira_cart",JSON.stringify(cart));renderCart()}
function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2300)}
function renderProducts(){
  const grid=$("#productGrid");grid.innerHTML="";
  if(!currentProducts.length){$("#emptyState").classList.remove("hidden");return}
  $("#emptyState").classList.add("hidden");
  currentProducts.forEach(p=>{
    const card=document.createElement("article");card.className="product-card";
    card.innerHTML=`<div class="product-photo"><img src="${p.img}" alt="${p.name}" loading="lazy"><span class="product-tag">${p.tag}</span><button class="add-button" data-add="${p.id}">Ajouter au panier +</button></div><div class="product-info"><span class="product-category">${p.category}</span><h3>${p.name}</h3><p>${p.desc}</p><span class="product-price">${money(p.price)}</span></div>`;
    grid.appendChild(card);
  });
}
function renderCart(){
  const count=cart.reduce((n,x)=>n+x.qty,0),total=cart.reduce((n,x)=>n+x.price*x.qty,0);
  $("#cartCount").textContent=count;$("#drawerCount").textContent=`(${count})`;$("#cartSubtotal").textContent=money(total);$("#checkoutTotal").textContent=money(total);
  const wrap=$("#cartItems");wrap.innerHTML="";
  if(!cart.length){wrap.innerHTML='<p class="muted" style="text-align:center;padding:45px 0">Votre panier est encore vide.</p>'}
  cart.forEach(item=>{
    const line=document.createElement("div");line.className="cart-line";
    line.innerHTML=`<img src="${item.img}" alt=""><div><h4>${item.name}</h4><small>${money(item.price)}</small><div class="qty-control"><button data-qty="${item.id}" data-delta="-1">−</button><span>${item.qty}</span><button data-qty="${item.id}" data-delta="1">+</button><button class="remove-item" data-remove="${item.id}">Supprimer</button></div></div><strong>${money(item.price*item.qty)}</strong>`;
    wrap.appendChild(line);
  });
}
function addToCart(id){const p=products.find(x=>x.id===id);const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({...p,qty:1});saveCart();showToast("Produit ajouté à votre panier.");}
function openCart(){ $("#overlay").classList.remove("hidden");$("#cartDrawer").classList.add("open");$("#cartDrawer").setAttribute("aria-hidden","false");}
function closeCart(){ $("#cartDrawer").classList.remove("open");$("#cartDrawer").setAttribute("aria-hidden","true");$("#overlay").classList.add("hidden");}
function filterProducts(){const cat=$("#categoryFilter").value,term=$("#searchInput").value.trim().toLowerCase();currentProducts=products.filter(p=>(cat==="Toutes"||p.category===cat)&&(p.name+" "+p.desc+" "+p.category).toLowerCase().includes(term));const sort=$("#sortFilter").value;if(sort==="price-asc")currentProducts.sort((a,b)=>a.price-b.price);if(sort==="price-desc")currentProducts.sort((a,b)=>b.price-a.price);renderProducts();}
$("#productGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addToCart(Number(b.dataset.add))});
$("#cartItems").addEventListener("click",e=>{const q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");if(q){const item=cart.find(x=>x.id===Number(q.dataset.qty));item.qty+=Number(q.dataset.delta);if(item.qty<=0)cart=cart.filter(x=>x.id!==item.id);saveCart()}if(r){cart=cart.filter(x=>x.id!==Number(r.dataset.remove));saveCart()}});
$("#openCart").onclick=openCart;$("#closeCart").onclick=closeCart;$("#continueShopping").onclick=closeCart;$("#overlay").onclick=closeCart;
$("#checkoutButton").onclick=()=>{if(!cart.length){showToast("Votre panier est vide.");return}closeCart();$("#checkoutModal").classList.remove("hidden")};
$("#closeCheckout").onclick=()=>$("#checkoutModal").classList.add("hidden");
$("#categoryFilter").onchange=filterProducts;$("#sortFilter").onchange=filterProducts;
$("#searchToggle").onclick=()=>{$("#searchBar").classList.toggle("hidden");$("#searchInput").focus()};
$("#closeSearch").onclick=()=>{$("#searchBar").classList.add("hidden");$("#searchInput").value="";filterProducts()};
$("#searchInput").oninput=filterProducts;
document.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>{$("#categoryFilter").value=b.dataset.category;filterProducts();$("#shop").scrollIntoView({behavior:"smooth"})});
$("#countrySelect").onchange=e=>{const international=e.target.value!=="Gabon";$("#paymentSelect").value=international?"Paiement international à configurer":"Airtel Money";$("#paymentSelect").querySelector('option[value="Paiement international à configurer"]').disabled=false;};
$("#checkoutForm").onsubmit=e=>{
  e.preventDefault();if(!cart.length)return;
  const form=new FormData(e.currentTarget),order={reference:"SAM-"+Date.now().toString().slice(-8),createdAt:new Date().toISOString(),customer:Object.fromEntries(form.entries()),items:cart.map(({id,name,price,qty})=>({id,name,price,qty})),total:cart.reduce((n,x)=>n+x.price*x.qty,0),status:"En attente de paiement — intégration marchand requise"};
  const orders=JSON.parse(localStorage.getItem("samira_orders")||"[]");orders.push(order);localStorage.setItem("samira_orders",JSON.stringify(orders));
  const lines = order.items.map(item => `- ${item.name} x${item.qty} : ${money(item.price * item.qty)}`).join("\\n");
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
  ].join("\\n");
  const whatsappUrl = `https://wa.me/24107877070?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  $("#checkoutModal").classList.add("hidden");$("#confirmationText").textContent=`Votre référence est ${order.reference}. WhatsApp s'est ouvert avec le récapitulatif : appuyez sur Envoyer pour transmettre votre commande à Samira. Une copie locale est aussi conservée sur cet appareil.`;
  $("#confirmationModal").classList.remove("hidden");cart=[];saveCart();e.currentTarget.reset();
};
$("#finishOrder").onclick=()=>$("#confirmationModal").classList.add("hidden");
$("#newsletterForm").onsubmit=e=>{e.preventDefault();showToast("Merci ! L'inscription sera activée prochainement.");e.currentTarget.reset()};
$("#menuToggle").onclick=()=>document.querySelector(".main-nav").classList.toggle("open");
$("#year").textContent=new Date().getFullYear();
renderProducts();renderCart();