// /api is proxied to FastAPI in local dev (vite.config.js proxy).
// On Vercel production, /api/* routes directly to the Python serverless function.
const API_BASE = '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function fetchPriceAdvisory(crop, quantity, location, grade = 'Grade A') {
  const params = new URLSearchParams({ crop, quantity, location, grade });
  const res = await fetch(`${API_BASE}/prices/advisory?${params}`);
  return res.json();
}

export async function fetchMandiOverview() {
  const res = await fetch(`${API_BASE}/prices/mandi-overview`);
  return res.json();
}

export async function sendFarmerChat(message, phone = '+91-98230-11223', name = 'Ramesh Patil', language = 'mr') {
  const res = await fetch(`${API_BASE}/farmer/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, phone, name, language })
  });
  return res.json();
}

export async function fetchLots(status, crop) {
  let url = `${API_BASE}/lots`;
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (crop) params.append('crop', crop);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url);
  return res.json();
}

export async function createLot(lotData) {
  const res = await fetch(`${API_BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lotData)
  });
  return res.json();
}

export async function fetchDemands() {
  const res = await fetch(`${API_BASE}/demands`);
  return res.json();
}

export async function createDemand(demandData) {
  const res = await fetch(`${API_BASE}/demands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demandData)
  });
  return res.json();
}

export async function fetchDemandClusters(demandId) {
  const res = await fetch(`${API_BASE}/demands/${demandId}/clusters`);
  return res.json();
}

export async function createOffer(offerData) {
  const res = await fetch(`${API_BASE}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(offerData)
  });
  return res.json();
}

export async function fetchTransactions() {
  const res = await fetch(`${API_BASE}/transactions`);
  return res.json();
}

export async function updateTransactionStatus(txId, status) {
  const res = await fetch(`${API_BASE}/transactions/${txId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function fetchGrievances() {
  const res = await fetch(`${API_BASE}/grievances`);
  return res.json();
}

export async function createGrievance(grievanceData) {
  const res = await fetch(`${API_BASE}/grievances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(grievanceData)
  });
  return res.json();
}

export async function resetDemoState() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  return res.json();
}
