# Network Setup and Troubleshooting Guide

## Overview
This document explains the network handling implementation in the TGPG app, including offline support, state management, and troubleshooting steps.

## Architecture

### 1. Network State Management
- Location: `app/stores/networkStore.ts`
- Uses Zustand for state management
- Tracks:
  - Connection status
  - Network type
  - Internet reachability

### 2. Network Monitoring
- Location: `app/utils/networkStatus.ts`
- Features:
  - Real-time connection monitoring
  - Connection status checks
  - Network info retrieval

### 3. Network Provider
- Location: `app/providers/NetworkProvider.tsx`
- Features:
  - Initialization handling
  - Loading states
  - Offline notifications
  - Safe area handling

### 4. API Integration
- Location: `app/services/api.ts`
- Features:
  - Request queueing for offline mode
  - Cache management
  - Rate limiting
  - Error handling

## Setup Steps

1. **Install Dependencies**
```bash
npx expo install @react-native-community/netinfo
npm install axios-rate-limit
```

2. **Provider Setup**
```tsx
// In _layout.tsx
import { NetworkProvider } from './providers/NetworkProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        {/* Other providers */}
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
```

3. **API Configuration**
```typescript
// In api.config.ts
export const API_CONFIG = {
  TIMEOUT: 30000,
  RATE_LIMIT: {
    MAX_REQUESTS: 20,
    PER_MILLISECONDS: 1000,
  },
};
```

## Troubleshooting

### Common Issues

1. **Blank Screen on Startup**
- Check if NetworkProvider is properly initialized
- Verify SafeAreaProvider is the root provider
- Check for circular dependencies in imports

2. **Network Status Not Updating**
- Verify NetInfo installation
- Check network store subscription
- Ensure NetworkProvider is mounted

3. **API Calls Not Working**
- Check API configuration
- Verify rate limiting setup
- Check request queue implementation

### Debug Steps

1. **Check Network Status**
```typescript
import { checkConnection } from '../utils/networkStatus';

const isConnected = await checkConnection();
console.log('Network status:', isConnected);
```

2. **Monitor Network Store**
```typescript
import { useNetworkStore } from '../stores/networkStore';

const networkState = useNetworkStore.getState();
console.log('Network state:', networkState);
```

3. **Test API Queue**
```typescript
// Make offline request
await api.get('/endpoint', {
  cache: {
    key: 'cache_key',
    duration: 5 * 60 * 1000, // 5 minutes
  },
});
```

## Best Practices

1. **Offline Support**
- Always implement cache for critical data
- Use request queueing for important operations
- Show appropriate offline UI feedback

2. **Error Handling**
- Handle network errors gracefully
- Show user-friendly error messages
- Implement retry mechanisms

3. **Performance**
- Use appropriate cache durations
- Implement rate limiting
- Monitor queue size

## Testing

1. **Network Conditions**
- Test with airplane mode
- Test with slow connections
- Test offline to online transitions

2. **API Behavior**
- Test request queueing
- Verify cache behavior
- Check rate limiting

3. **UI Feedback**
- Verify offline indicators
- Check loading states
- Test error messages

## Support

For additional support:
1. Check the implementation files in `app/utils/` and `app/services/`
2. Review the network store in `app/stores/networkStore.ts`
3. Verify provider setup in `app/providers/NetworkProvider.tsx`
4. Check API configuration in `app/config/api.config.ts` 