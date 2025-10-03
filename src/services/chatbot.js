// Get backend URL from environment variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const API_BASE = `${BACKEND_URL}/api/chatbot`;

export const chatbot = {
  // Send chat message
  async chat(message, userId) {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return data.data.response;
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  },

  // Get suggestions
  async getSuggestions(userId) {
    try {
      const res = await fetch(`${API_BASE}/suggestions/${userId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return data.data.suggestions;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return []; // Return empty array on error
    }
  },

  // Get history
  async getHistory(userId, limit = 20) {
    try {
      const res = await fetch(`${API_BASE}/history/${userId}?limit=${limit}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return data.data.history;
    } catch (error) {
      console.error('Error fetching history:', error);
      return []; // Return empty array on error
    }
  }
};

