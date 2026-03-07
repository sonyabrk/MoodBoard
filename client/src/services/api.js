const API_BASE = 'http://localhost:8000/api';

export const api = {
  checkUsername: async (username) => {
    const response = await fetch(`${API_BASE}/creators/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    
    return response.json();
  },
  
  createCreatorApplication: async (data) => {
    const response = await fetch(`${API_BASE}/creators/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка при отправке заявки');
    }
    
    return response.json();
  },
};