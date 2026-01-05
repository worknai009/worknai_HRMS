import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context & Utils
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./utils/ScrollToTop";

// Common Components
import Navbar from "./components/Common/Navbar";
import Footer from "./components/Common/Footer";

// Landing Pages
import Home from "./pages/Landing/Home";
import About from "./pages/Landing/About";
import Services from "./pages/Landing/Services";
import Features from "./pages/Landing/Features";
import Contact from "./pages/Landing/Contact";

// Auth Pages
import SuperAdminLogin from "./pages/Auth/SuperAdminLogin";
import CompanyLogin from "./pages/Auth/CompanyLogin";
import AdminLogin from "./pages/Auth/AdminLogin";
import EmployeeLogin from "./pages/Auth/EmployeeLogin";
import Register from "./pages/Auth/Register";
import CompanyInquiry from "./pages/Auth/CompanyInquiry";

// Dashboards & Modules
import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";
import InquiryManagement from "./pages/SuperAdmin/InquiryManagement";

import CompanyDashboard from "./pages/Company/CompanyDashboard";
import HRManagement from "./pages/Company/HRManagement";
// ✅ IMPORT NEW EMPLOYEE MANAGEMENT PAGE
import EmployeeManagement from "./pages/Company/EmployeeManagement";

import HrAdminDashboard from "./pages/Admin/HrAdminDashboard";
import AdminEmployeeView from "./pages/Admin/HrAdminEmployeeView";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import Attendance from "./pages/Employee/Attendance";
import LeaveRequest from "./pages/Employee/LeaveRequest";

/* =========================================================
   CONDITIONAL FOOTER COMPONENT
   ========================================================= */
const ConditionalFooter = () => {
  const location = useLocation();

  const hideFooterPrefixes = [
    "/superadmin",
    "/super-admin",
    "/company",
    "/hr",
    "/employee",
  ];

  const shouldHide = hideFooterPrefixes.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  if (shouldHide) {
    return null;
  }

  return <Footer />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        <Navbar />

        <div className="main-content">
          <Routes>
            {/* ---------------- PUBLIC ROUTES ---------------- */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/features" element={<Features />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/partner-with-us" element={<CompanyInquiry />} />

            {/* ---------------- AUTH ROUTES ---------------- */}
            <Route path="/super-admin-login" element={<SuperAdminLogin />} />
            <Route path="/company-login" element={<CompanyLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/employee-login" element={<EmployeeLogin />} />
            <Route path="/register" element={<Register />} />

            {/* ---------------- SUPER ADMIN ---------------- */}
            <Route element={<ProtectedRoute allowedRoles={["SuperAdmin"]} />}>
              <Route
                path="/superadmin/dashboard"
                element={<SuperAdminDashboard />}
              />
              <Route
                path="/super-admin/inquiries"
                element={<InquiryManagement />}
              />
            </Route>

            {/* ---------------- COMPANY OWNER ---------------- */}
            <Route element={<ProtectedRoute allowedRoles={["CompanyAdmin"]} />}>
              <Route path="/company/dashboard" element={<CompanyDashboard />} />
              <Route path="/company/hr-management" element={<HRManagement />} />

              {/* ✅ NEW ROUTE FOR MANAGING EMPLOYEES (EDIT ID/PASS) */}
              <Route
                path="/company/employee-management"
                element={<EmployeeManagement />}
              />
            </Route>

            {/* ---------------- HR ADMIN ---------------- */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="/hr/dashboard" element={<HrAdminDashboard />} />
              <Route
                path="/hr/view-employee/:userId"
                element={<AdminEmployeeView />}
              />
            </Route>

            {/* ---------------- EMPLOYEE ---------------- */}
            <Route
              element={<ProtectedRoute allowedRoles={["Employee", "Admin"]} />}
            >
              <Route
                path="/employee/dashboard"
                element={<EmployeeDashboard />}
              />
              <Route path="/employee/attendance" element={<Attendance />} />
              <Route path="/employee/leaves" element={<LeaveRequest />} />
            </Route>

            {/* ---------------- 404 FALLBACK ---------------- */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>

        <ConditionalFooter />

        <style>{`
          body {
            margin: 0;
            background: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .main-content {
            min-height: calc(100vh - 120px);
            padding-top: 80px;
          }
        `}</style>
      </AuthProvider>
    </Router>
  );
}

export default App;
