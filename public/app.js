'use strict';

// ── Config ─────────────────────────────────────────────────
var API = 'https://api.orionsmenu.com';
var DEFAULT_SLUG = 'mt-m-ltbykh';
var slug = (location.pathname.match(/^\/menu\/([^/]+)/) || [])[1] || DEFAULT_SLUG;

if (!location.pathname.startsWith('/menu/')) {
  history.replaceState(null, '', '/menu/' + slug);
}

// ── State ──────────────────────────────────────────────────
var menuData = null;
var activeCat = '__all__';
var viewMode = 'list';

// ── SVG Icons ──────────────────────────────────────────────
var CART_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
var PLUS_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
var PLUS_SM   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
var MINUS_ICON= '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
var X_ICON    = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
var STAR_ICON = '<svg width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
var WA_ICON   = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.849L0 24l6.351-1.498A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.892 0-3.667-.502-5.198-1.381l-.373-.221-3.87.913.975-3.764-.242-.386A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>';
var LOADER    = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
var GRID_SVG  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';
var LIST_SVG  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';

// ── Helpers ────────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
var CUR_SYM = { IQD: 'د.ع', USD: '$' };
function curSym() { return CUR_SYM[menuData && menuData.restaurant.currency_code] || 'د.ع'; }
function fmtPrice(price) {
  var sym = curSym();
  var n = parseFloat(price);
  var f = Number.isInteger(n) ? n.toLocaleString('en') : n.toFixed(2).replace(/\.?0+$/, '');
  return f + ' ' + sym;
}
var GRADS = [
  'linear-gradient(135deg,#6B3410,#3E1D08)',
  'linear-gradient(135deg,#E89B2C,#C97D14)',
  'linear-gradient(135deg,#C0392B,#8B1A0E)',
  'linear-gradient(135deg,#8A5228,#6B3410)',
];
function thumbGrad(name) {
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return GRADS[Math.abs(h) % GRADS.length];
}
function shortLabel(name) { return (name || '').split(/\s+/)[0] || name; }

// ── Cart (localStorage) ────────────────────────────────────
function cartGet() {
  try { return JSON.parse(localStorage.getItem('_cart') || '[]'); } catch(e) { return []; }
}
function cartSave(c) { localStorage.setItem('_cart', JSON.stringify(c)); }
function cartKey(id, vn) { return vn ? id + '::' + vn : id; }
function cartFind(cart, id, vn) {
  var key = cartKey(id, vn);
  return cart.find(function(c) { return cartKey(c.id, c.vn) === key; });
}
function cartAdd(id, vn, vp, qty) {
  var cart = cartGet();
  var ex = cartFind(cart, id, vn);
  if (ex) ex.q += (qty || 1);
  else cart.push({ id: id, vn: vn || null, vp: vp || null, q: qty || 1 });
  cartSave(cart);
}
function cartRemoveOne(id, vn) {
  var cart = cartGet();
  var ci = cartFind(cart, id, vn);
  if (!ci) return;
  if (ci.q === 1) cart.splice(cart.indexOf(ci), 1);
  else ci.q--;
  cartSave(cart);
}
function cartClear() { localStorage.removeItem('_cart'); }
function cartCount() { return cartGet().reduce(function(s,c){return s+c.q;}, 0); }
function itemTotalQty(id) {
  return cartGet().filter(function(c){return c.id===id;}).reduce(function(s,c){return s+c.q;},0);
}
function cartHydrate() {
  if (!menuData) return [];
  return cartGet().map(function(c) {
    var item = menuData.items.find(function(i){return i.id===c.id;});
    if (!item) return null;
    var variant = c.vn ? (item.variants||[]).find(function(v){return v.name===c.vn;}) : null;
    return { item:item, quantity:c.q, variantName:c.vn||null, variantPrice:c.vp||(variant&&variant.price)||null };
  }).filter(Boolean);
}

// ── Offers ─────────────────────────────────────────────────
function appOffers(itemId) {
  var offers = (menuData && menuData.offers) || [];
  return offers.filter(function(o){ return o.applicable_items.length===0 || o.applicable_items.includes(itemId); });
}
function discPrice(base, offers) {
  return offers.reduce(function(p,o) {
    var v = parseFloat(o.discount_value);
    return o.discount_type==='percentage' ? p*(1-v/100) : Math.max(0, p-v);
  }, parseFloat(base));
}
function offerLabel(o) {
  var v = parseFloat(o.discount_value);
  return o.discount_type==='percentage' ? 'خصم '+v+'%' : 'خصم '+v;
}
function cartTotals() {
  var cart = cartHydrate();
  var offers = (menuData && menuData.offers) || [];
  var raw = cart.reduce(function(s,ci){ return s + parseFloat(ci.variantPrice||ci.item.price)*ci.quantity; }, 0);
  var discount = 0;
  offers.forEach(function(o) {
    var v = parseFloat(o.discount_value);
    if (o.applicable_items.length===0) {
      discount += o.discount_type==='percentage' ? raw*v/100 : Math.min(v,raw);
    } else {
      var ap = new Set(o.applicable_items);
      var base = cart.filter(function(ci){return ap.has(ci.item.id);})
        .reduce(function(s,ci){return s+parseFloat(ci.variantPrice||ci.item.price)*ci.quantity;},0);
      discount += o.discount_type==='percentage' ? base*v/100 : Math.min(v,base);
    }
  });
  var disc = Math.min(discount, raw);
  return { raw:raw, discount:disc, total:raw-disc };
}

