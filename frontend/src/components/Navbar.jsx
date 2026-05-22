import logger from '../utils/logger.js';
import { handleError } from '../utils/errorHandler.js';
import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useUiFeedback } from "../context/UiFeedbackContext";
import NotificationBell from "./NotificationBell";
import axiosInstance from "../utils/axiosInstance";

// Import icons for navigation and actions
import {
  LayoutDashboard, // Dashboard icon (more descriptive)
  PlusCircle, // New Booking icon
  Truck, // My Fleet icon
  CalendarDays, // Bookings icon (more descriptive)
  User, // Profile icon
  LogOut,
  LogIn,
  Bell, // Notifications icon (more descriptive than LogIn)
  Users, // Users icon
  Settings, // Profile/Settings icon
  ClipboardList, // Bookings/Overview icon (more descriptive)
} from 'lucide-react';

// Helper component for the navigation links in the top icon bar (Mobile)
const MobileNavItem = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const active = location.pathname.startsWith(to) || 
                 (to.includes("dashboard") && location.pathname.includes("dashboard"));

  const activeClasses = active ? "text-slate-900 border-b-2 border-slate-900" : "text-gray-500 hover:text-slate-700";

  return (
    <Link 
      to={to} 
      onClick={onClick} 
      className={`flex flex-col items-center justify-center py-2 transition-colors ${activeClasses} w-full h-14`}
    >
      <Icon className="w-6 h-6" /> 
      <span className="text-xs font-medium sr-only">{label}</span>
    </Link>
  );
};

