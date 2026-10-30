// Thin fetch client. Every list endpoint returns { data, meta } (see Section 9.2).
async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
  }
  const send = () =>
    fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  const isShell = (r) => url.pathname.startsWith('/api') && !(r.headers.get('content-type') ?? '').includes('json')
  let res
  try {
    res = await send()
    // The mock service worker may have been evicted while idle: restart it and retry here,
    // so the person never sees an error or has to reload the project.
    for (let attempt = 0; attempt < 3 && isShell(res) && window.__NEEDIBI_REVIVE_MOCKS__; attempt++) {
      await window.__NEEDIBI_REVIVE_MOCKS__().catch(() => {})
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)))
      res = await send()
    }
  } catch (cause) {
    const err = new Error("You're offline or the server can't be reached. Check your connection and try again.")
    err.status = 0
    err.body = {}
    err.cause = cause
    throw err
  }
  // If the mock service isn't answering yet we get the HTML page back instead of data.
  // Treat that as a temporary error (so it retries) rather than silently showing an empty list.
  const type = res.headers.get('content-type') ?? ''
  if (url.pathname.startsWith('/api') && !type.includes('json')) {
    // The service worker was evicted (commonly while the tab sat idle). Restart it, then let the
    // query retry — the caller keeps showing the data it already has in the meantime.
    if (window.__NEEDIBI_REVIVE_MOCKS__) await window.__NEEDIBI_REVIVE_MOCKS__().catch(() => {})
    const err = new Error(window.__NEEDIBI_MOCKS_FAILED__ ? 'The data service is unavailable in this browser. Open the site over HTTPS (or localhost) and reload.' : 'Reconnecting…')
    err.status = window.__NEEDIBI_MOCKS_FAILED__ ? 0 : 503
    err.body = {}
    throw err
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.message || `Request failed (${res.status})`)
    err.status = res.status
    err.body = json
    throw err
  }
  return json
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),

  /** Generic paginated list: GET /api/r/:resource?page&pageSize&sort&q&... */
  list: async (resource, params) => {
    const json = await request(`/api/r/${resource}`, { params })
    return { ...json, data: Array.isArray(json?.data) ? json.data : [], meta: json?.meta ?? {} }
  },
  one: (resource, id) => request(`/api/r/${resource}/${encodeURIComponent(id)}`),
  update: (resource, id, body) => request(`/api/r/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  create: (resource, body) => request(`/api/r/${resource}`, { method: 'POST', body }),
}
