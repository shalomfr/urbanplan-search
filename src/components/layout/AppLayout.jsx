import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Search, Bookmark } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "חיפוש", icon: Search },
  { path: "/saved", label: "שמורים", icon: Bookmark },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Outlet />

      {/* Bottom navigation for mobile / fixed nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t z-50 md:top-0 md:bottom-auto" dir="rtl">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors relative
                  ${isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <item.icon className="w-5 h-5 md:w-4 md:h-4" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 md:bottom-auto md:top-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-16 md:h-0" />
    </div>
  );
}