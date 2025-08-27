import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useContext } from "react";

import Login from "./components/Login";
import Signup from "./components/Signaup";
import { AuthProvider, AuthContext } from "./components/AuthContext";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AllAdmin from "./components/AllAccounts";
import Profile from "./components/Profile";
import Setting from "./components/Setting";
import QRGenerator from "./components/QRGenerator";
import QRScanner from "./components/QRScanner";
import Department from "./ApplicationFeatures/Department";
import Designation from "./ApplicationFeatures/Designation";
import AllF from "./ApplicationFeatures/ALL";
import { CartProvider } from './Contex/NotificationConterContex';
import { NotificationProvider } from './Contex/NotificationMessage';
import QRForm from './components/QrForm';
import FormSubmission from './Dashboard/FormSubmissionDash';
import LocationList from './ApplicationFeatures/LocationList';
import Home from './pages/Home';
import About from './pages/About';
import FAQ from './pages/FAQ';
import GetStarted from './pages/GetStarted';
import Contact from './pages/Contact';
import Usage from "./components/Usages";
import Dash from './Dashboard/Dash';
import Location from './components/Location';
import ApplicationType from "./ApplicationFeatures/ApplicationType";
import Members from './members/Members';
import A4Customizer from './components/A4Customizer';
import VerifyOtp from "./components/VerifyOtp";
import  ApplicationStatus      from './ApplicationFeatures/ApplicationStatus'
import Demo from "./components/Demo";
function ProtectedLayout({ children }) {
  const location = useLocation();
  const hideNavbarRoutes = ["/verify-otp"];
  const showNavbar = !hideNavbarRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-800">
      {showNavbar && <Navbar />}
      <main className="flex-grow">{children}</main>
    </div>
  );
}

function PublicLayout({ children }) {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/signup", "/reset-password", "/formsubmission"];
  const showNavbar = !hideNavbarRoutes.some(route => location.pathname.startsWith(route));
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 text-[12px]">
      {showNavbar && <Navbar />}
      <main className="flex-grow">{children}</main>
    </div>
  );
}

// This checks if user is logged in and redirects from "/" to "/dashboard"
function HomeRedirect() {
  const { user } = useContext(AuthContext);
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Home />;
}

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout><HomeRedirect /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
      <Route path="/usage" element={<PublicLayout><Usage /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
      <Route path="/get-started" element={<PublicLayout><GetStarted /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />
      <Route path="/formsubmission/:id?" element={<PublicLayout><QRForm /></PublicLayout>} />
      <Route path="/application-list" element={<PublicLayout><ApplicationType /></PublicLayout>} />
      <Route path="/demo" element={<PublicLayout><Demo/></PublicLayout>}/>
      {/* Protected Routes */}
      <Route path="/verify-otp" element={<ProtectedRoute><ProtectedLayout><VerifyOtp /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/all" element={<ProtectedRoute><ProtectedLayout><AllF /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/location-list" element={<ProtectedRoute><ProtectedLayout><LocationList /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/form-submission" element={<ProtectedRoute><ProtectedLayout><FormSubmission /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/qrgenerator" element={<ProtectedRoute><ProtectedLayout><QRGenerator /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/department" element={<ProtectedRoute><ProtectedLayout><Department /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/qr-scanner" element={<ProtectedRoute><ProtectedLayout><QRScanner /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><ProtectedLayout><Dash /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/designation" element={<ProtectedRoute><ProtectedLayout><Designation /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/alladmin" element={<ProtectedRoute><ProtectedLayout><AllAdmin /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProtectedLayout><Profile /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><Setting /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><ProtectedLayout><Members /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/status" element={<ProtectedRoute><ProtectedLayout><ApplicationStatus/></ProtectedLayout></ProtectedRoute>} />
      <Route path="/a4-customizer/:qrCode" element={<ProtectedRoute><ProtectedLayout><A4Customizer /></ProtectedLayout></ProtectedRoute>} />
      {/* Coming Soon Routes */}
      <Route path="/interview" element={<ProtectedRoute><ProtectedLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="font-semibold text-gray-900 dark:text-white text-[12px]">Interview Management</h1>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mt-6">
            <p className="text-gray-600 dark:text-gray-300 text-[12px]">Welcome to the Interview Management page. Coming soon...</p>
            <div className="mt-6">
              <button className="px-4 py-2 bg-pink-600 text-white rounded-lg text-[12px]" disabled>
                Coming Soon: Schedule an Interview
              </button>
            </div>
          </div>
        </div>
      </ProtectedLayout></ProtectedRoute>} />
      <Route path="/forvistis" element={<ProtectedRoute><ProtectedLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="font-semibold text-gray-900 dark:text-white text-[12px]">Visitor Management</h1>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mt-6">
            <p className="text-gray-600 dark:text-gray-300 text-[12px]">Visitor management features coming soon.</p>
            <div className="mt-6">
              <button className="px-4 py-2 bg-pink-600 text-white rounded-lg text-[12px]" disabled>
                Coming Soon: Manage Visitors
              </button>
            </div>
          </div>
        </div>
      </ProtectedLayout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;