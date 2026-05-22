const API_BASE_URL = 'http://localhost:3001';

export const apiClient = {
  getActivities: async () => {
    const res = await fetch(`${API_BASE_URL}/activities`);
    return res.json();
  },
  getActivityById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/activities/${id}`);
    return res.json();
  },
  getRaces: async () => {
    const res = await fetch(`${API_BASE_URL}/races`);
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(`${API_BASE_URL}/stats`);
    return res.json();
  },
  getPlans: async () => {
    const res = await fetch(`${API_BASE_URL}/plans`);
    return res.json();
  }
};
