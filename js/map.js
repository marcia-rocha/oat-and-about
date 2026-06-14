/**
 * map.js
 * Leaflet map initialisation, price pin rendering, popups, and user location.
 */

const MapView = (() => {
  let map;
  let userMarker = null;

  // Keyed by shop id — { marker, shop }
  const registry = {};

  /* ------------------------------------------------------------------
     Initialisation
  ------------------------------------------------------------------ */

  function init(containerId) {
    map = L.map(containerId, { zoomControl: false }).setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    return map;
  }

  /* ------------------------------------------------------------------
     User location
  ------------------------------------------------------------------ */

  function locateUser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude: lat, longitude: lng } = coords;
      if (userMarker) userMarker.remove();
      userMarker = L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: '#185FA5',
        color: '#fff',
        weight: 2.5,
        fillOpacity: 1,
      }).addTo(map).bindPopup('<b>You are here</b>');
      map.flyTo([lat, lng], 15, { duration: 1 });
    });
  }

  /* ------------------------------------------------------------------
     Price pins
  ------------------------------------------------------------------ */

  function makePriceIcon(price) {
    return L.divIcon({
      className: '',
      html: `<div class="price-pin">☕ ${escHtml(price)}</div>`,
      iconAnchor: [32, 10],
    });
  }

  function addShop(shop) {
    const marker = L.marker([shop.lat, shop.lng], {
      icon: makePriceIcon(shop.price),
    }).addTo(map);

    marker.bindPopup(buildPopupHTML(shop), { maxWidth: 240 });

    // Re-render popup content after open so edit form gets fresh state
    marker.on('popupopen', () => {
      marker.getPopup().setContent(buildPopupHTML(shop));
    });

    registry[shop.id] = { marker, shop };
    return marker;
  }

  function updateShopPrice(id, price) {
    const entry = registry[id];
    if (!entry) return;
    entry.shop.price = price;
    entry.shop.updated_at = new Date().toISOString();
    entry.marker.setIcon(makePriceIcon(price));
    entry.marker.closePopup();
  }

  function flyTo(lat, lng, zoom = 16) {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }

  /* ------------------------------------------------------------------
     Popup HTML
  ------------------------------------------------------------------ */

  function buildPopupHTML(shop) {
    return `
      <div class="popup-inner">
        <div class="popup-name">${escHtml(shop.name)}</div>
        <div class="popup-addr">${escHtml(shop.address)}</div>
        <div class="popup-price">${escHtml(shop.price)}</div>
        <div class="popup-updated">Updated ${timeAgo(shop.updated_at)}</div>
        <button class="popup-edit-btn" onclick="MapView.openEditForm('${shop.id}')">
          ✏️ Edit price
        </button>
      </div>
      <div class="edit-form" id="ef-${shop.id}">
        <label>New price</label>
        <input type="text" id="ep-${shop.id}" placeholder="${escHtml(shop.price)}"
          maxlength="6" oninput="MapView.enforcePriceInput(this)" />
        <button class="save-btn" onclick="MapView.savePrice('${shop.id}')">Save price</button>
      </div>`;
  }

  /* ------------------------------------------------------------------
     Edit price (called from popup buttons)
  ------------------------------------------------------------------ */

  function openEditForm(id) {
    const ef = document.getElementById(`ef-${id}`);
    if (!ef) return;
    ef.classList.toggle('visible');
    if (ef.classList.contains('visible')) {
      document.getElementById(`ep-${id}`)?.focus();
    }
  }

  function enforcePriceInput(el) {
    let v = el.value.replace(/[^0-9.£]/g, '');
    if (v && !v.startsWith('£')) v = '£' + v;
    el.value = v;
  }

  async function savePrice(id) {
    const input = document.getElementById(`ep-${id}`);
    if (!input) return;
    const price = Utils.formatPrice(input.value);
    if (!price) { UI.toast('Enter a valid price like £4.50'); return; }

    input.disabled = true;
    try {
      await DB.updatePrice(id, price);
      updateShopPrice(id, price);
      UI.toast('Price updated!');
    } catch (e) {
      UI.toast('Error saving — check your Supabase config');
      console.error(e);
    } finally {
      input.disabled = false;
    }
  }

  /* ------------------------------------------------------------------
     Helpers
  ------------------------------------------------------------------ */

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function getMap() { return map; }

  return {
    init,
    locateUser,
    addShop,
    flyTo,
    getMap,
    openEditForm,
    enforcePriceInput,
    savePrice,
  };
})();
