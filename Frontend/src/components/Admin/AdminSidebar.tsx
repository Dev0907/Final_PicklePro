import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon,
  label,
  isActive,
}) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
      isActive
        ? "bg-ocean-teal/10 text-ocean-teal"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </Link>
);

const AdminSidebar = () => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/admin/login";
  };

  const navItems = [
    {
      to: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
    // { to: '/admin/users', icon: <Users size={20} />, label: 'Users' },
    {
      to: "/admin/verifications",
      icon: <FileCheck size={20} />,
      label: "Verifications",
    },
    // { to: '/admin/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    // { to: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <span className="text-2xl font-bold text-ocean-teal">
              Pickle<span className="text-lemon-zest">Pro</span> Admin
            </span>
          </div>
          <div className="flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  isActive={location.pathname === item.to}
                />
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md mt-4"
              >
                <LogOut size={20} className="mr-3" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
