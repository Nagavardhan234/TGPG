import axios from 'axios';
import { ENDPOINTS, BASE_URL } from '../constants/endpoints';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

export const registerManager = async (formData: any) => {
  try {
    console.log('Attempting to connect to:', BASE_URL + ENDPOINTS.MANAGER_REGISTER);
    console.log('Sending registration data:', formData);
    
    const response = await api.post(ENDPOINTS.MANAGER_REGISTER, formData);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Registration error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });

    if (error.code === 'ERR_NETWORK') {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }

    throw error.response?.data || { error: 'Registration failed' };
  }
};

export const uploadImage = async (imageUri: string) => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    const response = await axios.post(ENDPOINTS.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.imageUrl;
  } catch (error: any) {
    throw error.response?.data || { error: 'Image upload failed' };
  }
};

export const testDatabaseConnection = async () => {
  try {
    const response = await api.get(ENDPOINTS.TEST);
    console.log('Database test results:', response.data);
    return response.data;
  } catch (error) {
    console.error('Database test error:', error);
    throw error;
  }
}; 