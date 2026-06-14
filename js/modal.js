/**
 * modal.js
 * Long-press detection on the Leaflet map and the "Add shop" bottom sheet.
 */

const Modal = (() => {
  const LONG_PRESS_MS = 600;

  let pressTimer   = null;
  let rippleMarker = null;
  let pendingLatLng = null;

  /* ------------------------------------------------------------------
     Long-press detection
  ------------------------------------------------------------------ */

  function attachToMap(leafletMap) {
    leafletMap.on('mousedown',  onPressStart);
    leafletMap.on('touchstart', onPressStart, { passive: true });
    leafletMap.on('mouseup',    onPressCancel);
    leafletMap.on('mousemove',  onPressCancel);
    leafletMap.on('touchend',   onPressCancel);
    leafletMap.on('touchmove',  onPressCancel);
    leafletMap.on('contextmenu', e => e.originalEvent.preventDefault());

    // Hide hint after first interaction
    leafletMap.once('mousedown', () => {
      setTimeout(UI.hideHint, 3000);
    });
  }

  function onPressStart(e) {
    pendingLatLng = e.latlng;

    const rippleIcon = L.divIcon({
      className: '',
      html: '<div class="press-ripple"></div>',
      iconAnchor: [18, 18],
    });
    rippleMarker = L.marker(e.latlng, { icon: rippleIcon, interactive: false })
      .addTo(MapView.getMap());

    pressTimer = setTimeout(() => open(e.latlng), LONG_PRESS_MS);
  }

  function onPressCancel() {
    clearTimeout(pressTimer);
    pressTimer = null;
    if (rippleMarker) { rippleMarker.remove(); rippleMarker = null; }
  }

  /* ------------------------------------------------------------------
     Bottom sheet
  ------------------------------------------------------------------ */

  async function open(latlng) {
    onPressCancel(); // clean up ripple

    pendingLatLng = latlng;

    // Reset form
    document.getElementById('m-name').value  = '';
    document.getElementById('m-price').value = '';
    document.getElementById('m-addr').value  = 'Fetching address…';
    document.getElementById('modal-coords').textContent =
      `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    document.getElementById('m-submit').disabled = false;
    document.getElementById('m-submit').textContent = 'Add to map';

    document.getElementById('add-modal').classList.add('visible');
    document.getElementById('m-name').focus();

    // Reverse geocode in background
    const addr = await Utils.reverseGeocode(latlng.lat, latlng.lng);
    document.getElementById('m-addr').value = addr;
  }

  function close() {
    document.getElementById('add-modal').classList.remove('visible');
    pendingLatLng = null;
  }

  /* ------------------------------------------------------------------
     Form submission
  ------------------------------------------------------------------ */

  async function submit() {
    const name  = document.getElementById('m-name').value.trim();
    const addr  = document.getElementById('m-addr').value.trim();
    const price = Utils.formatPrice(document.getElementById('m-price').value);

    if (!name)  { UI.toast('Please enter a coffee shop name'); return; }
    if (!price) { UI.toast('Enter a valid price like £4.50');  return; }
    if (!pendingLatLng) return;

    const btn = document.getElementById('m-submit');
    btn.disabled    = true;
    btn.textContent = 'Adding…';

    const row = {
      name,
      address: addr || `${pendingLatLng.lat.toFixed(5)}, ${pendingLatLng.lng.toFixed(5)}`,
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      price,
      updated_at: new Date().toISOString(),
    };

    try {
      const [saved] = await DB.insert(row);
      MapView.addShop(saved);
      MapView.flyTo(saved.lat, saved.lng);
      close();
      UI.toast(`Added ${name} at ${price} ✓`);
    } catch (e) {
      UI.toast('Error saving — check your Supabase config');
      console.error(e);
      btn.disabled    = false;
      btn.textContent = 'Add to map';
    }
  }

  /* ------------------------------------------------------------------
     Price input formatting
  ------------------------------------------------------------------ */

  function enforcePriceInput(el) {
    let v = el.value.replace(/[^0-9.£]/g, '');
    if (v && !v.startsWith('£')) v = '£' + v;
    el.value = v;
  }

  /* ------------------------------------------------------------------
     Backdrop click to close
  ------------------------------------------------------------------ */

  function initBackdropClose() {
    document.getElementById('add-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('add-modal')) close();
    });
  }

  return { attachToMap, open, close, submit, enforcePriceInput, initBackdropClose };
})();