const Navbar = () => {
  const { user, logout, isAuthenticated, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const { confirm } = useUiFeedback();

  // Update local user state when context user changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Also check localStorage as fallback
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.profileImageUrl && !user?.profileImageUrl) {
          setCurrentUser(parsedUser);
        }
      } catch (error) {
        logger.error('Error parsing stored user', { error });
      }
    }
  }, [user]);

  // Fetch latest user data if profileImageUrl is missing
  useEffect(() => {
    if (isAuthenticated && (!currentUser?.profileImageUrl || !user?.profileImageUrl)) {
      const fetchLatestUserData = async () => {
        try {
          const response = await axiosInstance.get('/auth/me');
          const latestUserData = response.data?.data;
          if (latestUserData?.profileImageUrl) {
            logger.debug('Navbar - Fetched latest user data with profile image', { userData: latestUserData });
            setCurrentUser(latestUserData);
            // Update AuthContext as well
            if (updateUser) {
              updateUser(latestUserData);
            }
          }
        } catch (error) {
          logger.error('Navbar - Error fetching latest user data', { error });
        }
      };
      fetchLatestUserData();
    }
  }, [isAuthenticated, currentUser?.profileImageUrl, user?.profileImageUrl, updateUser]);

  // Debug: Log user data to check if profileImageUrl is present
  logger.debug('Navbar - User data', { user });
  logger.debug('Navbar - CurrentUser data', { currentUser });
  logger.debug('Navbar - ProfileImageUrl', { profileImageUrl: currentUser?.profileImageUrl });
  logger.debug('Navbar - User name', { userName: currentUser?.name }); 

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      cancelText: "Cancel"
    });
    
    if (confirmed) {
      logout();
      navigate("/login");
      setMobileMenuOpen(false);
    }
  };

  const showBell = isAuthenticated && (user?.role === "customer" || user?.role === "owner" || user?.role === "admin");
  const isMobileIconNavUser = isAuthenticated && (user?.role === "customer" || user?.role === "owner" || user?.role === "admin");
  
  let mobileNavLinks = [];
  if (user?.role === "customer") {
    mobileNavLinks = [
      { to: "/customer/dashboard", icon: LayoutDashboard, label: "My Bookings" }, 
      { to: "/customer/new-booking", icon: PlusCircle, label: "New Booking" }, 
      { to: "/trucks", icon: Truck, label: "Browse Trucks" }, 
      { to: "/customer/profile", icon: User, label: "Profile" }, 
    ];
  } else if (user?.role === "owner") {
    mobileNavLinks = [
      { to: "/owner/dashboard", icon: LayoutDashboard, label: "Dashboard" }, 
      { to: "/owner/my-fleet", icon: Truck, label: "My Fleet" }, 
      { to: "/owner/bookings", icon: CalendarDays, label: "Bookings" }, 
      { to: "/owner/profile", icon: User, label: "Profile" },
    ];
  } else if (user?.role === "admin") {
    mobileNavLinks = [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" }, 
      { to: "/admin/notifications", icon: Bell, label: "Notifications" }, 
      { to: "/admin/users", icon: User, label: "Users" }, 
      { to: "/admin/fleet", icon: Truck, label: "Fleet" },
      { to: "/admin/bookings", icon: CalendarDays, label: "Bookings" }, 
      { to: "/admin/profile", icon: Settings, label: "Profile" }, 
    ];
  }
  
  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const renderNavLinks = (isMobile = false) => {
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition"
      : "px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 transition";

    if (!isAuthenticated) return null;
    
    if (user?.role === "admin") {
      return (
        <>
          <Link 
            to="/admin/dashboard" 
            onClick={isMobile ? handleMobileLinkClick : undefined}
            className={baseClasses}>
            <LayoutDashboard className="w-4 h-4 inline-block mr-2" />
            Dashboard
          </Link>
          <Link 
            to="/admin/notifications" 
            onClick={isMobile ? handleMobileLinkClick : undefined}
            className={baseClasses}>
            <Bell className="w-4 h-4 inline-block mr-2" />
            Notifications
          </Link>
          <Link 
            to="/admin/users" 
            onClick={isMobile ? handleMobileLinkClick : undefined}
            className={baseClasses}>
            <User className="w-4 h-4 inline-block mr-2" />
            Users
          </Link>
          <Link 
            to="/admin/fleet" 
            onClick={isMobile ? handleMobileLinkClick : undefined}
            className={baseClasses}>
            <Truck className="w-4 h-4 inline-block mr-2" />
            Fleet
          </Link>
          <Link 
            to="/admin/bookings" 
            onClick={isMobile ? handleMobileLinkClick : undefined}
            className={baseClasses}>
            <CalendarDays className="w-4 h-4 inline-block mr-2" />
            Bookings
          </Link>
          <Link 
            to="/admin/profile" 
            onClick={isMobile ? handleMobileLinkClick : undefined}
            className={baseClasses}>
            <Settings className="w-4 h-4 inline-block mr-2" />
            Profile
          </Link>
        </>
      );
    } 
    
    // Customer/Owner desktop links
    if (!isMobileIconNavUser) return null; 
    
    return (
      <>
        {user?.role === "customer" && (
          <>
            <Link to="/customer/dashboard" className={baseClasses}>My Bookings</Link>
            <Link to="/customer/new-booking" className={baseClasses}>New Booking</Link>
            <Link to="/trucks" className={baseClasses}>Browse Trucks</Link>
          </>
        )}
        {user?.role === "owner" && (
          <>
            <Link to="/owner/dashboard" className={baseClasses}>Dashboard</Link>
            <Link to="/owner/my-fleet" className={baseClasses}>My Fleet</Link>
            <Link to="/owner/bookings" className={baseClasses}>Bookings</Link>
          </>
        )}
        <Link to={`/${user?.role}/profile`} className={baseClasses}>Profile</Link>
      </>
    );
  };

  return (
    <>
      {/* 1. Main Header Bar (Logo/Name and Actions) - Height h-12 (48px) for mobile/tablet, h-16 (64px) for laptop */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center h-12 md:h-16 w-full"> 

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="CargoNepal" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Nav Links (Hidden on mobile) - UNCHANGED */}
            <div className="hidden md:flex flex-1 justify-center items-center">
              {isAuthenticated && (
                <div className="flex space-x-3 items-center">
                  {renderNavLinks(false)}
                  {showBell && <NotificationBell className="ml-2" />}
                </div>
              )}
            </div>

            {/* Desktop Right Side (Avatar and Logout) - UNCHANGED */}
            <div className="hidden md:flex flex-shrink-0 items-center justify-end space-x-3 ml-auto">
              {isAuthenticated ? (
                <>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                    {/* Debug indicator - remove later */}
                    {currentUser?.profileImageUrl && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="Has profile image"></div>
                    )}
                    {currentUser?.profileImageUrl ? (
                      <img 
                        src={currentUser.profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          logger.debug('Navbar - Profile image failed to load', { imageUrl: currentUser.profileImageUrl });
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={() => {
                          logger.debug('Navbar - Profile image loaded successfully', { imageUrl: currentUser.profileImageUrl });
                        }}
                      />
                    ) : null}
                    <div className="text-white text-xs md:text-sm font-semibold" style={{ display: currentUser?.profileImageUrl ? 'none' : 'flex' }}>
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition flex items-center space-x-1">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm">
                  Login
                </Link>
              )}
            </div>

            {/* ⭐️ Mobile Actions (Visible only on mobile) ⭐️ */}
            <div className="flex md:hidden items-center ml-auto space-x-1">
              
              {isAuthenticated ? (
                // --- Authenticated Users ---
                <>
                  {/* REMOVED: Bell from here (kept in Icon Nav Bar) */}
                  
                  {/* Logout Button (Common for all authenticated users) */}
                  <button 
                    onClick={handleLogout}
                    className="p-1 rounded-lg text-gray-700 hover:bg-gray-100 transition" 
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5" /> 
                  </button>
                </>
              ) : (
                // --- Unauthenticated User: Show Login Icon ---
                <Link 
                  to="/login" 
                  className="p-1 rounded-lg text-gray-700 hover:bg-gray-100 transition" 
                  aria-label="Login"
                >
                  <LogIn className="w-5 h-5" /> 
                </Link>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* 2. Mobile Top Icon Navigation Bar (Customer/Owner) - Height h-14 (56px) */}
      {isMobileIconNavUser && (
        <div className="bg-white border-b border-gray-200 sticky top-12 z-40 w-full md:hidden">
          <div className="max-w-7xl mx-auto px-2">
            <div className="flex justify-around items-center h-14"> 
              {mobileNavLinks.map((link, index) => (
                <MobileNavItem 
                  key={index} 
                  to={link.to} 
                  icon={link.icon} 
                  label={link.label} 
                  onClick={handleMobileLinkClick} 
                />
              ))}
              {/* Notification Bell Icon - ONLY place it is rendered */}
              <div 
                className={`flex flex-col items-center justify-center py-2 transition-colors w-full h-14 text-gray-500 hover:text-slate-700`}
              >
                {showBell && <NotificationBell className="w-6 h-6" />}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;