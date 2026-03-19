import { createContext, useContext, useState, type ReactNode } from "react";

interface MobileNavContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar: () => setSidebarOpen(p => !p) }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  return useContext(MobileNavContext);
}
