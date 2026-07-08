import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { isGlobalAdmin } from "../utils/adminLevels";
import { getApiBaseUrl } from "../utils/apiBaseUrl";
import {
  NavbarActionsGetContext,
  NavbarActionsSetContext,
} from "./navbarActionsContextValue";

function getTokenAdminLevel() {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now() || decoded.app_role !== "admin") {
      return null;
    }
    return decoded.admin_level ?? localStorage.getItem("adminLevel");
  } catch {
    return null;
  }
}

export function NavbarActionsProvider({ children }) {
  const [actions, setActions] = useState(null);
  const [isRoot, setIsRoot] = useState(() =>
    isGlobalAdmin(getTokenAdminLevel()),
  );

  useEffect(() => {
    let cancelled = false;

    const syncAdminLevel = async () => {
      const token = localStorage.getItem("authToken");
      const tokenLevel = getTokenAdminLevel();

      setIsRoot(isGlobalAdmin(tokenLevel));
      if (!token) return;

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled || !json.success || !json.user) return;

        if (json.token) {
          localStorage.setItem("authToken", json.token);
        }
        if (
          json.user.admin_level !== undefined &&
          json.user.admin_level !== null
        ) {
          localStorage.setItem("adminLevel", String(json.user.admin_level));
          setIsRoot(isGlobalAdmin(json.user.admin_level));
        }
      } catch {
        if (!cancelled) setIsRoot(isGlobalAdmin(tokenLevel));
      }
    };

    syncAdminLevel();
    return () => {
      cancelled = true;
    };
  }, []);

  const stableSetActions = useCallback((a) => setActions(a), []);

  const getValue = useMemo(() => ({ actions, isRoot }), [actions, isRoot]);

  return (
    <NavbarActionsSetContext.Provider value={stableSetActions}>
      <NavbarActionsGetContext.Provider value={getValue}>
        {children}
      </NavbarActionsGetContext.Provider>
    </NavbarActionsSetContext.Provider>
  );
}

export function NavbarActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-3 md:px-2 lg:px-3 h-8 rounded-lg text-sm font-medium text-white/85 hover:bg-lpu-gold hover:text-lpu-maroon transition-all duration-200 cursor-pointer"
    >
      {Icon && <Icon size={16} />}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
