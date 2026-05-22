import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UiFeedbackProvider } from './context/UiFeedbackContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import VerifyResetOtp from './pages/VerifyResetOtp';
import ResetPassword from './pages/ResetPassword';
import Trucks from './pages/Trucks';
import TruckDetail from './pages/TruckDetail';
import Dashboard from './pages/Dashboard';
import NewBooking from './pages/NewBooking';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerMyFleet from './pages/OwnerMyFleet';
import OwnerBookings from './pages/OwnerBookings';
import Payment from './pages/Payment';
// Admin individual pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFleet from './pages/admin/AdminFleet';
import AdminBookings from './pages/admin/AdminBookings';
import AdminProfile from './pages/admin/AdminProfile';
import AdminVerification from './pages/admin/AdminVerification';
import AdminNotificationCenter from './pages/admin/AdminNotificationCenter';
import AdminNotificationSettings from './pages/admin/AdminNotificationSettings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';
import About from './pages/About';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import FAQ from './pages/FAQ';
import Cookies from './pages/Cookies';

function App() {
  return (
    <AuthProvider>
      <UiFeedbackProvider>
        <Router future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true 
        }}>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/trucks" element={<Trucks />} />
            <Route path="/trucks/:id" element={<TruckDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/cookies" element={<Cookies />} />

            {/* Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/new-booking"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <NewBooking />
                </ProtectedRoute>
              }
            />
            <Route path="/bookings/new" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <NewBooking />
                </ProtectedRoute>
              } />
            <Route path="/payments/:bookingId" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Payment />
                </ProtectedRoute>
              } />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Owner Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/my-fleet"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerMyFleet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/fleet/:id"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <TruckDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/bookings"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/profile"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotificationCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notification-settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotificationSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fleet"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminFleet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/verification/:userType/:userId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminVerification />
                </ProtectedRoute>
              }
            />

            {/* Redirect old admin dashboard route to overview */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigate to="/admin/overview" replace />
                </ProtectedRoute>
              }
            />

            {/* Redirect old dashboard route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/customer/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </UiFeedbackProvider>
    </AuthProvider>
  );
}

export default App;
