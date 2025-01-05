import api from './api';
import { ENDPOINTS } from '@/app/constants/endpoints';
import { Platform } from 'react-native';

export const uploadImage = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();
    
    // Check if the image is base64
    if (imageUri.startsWith('data:image')) {
      // Convert base64 to blob
      const base64Data = imageUri.split(',')[1];
      const imageType = imageUri.split(';')[0].split('/')[1];
      
      // Create Blob from base64
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: `image/${imageType}` });
      
      // Append blob to FormData
      formData.append('image', blob, `image.${imageType}`);
    } else {
      // Handle regular file URI
      const filename = imageUri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1].toLowerCase() : 'jpg';
      
      const file = {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        type: `image/${extension}`,
        name: `image.${extension}`
      };
      
      formData.append('image', file as any);
    }

    console.log('Making upload request...');
    
    const response = await api.post(ENDPOINTS.UPLOAD_IMAGE, formData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.data.success) {
      return response.data.imageUrl;
    } else {
      throw new Error(response.data.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}; 