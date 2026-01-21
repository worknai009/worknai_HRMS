import {
  FaHome, FaUsers, FaClipboardList, FaRegCheckSquare, FaLayerGroup
} from "react-icons/fa";

export const PUBLIC_NAV = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Services", to: "/services" },
  { label: "About", to: "/about" },
  { label: "Free Demo", to: "/contact" },
];

export const ROLE_NAV = {
  SuperAdmin: [
    { label: "Dashboard", to: "/superadmin/dashboard", icon: FaHome },
    { label: "Inquiries", to: "/super-admin/inquiries", icon: FaClipboardList },
  ],

  CompanyAdmin: [
    { label: "Dashboard", to: "/company/dashboard", icon: FaHome },
    { label: "HR Management", to: "/company/hr-management", icon: FaUsers },
    { label: "Employees", to: "/company/employee-management", icon: FaUsers },
    // ✅ Tasks removed from CompanyAdmin navbar
    // Recruitment & Onboarding also not here (already removed earlier)
  ],

  Admin: [
    { label: "Dashboard", to: "/hr/dashboard", icon: FaHome },
    { label: "Tasks", to: "/hr/tasks", icon: FaRegCheckSquare },
  ],

  Employee: [
    { label: "Dashboard", to: "/employee/dashboard", icon: FaHome },
    { label: "Attendance", to: "/employee/attendance", icon: FaClipboardList },
    { label: "Leaves", to: "/employee/leaves", icon: FaClipboardList },
    { label: "My Tasks", to: "/employee/tasks", icon: FaRegCheckSquare },
    { label: "My Onboarding", to: "/employee/onboarding", icon: FaLayerGroup },
  ],
};
