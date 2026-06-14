/**
 * main.js
 * Entry point. Initialises all modules and loads data.
 * Nothing else should be calling DB directly — go through MapView or Modal.
 */

(async function init() {
  // Boot the map
  const leafletMap = MapView.init('map');

  // Locate the user
  MapView.locateUser();

  // Wire up long-press behaviour
  Modal.attachToMap(leafletMap);
  Modal.initBackdropClose();

  // Load all existing shops from Supabase
  try {
    const shops = await DB.getAll();
    shops.forEach(shop => MapView.addShop(shop));
  } catch (e) {
    UI.toast('Could not load data — check your Supabase config');
    console.error(e);
  }
})();