// ── View mode ──────────────────────────────────────────────
function restoreViewMode() {
  try { viewMode = localStorage.getItem('viewMode') || 'list'; } catch(e){}
  applyViewMode();
}
function toggleViewMode() {
  viewMode = viewMode==='list' ? 'grid' : 'list';
  try { localStorage.setItem('viewMode', viewMode); } catch(e){}
  applyViewMode();
}
function applyViewMode() {
  var isGrid = viewMode==='grid';
  document.querySelectorAll('.items-list,.items-grid').forEach(function(el){
    el.classList.toggle('items-grid', isGrid);
    el.classList.toggle('items-list', !isGrid);
  });
  var icon = document.getElementById('view-icon');
  if (icon) icon.innerHTML = isGrid ? LIST_SVG : GRID_SVG;
}

// ── Render: Header ─────────────────────────────────────────
function renderHeader() {
  var r = menuData.restaurant;
  var count = cartCount();
  var badge = count > 0
    ? '<span id="cart-badge" style="position:absolute;top:-4px;left:-4px;min-width:18px;height:18px;border-radius:999px;background:#E89B2C;color:#3E1D08;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #FBF3E4;line-height:1;">'+(count>99?'99+':count)+'</span>'
    : '<span id="cart-badge"></span>';
  var fl = esc((r.name||'م').charAt(0));
  var logo = r.logo_url
    ? '<img src="'+esc(r.logo_url)+'" alt="'+esc(r.name)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">'
    : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#6B3410,#3E1D08);display:flex;align-items:center;justify-content:center;color:#FBF3E4;font-size:22px;font-weight:800;">'+fl+'</div>';
  document.getElementById('header-slot').innerHTML =
    '<header style="background:#FBF3E4;padding:20px 16px 12px;">' +
    '<div style="display:flex;align-items:center;gap:14px;max-width:440px;margin:0 auto;">' +
    '<div style="width:56px;height:56px;border-radius:999px;overflow:hidden;box-shadow:0 4px 12px rgba(62,29,8,.15);flex-shrink:0;background:#F5E8CE;">'+logo+'</div>' +
    '<div style="flex:1;text-align:right;"><div style="font-weight:800;font-size:22px;color:#3E1D08;line-height:1.1;">'+esc(r.name)+'</div>' +
    '<div style="font-family:\'Playfair Display\',Georgia,serif;font-weight:900;font-size:10px;letter-spacing:.10em;color:#6B3410;text-transform:uppercase;margin-top:3px;">AL TABIKH · SINCE 1973</div></div>' +
    '<button onclick="openCart()" style="position:relative;width:46px;height:46px;border-radius:999px;background:#3E1D08;color:#FBF3E4;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;">'+CART_ICON+badge+'</button>' +
    '</div></header>';
}

// ── Render: Category nav ───────────────────────────────────
function renderCategoryNav() {
  var cats = menuData.categories;
  var all = [{ id:'__all__', name:'الكل' }].concat(cats);
  var btns = all.map(function(c) {
    var active = activeCat===c.id;
    return '<button class="cat-btn" data-cat="'+esc(c.id)+'" onclick="setActiveCategory(\''+esc(c.id)+'\')" style="flex-shrink:0;padding:8px 18px;border-radius:999px;border:1.5px solid;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all 150ms;background:'+(active?'#6B3410':'#FFFFFF')+';color:'+(active?'#FBF3E4':'#2B1B0E')+';border-color:'+(active?'#6B3410':'#E3D2B0')+';box-shadow:'+(active?'0 2px 8px rgba(107,52,16,.25)':'0 1px 2px rgba(62,29,8,.04)')+';">'+esc(c.name)+'</button>';
  }).join('');
  document.getElementById('cat-nav-slot').innerHTML =
    '<div style="position:sticky;top:0;z-index:10;background:#FBF3E4;padding:0 0 10px;">' +
    '<div style="display:flex;align-items:center;gap:8px;padding:8px 16px 2px;max-width:440px;margin:0 auto;">' +
    '<div class="no-scrollbar" style="display:flex;gap:8px;overflow-x:auto;flex:1;">'+btns+'</div>' +
    '<button onclick="toggleViewMode()" style="flex-shrink:0;width:36px;height:36px;border-radius:999px;background:#FFFFFF;border:1.5px solid #E3D2B0;color:#6B3410;display:flex;align-items:center;justify-content:center;cursor:pointer;"><span id="view-icon">'+(viewMode==='grid'?LIST_SVG:GRID_SVG)+'</span></button>' +
    '</div></div>';
}

