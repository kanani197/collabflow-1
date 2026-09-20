import axios from "axios";

const SESSION_KEY = "collabflow_session_id";

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// In local dev, "/api" is proxied to the backend by Vite (see vite.config.js).
// In a same-origin production deploy (e.g. the bundled nginx/docker-compose
// setup), "/api" also works because nginx proxies it. If the frontend and
// backend are deployed on DIFFERENT domains (e.g. a static host + a
// separate API host), set VITE_API_BASE_URL to the backend's full URL
// (e.g. https://collabflow-api.onrender.com/api) at build time.
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });

api.interceptors.request.use((config) => {
  config.headers["X-Session-Id"] = getOrCreateSessionId();
  return config;
});

export const datasetService = {
  getCurrent: () => api.get("/datasets/current").then((r) => r.data),
  analyze: (eligible = false) =>
    api.get(`/datasets/analyze?eligible=${eligible}`).then((r) => r.data),
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post("/datasets/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (onProgress) onProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      })
      .then((r) => r.data);
  },
  reset: () => api.post("/datasets/reset").then((r) => r.data),
  saveMapping: (mapping) => api.post("/datasets/mapping", { mapping }).then((r) => r.data),
};

export const feedbackService = {
  submit: (payload) => api.post("/feedback", payload).then((r) => r.data),
  summary: () => api.get("/feedback/summary").then((r) => r.data),
};

export const collaborationService = {
  list: (resource) => api.get(`/collaboration/${resource}`).then((r) => r.data),
  create: (resource, payload) => api.post(`/collaboration/${resource}`, payload).then((r) => r.data),
  update: (resource, id, payload) => api.patch(`/collaboration/${resource}/${id}`, payload).then((r) => r.data),
  remove: (resource, id) => api.delete(`/collaboration/${resource}/${id}`),
  search: (q) => api.get(`/collaboration/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};

export const exportService = {
  cleanedCsvUrl: (eligible = false) => `/api/export/cleaned-csv?eligible=${eligible}`,
  reportUrl: (eligible = false) => `/api/export/report?eligible=${eligible}`,
  downloadCsv: (eligible = false) =>
    api.get(`/export/cleaned-csv?eligible=${eligible}`, { responseType: "blob" }).then((r) => r.data),
  downloadReport: (eligible = false) =>
    api.get(`/export/report?eligible=${eligible}`, { responseType: "blob" }).then((r) => r.data),
};

export default api;
