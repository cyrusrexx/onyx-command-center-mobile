import { createContext, useContext, useState, type ReactNode } from "react";

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;        // avatar ring / accent
  bgColor: string;      // avatar background
  access: string[];     // which route paths this user can see
}

// Routes available to all staff-level users
const ALL_ROUTES = [
  "/", "/pipeline", "/production", "/environment", "/finance",
  "/maintenance", "/inventory", "/shipping", "/leads", "/vendors", "/press-log",
];

// Press operator: only operational pages — no financials, leads, shipping, command center
const PRESS_OP_ROUTES = [
  "/press-log", "/pipeline", "/production", "/environment",
  "/maintenance", "/inventory", "/vendors",
];

export const PROFILES: UserProfile[] = [
  {
    id: "moe",
    name: "Moe",
    initials: "M",
    role: "Board / Production / Sales",
    color: "#ff9100",
    bgColor: "rgba(255,145,0,0.15)",
    access: ALL_ROUTES,
  },
  {
    id: "surachai",
    name: "Surachai",
    initials: "S",
    role: "Board / Strategy / Creative",
    color: "#00e5ff",
    bgColor: "rgba(0,229,255,0.15)",
    access: ALL_ROUTES,
  },
  {
    id: "cyrus",
    name: "Cyrus",
    initials: "C",
    role: "Board / Strategy / Operations",
    color: "#00e676",
    bgColor: "rgba(0,230,118,0.15)",
    access: ALL_ROUTES,
  },
  {
    id: "maria",
    name: "Maria",
    initials: "MA",
    role: "Operations Manager",
    color: "#e040fb",
    bgColor: "rgba(224,64,251,0.15)",
    access: ALL_ROUTES,
  },
  {
    id: "matt",
    name: "Matt",
    initials: "MT",
    role: "CFO",
    color: "#ffd740",
    bgColor: "rgba(255,215,64,0.15)",
    access: ALL_ROUTES,
  },
  {
    id: "pressop1",
    name: "Press Op 1",
    initials: "P1",
    role: "Press Operator",
    color: "#69f0ae",
    bgColor: "rgba(105,240,174,0.15)",
    access: PRESS_OP_ROUTES,
  },
];

interface UserContextType {
  activeUser: UserProfile;
  setActiveUser: (user: UserProfile) => void;
}

const UserContext = createContext<UserContextType>({
  activeUser: PROFILES[0],
  setActiveUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<UserProfile>(PROFILES[0]);
  return (
    <UserContext.Provider value={{ activeUser, setActiveUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useActiveUser() {
  return useContext(UserContext);
}