// ── Render: Item action button ─────────────────────────────
function renderItemAction(item) {
  var qty = itemTotalQty(item.id);
  var hasV = item.variants && item.variants.length > 0;
  if (qty===0 || hasV) {
    return '<div id="item-action-'+esc(item.id)+'">' +
      '<button onclick="event.stopPropagation();openDetail(\''+esc(item.id)+'\')" style="width:32px;height:32px;border-radius:999px;background:#3E1D08;color:#FBF3E4;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+PLUS_ICON+'</button>' +
      '</div>';
  }
  return '<div id="item-action-'+esc(item.id)+'" style="display:flex;align-items:center;background:#F5EAD6;border-radius:999px;padding:2px 3px;">' +
    '<button onclick="event.stopPropagation();doRemove(\''+esc(item.id)+'\',null)" style="width:28px;height:28px;border-radius:999px;background:#FFFFFF;border:none;color:#6B3410;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+MINUS_ICON+'</button>' +
    '<span style="min-width:22px;text-align:center;font-weight:700;font-size:14px;color:#2B1B0E;">'+qty+'</span>' +
    '<button onclick="event.stopPropagation();doAdd(\''+esc(item.id)+'\',null,null)" style="width:28px;height:28px;border-radius:999px;background:#3E1D08;color:#FBF3E4;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+PLUS_SM+'</button>' +
    '</div>';
}

// ── Render: Item card ──────────────────────────────────────
function renderItemCard(item) {
  var qty = itemTotalQty(item.id);
  var offers = appOffers(item.id);
  var hasV = item.variants && item.variants.length > 0;
  var baseP = hasV ? String(Math.min.apply(null, item.variants.map(function(v){return parseFloat(v.price);}))) : item.price;
  var dp = discPrice(baseP, offers);
  var hasDis = offers.length>0 && dp < parseFloat(baseP);
  var badge = offers.length>0 ? '<span style="position:absolute;top:6px;right:6px;background:#C0392B;color:#FFF;font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px;">'+esc(offerLabel(offers[0]))+'</span>' : '';
  var qtyBadge = qty>0 ? '<div class="item-qty-badge" style="position:absolute;top:8px;left:8px;width:22px;height:22px;border-radius:999px;background:#E89B2C;color:#3E1D08;font-size:11px;font-weight:800;align-items:center;justify-content:center;">'+qty+'</div>' : '';
  var thumb = item.image_url
    ? '<img src="'+esc(item.image_url)+'" alt="'+esc(item.name)+'">'
    : '<div class="thumb-ph" style="background:'+thumbGrad(item.name)+';display:flex;align-items:center;justify-content:center;color:#FBF3E4;font-size:13px;font-weight:700;">'+esc(shortLabel(item.name))+'</div>';
  var priceHtml = (hasV?'<span style="font-size:11px;color:#6B5A48;font-weight:500;margin-inline-end:4px;">من</span>':'') +
    (hasDis ? '<span style="color:#C0392B;">'+esc(fmtPrice(dp))+'</span>' : esc(fmtPrice(baseP)));
  return '<div class="item-card fade-in" onclick="openDetail(\''+esc(item.id)+'\')">' +
    '<div class="item-thumb">'+thumb+badge+qtyBadge+'</div>' +
    '<div class="item-content">' +
    '<div><div class="item-name">'+esc(item.name)+'</div>'+(item.description?'<div class="item-desc">'+esc(item.description)+'</div>':'')+'</div>' +
    '<div class="item-price-row"><div class="item-price">'+priceHtml+'</div>'+renderItemAction(item)+'</div>' +
    '</div></div>';
}

// ── Render: Menu items ─────────────────────────────────────
function renderMenuItems() {
  var items = menuData.items.filter(function(i){return i.is_available!==false;});
  var visible = activeCat==='__all__' ? items : items.filter(function(i){return i.category_id===activeCat;});
  document.getElementById('menu-items').innerHTML =
    '<div class="items-list" style="display:flex;flex-direction:column;gap:12px;">' +
    visible.map(renderItemCard).join('') +
    '</div>';
  applyViewMode();
}

