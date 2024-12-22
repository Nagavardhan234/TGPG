import { Stack } from 'expo-router';

export default function RoomManagementLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="edit-room"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 