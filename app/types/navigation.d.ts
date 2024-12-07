declare module "expo-router" {
  export interface RouteMap {
    "/screens/ManagerRegistration": undefined;
    "/screens/MemberRegistration": undefined;
    "/screens/LoginScreen": undefined;
  }

  // Add the missing exports
  export const router: {
    push: (route: keyof RouteMap) => void;
    replace: (route: keyof RouteMap) => void;
    back: () => void;
  };

  export const Link: React.FC<{
    href: keyof RouteMap;
    asChild?: boolean;
    children: React.ReactNode;
  }>;
} 