// ── Render: Cart float ─────────────────────────────────────
function renderCartFloat() {
  var count = cartCount();
  if (count===0) { document.getElementById('cart-float').innerHTML=''; return; }
  var total = cartTotals().total;
  var sym = curSym();
  document.getElementById('cart-float').innerHTML =
    '<div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:50;width:calc(100% - 32px);max-width:408px;">' +
    '<button onclick="openCart()" style="width:100%;min-height:54px;border-radius:999px;background:#3E1D08;color:#FBF3E4;border:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;padding:8px 20px 8px 8px;gap:12px;box-shadow:0 8px 24px rgba(62,29,8,.35);">' +
    '<div style="width:40px;height:40px;border-radius:999px;background:#E89B2C;color:#3E1D08;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0;">'+(count>99?'99+':count)+'</div>' +
    '<span style="flex:1;font-weight:700;font-size:15px;">عرض السلة</span>' +
    '<span style="font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;">'+total.toFixed(0)+' <span style="font-size:11px;font-weight:500;opacity:.7;">'+sym+'</span></span>' +
    '</button></div>';
}

// ── Render: Product modal ──────────────────────────────────
function renderProductModal(item) {
  var offers = appOffers(item.id);
  var hasV = item.variants && item.variants.length > 0;
  var baseP = hasV ? String(Math.min.apply(null, item.variants.map(function(v){return parseFloat(v.price);}))) : item.price;
  var dp = discPrice(baseP, offers);
  var hasDis = offers.length>0 && dp < parseFloat(baseP);
  var thumb = item.image_url
    ? '<img src="'+esc(item.image_url)+'" alt="'+esc(item.name)+'" style="width:100%;height:100%;object-fit:cover;">'
    : '<div style="width:100%;height:100%;background:'+thumbGrad(item.name)+';display:flex;align-items:center;justify-content:center;color:#FBF3E4;font-size:28px;font-weight:700;">'+esc(shortLabel(item.name))+'</div>';
  var variantsHtml = '';
  if (hasV) {
    variantsHtml = '<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:700;color:#9B8A74;margin-bottom:8px;">اختر الحجم</div><div style="display:flex;flex-direction:column;gap:8px;">' +
      item.variants.map(function(v,i) {
        var vd = discPrice(v.price, offers);
        var vHasDis = offers.length>0 && vd<parseFloat(v.price);
        return '<label onclick="selectVariant(this)" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:14px;border:2px solid '+(i===0?'#6B3410':'#E3D2B0')+';background:'+(i===0?'#FBF3E4':'#FFFFFF')+';cursor:pointer;">' +
          '<span style="font-weight:600;font-size:15px;">'+esc(v.name)+'</span>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
          (vHasDis?'<span style="font-size:12px;color:#9B8A74;text-decoration:line-through;">'+esc(fmtPrice(v.price))+'</span>':'') +
          '<span style="font-weight:700;font-size:15px;color:'+(vHasDis?'#C0392B':'#3E1D08')+';">'+esc(fmtPrice(vHasDis?vd:v.price))+'</span>' +
          '<input type="radio" name="variant" value="'+esc(v.name)+'" data-price="'+esc(String(vHasDis?vd:v.price))+'"'+(i===0?' checked':'')+' style="display:none;">' +
          '</div></label>';
      }).join('') + '</div></div>';
  }
  document.getElementById('modal-container').innerHTML =
    '<div style="width:40px;height:4px;background:#D8C8A8;border-radius:999px;margin:12px auto 0;"></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;">' +
    '<button onclick="closeModal()" style="width:38px;height:38px;border-radius:999px;background:#FFFFFF;border:1.5px solid #E3D2B0;color:#6B3410;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+X_ICON+'</button>' +
    '<div style="font-weight:700;font-size:16px;color:#3E1D08;">تفاصيل المنتج</div><div style="width:38px;"></div></div>' +
    '<div style="overflow-y:auto;flex:1;padding:0 20px 24px;">' +
    '<div style="height:220px;border-radius:20px;overflow:hidden;margin-bottom:16px;">'+thumb+'</div>' +
    '<div style="font-weight:800;font-size:20px;color:#2B1B0E;margin-bottom:6px;">'+esc(item.name)+'</div>' +
    (item.description?'<div style="font-size:14px;color:#6B5A48;line-height:1.6;margin-bottom:14px;">'+esc(item.description)+'</div>':'') +
    '<div style="font-weight:700;font-size:22px;color:'+(hasDis?'#C0392B':'#3E1D08')+';margin-bottom:16px;">' +
    (hasDis?'<span style="font-size:14px;color:#9B8A74;text-decoration:line-through;margin-inline-end:8px;">'+esc(fmtPrice(baseP))+'</span>':'') +
    esc(fmtPrice(hasDis?dp:baseP))+(hasV?'<span style="font-size:14px;font-weight:500;color:#9B8A74;"> من</span>':'')+'</div>' +
    variantsHtml +
    '<button onclick="modalAddToCart(\''+esc(item.id)+'\')" style="width:100%;min-height:54px;border-radius:999px;background:#3E1D08;color:#FBF3E4;border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px;">'+PLUS_ICON+' إضافة للسلة</button>' +
    '</div>';
}

