import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Wrench,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Usb,
  ClipboardPenLine,
  Languages,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import api from "../api/axios";

const menu = [
  {
    title: "sideNav.dash", // Use translation keys here
    items: [
      {
        name: "sideNav.pinDash",
        path: "/dashboard/pins",
        icon: LayoutDashboard,
        moduleCode: "pins_dashboard",
      },
      {
        name: "sideNav.itDash",
        path: "/dashboard/it-stock",
        icon: LayoutDashboard,
        moduleCode: "it_stock_dashboard",
      },
    ],
  },
  {
    title: "sideNav.pins",
    items: [
      {
        name: "sideNav.pin",
        path: "/pins",
        icon: Usb,
        moduleCode: "pins",
      },
      {
        name: "sideNav.pinsInventory",
        path: "/pin/inventory",
        icon: ClipboardPenLine,
        moduleCode: "pin_inventory",
      },
      {
        name: "sideNav.pinsUsage",
        path: "/pin/inbound-usage",
        icon: ArrowRightLeft,
        moduleCode: "pin_inbound",
      },
    ],
  },
  {
    title: "sideNav.it",
    items: [
      {
        name: "sideNav.itStocks",
        path: "/it-stock",
        icon: Package,
        moduleCode: "it_stocks",
      },
      {
        name: "sideNav.maintenance",
        path: "/maintenance",
        icon: Wrench,
        moduleCode: "maintenance",
      },
      {
        name: "sideNav.movement",
        path: "/movement",
        icon: ArrowRightLeft,
        moduleCode: "equipment_movement",
      },
    ],
  },
  {
    title: "sideNav.admin",
    items: [
      {
        name: "sideNav.user",
        path: "/users",
        icon: Users,
        moduleCode: "users",
      },
      {
        name: "sideNav.logs",
        path: "/logs",
        icon: ClipboardList,
        moduleCode: "logs",
      },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState("en"); // Language state: 'en' or 'ko'

  const currentLang = i18n.language || "en";

  const toggleLanguage = () => {
    const nextLang = currentLang.startsWith("en") ? "ko" : "en";
    setLang((prev) => (prev === "en" ? "ko" : "en"));
    i18n.changeLanguage(nextLang);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberMe");

      window.location.href = "/login";
    }
  };

  let user = {
    role: "",
    modules: [] as string[],
  };

  try {
    const stored = localStorage.getItem("user");

    if (stored && stored !== "undefined") {
      user = JSON.parse(stored);
    }
  } catch (err) {
    console.error("Invalid user in localStorage", err);
  }

  const modules = user.modules ?? [];

  const filteredMenu =
    user.role === "SUPER_ADMIN"
      ? menu
      : menu
          .map((section) => ({
            ...section,
            items: section.items.filter((item) =>
              modules.includes(item.moduleCode),
            ),
          }))
          .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`
        bg-slate-900
        text-white
        h-screen
        border-r
        border-slate-800
        flex
        flex-col
        transition-all
        duration-300
        ${collapsed ? "w-20" : "w-72"}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div>
            <h1 className="font-bold text-lg">{t("sideNav.itInventory")}</h1>
            <p className="text-xs text-slate-400">{t("sideNav.assemgmnt")}</p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation links area */}
      <div className="overflow-y-auto flex-1">
        {filteredMenu.map((section) => (
          <div key={section.title} className="mt-4">
            {!collapsed && (
              <div className="px-4 text-xs uppercase text-slate-500 mb-2">
                {t(section.title)}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    flex items-center
                    gap-3
                    mx-2
                    px-3
                    py-3
                    rounded-xl
                    transition
                    ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "hover:bg-slate-800 text-slate-300"
                    }
                  `
                  }
                >
                  <Icon size={20} />
                  {!collapsed && <span>{t(item.name)}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Sticky Actions */}
      <div className="border-t border-slate-800 p-3 flex flex-col gap-1.5">
        {/* Sleek Language Switcher UI */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm transition"
        >
          <div className="flex items-center gap-3">
            <Languages size={20} className="text-slate-400" />
            {!collapsed && <span>Language / 언어</span>}
          </div>
          {!collapsed && (
            <span className="text-xs font-bold bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-md">
              {lang === "en" ? "EN" : "KO"}
            </span>
          )}
          {collapsed && (
            <span className="text-[10px] block w-full text-center font-bold text-blue-400">
              {lang.toUpperCase()}
            </span>
          )}
        </button>

        {/* Logout Button */}
        <button
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition"
          onClick={logout}
        >
          <LogOut size={20} />
          {!collapsed && <span>{t("sideNav.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
