/**
 * db.js
 * Thin wrapper around the Supabase REST API.
 * All network calls live here — nothing else talks to Supabase directly.
 */

const DB = (() => {
  function headers() {
    return {
      'apikey': CONFIG.supabaseAnonKey,
      'Authorization': 'Bearer ' + CONFIG.supabaseAnonKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

  const base = () => `${CONFIG.supabaseUrl}/rest/v1/shops`;

  async function request(url, options = {}) {
    const res = await fetch(url, { ...options, headers: headers() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase error ${res.status}: ${text}`);
    }
    return res.json();
  }

  return {
    /** Fetch all shops, newest first */
    getAll() {
      return request(`${base()}?select=*&order=updated_at.desc`);
    },

    /** Insert a new shop row */
    insert(shop) {
      return request(base(), {
        method: 'POST',
        body: JSON.stringify(shop),
      });
    },

    /** Update price (and updated_at) for a given shop id */
    updatePrice(id, price) {
      return request(`${base()}?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ price, updated_at: new Date().toISOString() }),
      });
    },
  };
})();