// ── Render: Cart drawer ────────────────────────────────────
function renderCartDrawer() {
  var cart = cartHydrate();
  var t = cartTotals();
  var rows = cart.length===0
    ? '<div style="padding:36px 0;text-align:center;color:#9B8A74;font-size:14px;">سلتك فارغة. تصفح القائمة وأضف ما يعجبك.</div>'
    : cart.map(function(ci) {
        var price = parseFloat(ci.variantPrice||ci.item.price);
        var thumb2 = ci.item.image_url
          ? '<img src="'+esc(ci.item.image_url)+'" alt="'+esc(ci.item.name)+'" style="width:100%;height:100%;object-fit:cover;">'
          : '<div style="width:100%;height:100%;background:'+thumbGrad(ci.item.name)+';display:flex;align-items:center;justify-content:center;color:#FBF3E4;font-size:11px;font-weight:700;">'+esc(shortLabel(ci.item.name))+'</div>';
        var vn = ci.variantName||'';
        return '<div style="display:flex;gap:12px;align-items:center;background:#FFFFFF;border-radius:18px;padding:10px 12px;box-shadow:0 1px 2px rgba(62,29,8,.05);">' +
          '<div style="width:54px;height:54px;border-radius:12px;overflow:hidden;flex-shrink:0;">'+thumb2+'</div>' +
          '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;font-size:15px;color:#2B1B0E;line-height:1.3;">'+esc(ci.item.name)+(ci.variantName?'<span style="font-size:12px;color:#9B8A74;font-weight:400;margin-inline-start:4px;">('+esc(ci.variantName)+')</span>':'')+'</div>' +
          '<div style="font-weight:700;font-size:14px;color:#E89B2C;margin-top:3px;">'+esc(fmtPrice(price*ci.quantity))+'</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;background:#F5EAD6;border-radius:999px;padding:3px 4px;flex-shrink:0;">' +
          '<button onclick="drawerDecrement(\''+esc(ci.item.id)+'\',\''+esc(vn)+'\')" style="width:28px;height:28px;border-radius:999px;background:#FFFFFF;border:none;color:#6B3410;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+MINUS_ICON+'</button>' +
          '<div style="min-width:24px;text-align:center;font-weight:700;font-size:14px;color:#2B1B0E;">'+ci.quantity+'</div>' +
          '<button onclick="drawerIncrement(\''+esc(ci.item.id)+'\',\''+esc(vn)+'\')" style="width:28px;height:28px;border-radius:999px;background:#FFFFFF;border:none;color:#6B3410;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+PLUS_SM+'</button>' +
          '</div></div>';
      }).join('');
  var footer = cart.length>0 ? (
    '<div style="padding:14px 20px 28px;flex-shrink:0;">' +
    (t.discount>0?'<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#7A8451;font-size:13px;font-weight:600;">-'+esc(fmtPrice(t.discount))+'</span><span style="color:#9B8A74;font-size:13px;">الخصم</span></div>':'') +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><div style="font-weight:800;font-size:20px;color:#2B1B0E;font-variant-numeric:tabular-nums;">'+esc(fmtPrice(t.total))+'</div><div style="font-size:14px;color:#9B8A74;font-weight:500;">المجموع</div></div>' +
    '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">' +
    '<input type="text" id="cust-name" placeholder="الاسم" style="height:48px;padding:0 14px;border-radius:14px;background:#FFFFFF;border:1px solid #E3D2B0;font-family:inherit;font-size:15px;color:#2B1B0E;direction:rtl;outline:none;width:100%;box-sizing:border-box;">' +
    '<input type="tel" id="cust-phone" placeholder="رقم الهاتف" style="height:48px;padding:0 14px;border-radius:14px;background:#FFFFFF;border:1px solid #E3D2B0;font-family:inherit;font-size:15px;color:#2B1B0E;direction:ltr;text-align:right;outline:none;width:100%;box-sizing:border-box;">' +
    '<textarea id="cust-notes" placeholder="ملاحظات (اختياري)" rows="2" style="padding:12px 14px;border-radius:14px;background:#FFFFFF;border:1px solid #E3D2B0;font-family:inherit;font-size:15px;color:#2B1B0E;direction:rtl;outline:none;width:100%;resize:none;min-height:64px;box-sizing:border-box;"></textarea>' +
    '</div>' +
    '<button onclick="submitOrder()" id="order-btn" style="width:100%;min-height:54px;border-radius:999px;background:#8A6040;color:#FBF3E4;border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 14px rgba(107,52,16,.22);">'+WA_ICON+' إرسال الطلب عبر واتساب</button>' +
    '<div id="order-result" style="margin-top:8px;"></div>' +
    '</div>'
  ) : '';
  document.getElementById('cart-drawer').innerHTML =
    '<div style="width:40px;height:4px;background:#D8C8A8;border-radius:999px;margin:12px auto 0;flex-shrink:0;"></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;flex-shrink:0;">' +
    '<button onclick="closeCart()" style="width:38px;height:38px;border-radius:999px;background:#FFFFFF;border:1.5px solid #E3D2B0;color:#6B3410;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+X_ICON+'</button>' +
    '<div style="font-weight:800;font-size:18px;color:#2B1B0E;">السلة</div><div style="width:38px;"></div></div>' +
    '<div style="flex:1;overflow-y:auto;padding:4px 20px 0;min-height:0;"><div style="display:flex;flex-direction:column;gap:10px;padding-bottom:4px;">'+rows+'</div></div>' +
    footer;
}

