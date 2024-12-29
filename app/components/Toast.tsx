import React from 'react';
import FlashMessage from 'react-native-flash-message';

const Toast: React.FC = () => {
  return (
    <FlashMessage 
      position="top"
      floating={true}
      style={{
        marginTop: 20,
        marginHorizontal: 20,
      }}
    />
  );
};

export default Toast; 