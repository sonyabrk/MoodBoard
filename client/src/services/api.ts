const API_BASE = 'http://localhost:8000/api';

interface UsernameCheckResponse {
  available: boolean
  message: string
}
 
interface CreatorApplicationData {
  first_name: string
  last_name: string
  email: string
  username: string
  portfolio_url: string
}
 
interface CreatorApplicationResponse {
  message: string
  application_id: number
}

export const api = {
  checkUsername: async (username: string): Promise<UsernameCheckResponse> => {
    const response = await fetch(`${API_BASE}/creators/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    
    return response.json();
  },
  
  createCreatorApplication: async (data: CreatorApplicationData): Promise<CreatorApplicationResponse> => {
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