// ── Render: Review sheet ───────────────────────────────────
function renderReviewSheet() {
  var stars = [1,2,3,4,5].map(function(n) {
    return '<label style="cursor:pointer;color:#E89B2C;" onclick="selectStar('+n+')" id="star-lbl-'+n+'">' +
      '<input type="radio" name="rating" value="'+n+'" style="display:none;">' +
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E89B2C" stroke-width="1.5" stroke-linecap="round" id="star-svg-'+n+'"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
      '</label>';
  }).join('');
  document.getElementById('review-inner').innerHTML =
    '<div style="width:40px;height:4px;background:#D8C8A8;border-radius:999px;margin:12px auto 0;"></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;">' +
    '<button onclick="closeReview()" style="width:38px;height:38px;border-radius:999px;background:#FFFFFF;border:1.5px solid #E3D2B0;color:#6B3410;display:flex;align-items:center;justify-content:center;cursor:pointer;">'+X_ICON+'</button>' +
    '<div style="font-weight:800;font-size:17px;color:#2B1B0E;">قيّم تجربتك</div><div style="width:38px;"></div></div>' +
    '<div style="padding:8px 20px 32px;display:flex;flex-direction:column;gap:14px;">' +
    '<div style="display:flex;justify-content:center;gap:8px;padding:8px 0;">'+stars+'</div>' +
    '<input type="text" id="rev-name" placeholder="اسمك (اختياري)" style="height:48px;padding:0 14px;border-radius:14px;background:#FFFFFF;border:1px solid #E3D2B0;font-family:inherit;font-size:15px;color:#2B1B0E;direction:rtl;outline:none;width:100%;box-sizing:border-box;">' +
    '<textarea id="rev-comment" placeholder="رأيك يهمنا (اختياري)" rows="3" style="padding:12px 14px;border-radius:14px;background:#FFFFFF;border:1px solid #E3D2B0;font-family:inherit;font-size:15px;color:#2B1B0E;direction:rtl;outline:none;width:100%;resize:none;box-sizing:border-box;"></textarea>' +
    '<button onclick="submitReview()" id="rev-btn" style="width:100%;min-height:52px;border-radius:999px;background:#6B3410;color:#FBF3E4;border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:16px;">إرسال التقييم</button>' +
    '<div id="rev-result"></div>' +
    '</div>';
}

// ── Render: Review banner ──────────────────────────────────
function renderReviewBanner() {
  var r = menuData.restaurant;
  if (!r.whatsapp_number && !r.instagram_handle && !r.phone_number) return;
  var links = '';
  if (r.whatsapp_number) links += '<a href="https://wa.me/'+esc(r.whatsapp_number)+'" target="_blank" style="width:44px;height:44px;border-radius:999px;background:#25D366;color:#FFFFFF;display:flex;align-items:center;justify-content:center;text-decoration:none;">'+WA_ICON+'</a>';
  document.getElementById('review-banner-slot').innerHTML =
    '<div style="background:#FFFFFF;border-radius:24px;padding:18px 20px;margin-top:24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 4px rgba(62,29,8,.06);">' +
    '<button onclick="openReview()" style="display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;background:#FBF3E4;border:1.5px solid #E3D2B0;font-family:inherit;font-size:14px;font-weight:700;color:#3E1D08;cursor:pointer;">'+STAR_ICON+' قيّم تجربتك</button>' +
    '<div style="display:flex;gap:8px;">'+links+'</div>' +
    '</div>';
}

// ── Interactions ───────────────────────────────────────────
function updateUI() {
  var count = cartCount();
  // badge
  var badge = document.getElementById('cart-badge');
  if (badge) {
    if (count>0) {
      badge.textContent = count>99?'99+':String(count);
      badge.style.cssText = 'position:absolute;top:-4px;left:-4px;min-width:18px;height:18px;border-radius:999px;background:#E89B2C;color:#3E1D08;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #FBF3E4;line-height:1;';
    } else { badge.textContent=''; badge.style.cssText=''; }
  }
  renderCartFloat();
  // refresh item actions
  menuData.items.forEach(function(item) {
    var el = document.getElementById('item-action-'+item.id);
    if (el) el.outerHTML = renderItemAction(item);
  });
}

