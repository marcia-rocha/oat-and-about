/**
 * utils.js
 * Pure helper functions with no side effects.
 * Nothing here touches the DOM or makes network calls.
 */

const Utils = (() => {
  /**
   * Parses a raw price string and returns a formatted £X.XX string,
   * or null if the input is not a valid price.
   */
  function formatPrice(raw) {
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0 || num > 99) return null;
    return '£' + num.toFixed(2);
  }

  /**
   * Reverse geocodes a lat/lng using the free Nominatim API.
   * Returns a display address string, or an empty string on failure.
   */
  async function reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      return data.display_name || '';
    } catch {
      return '';
    }
  }

  return { formatPrice, reverseGeocode };
})();