function doAdd(id, vn, vp) {
  cartAdd(id, vn, vp);
  updateUI();
  showToast('تمت الإضافة للسلة');
}
function doRemove(id, vn) {
  cartRemoveOne(id, vn);
  updateUI();
}
function drawerIncrement(id, vn) {
  cartAdd(id, vn||null, null);
  renderCartDrawer();
  updateUI();
}
function drawerDecrement(id, vn) {
  cartRemoveOne(id, vn||null);
  renderCartDrawer();
  updateUI();
}

function setActiveCategory(id) {
  activeCat = id;
  renderCategoryNav();
  renderMenuItems();
  window.scrollTo({ top:0, behavior:'smooth' });
}

function openDetail(itemId) {
  var item = menuData.items.find(function(i){return i.id===itemId;});
  if (!item) return;
  renderProductModal(item);
  var ov = document.getElementById('modal-overlay');
  var ct = document.getElementById('modal-container');
  ov.style.display = 'block';
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(function(){ ct.style.transform='translateY(0)'; });
}
function closeModal() {
  var ct = document.getElementById('modal-container');
  var ov = document.getElementById('modal-overlay');
  ct.style.transform = 'translateY(100%)';
  setTimeout(function(){ ov.style.display='none'; ct.innerHTML=''; document.body.style.overflow=''; }, 300);
}
function selectVariant(label) {
  document.querySelectorAll('#modal-container label').forEach(function(l) {
    l.style.borderColor='#E3D2B0'; l.style.background='#FFFFFF';
  });
  label.style.borderColor='#6B3410'; label.style.background='#FBF3E4';
  label.querySelector('input[type=radio]').checked = true;
}
function modalAddToCart(itemId) {
  var item = menuData.items.find(function(i){return i.id===itemId;});
  if (!item) return;
  var vn=null, vp=null;
  if (item.variants && item.variants.length>0) {
    var checked = document.querySelector('input[name="variant"]:checked');
    if (checked) { vn=checked.value; vp=checked.dataset.price; }
  }
  cartAdd(itemId, vn, vp);
  closeModal();
  updateUI();
  showToast('تمت الإضافة للسلة');
}

function openCart() {
  renderCartDrawer();
  var ov=document.getElementById('cart-overlay'), ct=document.getElementById('cart-container');
  ov.style.display='block'; document.body.style.overflow='hidden';
  requestAnimationFrame(function(){ ct.style.transform='translateY(0)'; });
}
function closeCart() {
  var ct=document.getElementById('cart-container'), ov=document.getElementById('cart-overlay');
  ct.style.transform='translateY(100%)';
  setTimeout(function(){ ov.style.display='none'; document.body.style.overflow=''; }, 320);
}

function openReview() {
  renderReviewSheet();
  var ov=document.getElementById('review-overlay'), ct=document.getElementById('review-container');
  ov.style.display='block'; document.body.style.overflow='hidden';
  requestAnimationFrame(function(){ ct.style.transform='translateY(0)'; });
}
function closeReview() {
  var ct=document.getElementById('review-container'), ov=document.getElementById('review-overlay');
  ct.style.transform='translateY(100%)';
  setTimeout(function(){ ov.style.display='none'; document.body.style.overflow=''; }, 300);
}
function selectStar(n) {
  for (var i=1;i<=5;i++) {
    var svg=document.getElementById('star-svg-'+i);
    if (svg) svg.setAttribute('fill', i<=n?'#E89B2C':'none');
  }
  var inp=document.querySelector('input[name="rating"][value="'+n+'"]');
  if (inp) inp.checked=true;
}

// ── API calls ──────────────────────────────────────────────
async function submitOrder() {
  var name=(document.getElementById('cust-name')||{}).value||'';
  var phone=(document.getElementById('cust-phone')||{}).value||'';
  var notes=(document.getElementById('cust-notes')||{}).value||'';
  var res=document.getElementById('order-result');
  var btn=document.getElementById('order-btn');
  name=name.trim(); phone=phone.trim(); notes=notes.trim();
  if (!name||!phone) { if(res) res.innerHTML='<div style="color:#C0392B;text-align:center;padding:8px;">الاسم ورقم الهاتف مطلوبان.</div>'; return; }
  if (phone.replace(/\D/g,'').length<7) { if(res) res.innerHTML='<div style="color:#C0392B;text-align:center;padding:8px;">رقم الجوال يجب أن يتكون من 7 أرقام على الأقل.</div>'; return; }
  btn.disabled=true; btn.innerHTML=LOADER+' جاري الإرسال...';
  var cart=cartHydrate();
  try {
    var r=await fetch(API+'/public/menu/'+slug+'/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_name:name,customer_phone:phone,items:cart.map(function(ci){return {item_id:ci.item.id,quantity:ci.quantity,...(ci.variantName?{variant_name:ci.variantName}:{})}}),notes:notes||undefined})});
    if (!r.ok) throw new Error();
    var data=await r.json();
    cartClear(); updateUI();
    if(res) res.innerHTML='<div style="text-align:center;padding:16px 0;"><div style="font-size:28px;margin-bottom:8px;">🎉</div><div style="font-weight:800;font-size:17px;color:#2B1B0E;margin-bottom:4px;">تم استلام طلبك!</div>'+(data.whatsapp_link?'<a href="'+esc(data.whatsapp_link)+'" target="_blank" style="display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:12px 24px;border-radius:999px;background:#25D366;color:#FFF;font-weight:700;font-size:15px;text-decoration:none;">'+WA_ICON+' تابع عبر واتساب</a>':'')+'</div>';
    if(btn) btn.style.display='none';
  } catch(e) {
    btn.disabled=false; btn.innerHTML=WA_ICON+' إرسال الطلب عبر واتساب';
    if(res) res.innerHTML='<div style="color:#C0392B;text-align:center;padding:8px;">حدث خطأ، حاول مجدداً.</div>';
  }
}

async function submitReview() {
  var name=(document.getElementById('rev-name')||{}).value||'';
  var comment=(document.getElementById('rev-comment')||{}).value||'';
  var rating=document.querySelector('input[name="rating"]:checked');
  var res=document.getElementById('rev-result');
  var btn=document.getElementById('rev-btn');
  if (!rating) { if(res) res.innerHTML='<div style="color:#C0392B;text-align:center;padding:8px;">يرجى اختيار تقييم.</div>'; return; }
  btn.disabled=true;
  try {
    var r=await fetch(API+'/public/menu/'+slug+'/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer_name:name.trim()||'',rating:parseInt(rating.value),comment:comment.trim()||undefined})});
    if (!r.ok) throw new Error();
    if(res) res.innerHTML='<div style="text-align:center;padding:16px;font-weight:700;color:#3E1D08;font-size:16px;">شكراً على تقييمك! ⭐</div>';
    if(btn) btn.style.display='none';
  } catch(e) {
    btn.disabled=false;
    if(res) res.innerHTML='<div style="color:#C0392B;text-align:center;padding:8px;">تعذّر إرسال التقييم، حاول مجدداً.</div>';
  }
}

// ── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  var t=document.createElement('div');
  t.textContent=msg;
  t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#3E1D08;color:#FBF3E4;padding:10px 20px;border-radius:999px;font-size:14px;font-weight:600;z-index:200;box-shadow:0 4px 16px rgba(0,0,0,.2);animation:slideUp 0.3s ease;white-space:nowrap;';
  document.body.appendChild(t);
  setTimeout(function(){t.remove();},2500);
}

// ── Init ───────────────────────────────────────────────────
(async function init() {
  // Animate splash
  requestAnimationFrame(function() {
    var logo=document.getElementById('splash-logo');
    var name=document.getElementById('splash-name');
    if(logo){logo.style.opacity='1';logo.style.transform='scale(1)';}
    if(name) name.style.opacity='1';
  });
  try {
    var res = await fetch(API+'/public/menu/'+slug);
    if (!res.ok) throw new Error('API '+res.status);
    var data = await res.json();
    var fix = function(url) {
      if (!url) return null;
      if (url.startsWith('/uploads/')) return API+url;
      return url.replace(/^https?:\/\/localhost(:\d+)?/, API);
    };
    menuData = {
      ...data,
      restaurant: {...data.restaurant, logo_url: fix(data.restaurant && data.restaurant.logo_url)},
      items: data.items.map(function(i){return {...i, image_url:fix(i.image_url)};}),
      categories: data.categories.map(function(c){return {...c, image_url:fix(c.image_url)};}),
    };
    document.title = menuData.restaurant.name || 'القائمة';
    // Update splash name
    var sn=document.getElementById('splash-name');
    if(sn) sn.textContent=menuData.restaurant.name||'القائمة';
    // Update splash logo
    if (menuData.restaurant.logo_url) {
      var sl=document.getElementById('splash-logo');
      if(sl) { sl.innerHTML='<img src="'+esc(menuData.restaurant.logo_url)+'" style="width:100%;height:100%;object-fit:cover;">'; sl.style.fontSize='0'; }
    }
    renderHeader();
    renderCategoryNav();
    renderMenuItems();
    renderCartFloat();
    renderReviewBanner();
    // Hide splash
    setTimeout(function() {
      var splash=document.getElementById('splash');
      var app=document.getElementById('app');
      splash.style.transition='opacity 0.5s';
      splash.style.opacity='0';
      setTimeout(function(){
        splash.style.display='none';
        app.style.display='';
        restoreViewMode();
      },500);
    },1200);
  } catch(err) {
    document.getElementById('splash').innerHTML='<div style="text-align:center;color:#FBF3E4;padding:40px 20px;"><div style="font-size:18px;font-weight:700;margin-bottom:8px;">تعذّر تحميل القائمة</div><div style="font-size:14px;opacity:.7;">تحقق من الرابط أو حاول مجدداً</div></div>';
    console.error(err);
  }
})();
