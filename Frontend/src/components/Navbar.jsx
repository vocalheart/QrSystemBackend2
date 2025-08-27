import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  QrCodeIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  InformationCircleIcon,
  ArrowLeftOnRectangleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { NotificationMessageContext } from '../Contex/NotificationMessage';
import { CartContext } from '../Contex/NotificationConterContex';
import InfiniteScroll from 'react-infinite-scroll-component';
import { format, isValid } from 'date-fns';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { NotificationCount, fetchNotificationCounter } = useContext(CartContext);
  const {
    notifications,
    fetchNotifications,
    updateNotificationStatus,
    markAllAsRead,
    loadMoreNotifications,
    hasMore,
  } = useContext(NotificationMessageContext);

  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [managementMenuOpen, setManagementMenuOpen] = useState(false);
  const [mobileManagementOpen, setMobileManagementOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const managementMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);

  // Role checks
  const isAdmin = user?.role === 'admin' || user?.role === 'SuperAdmin';
  const isMember = user?.role === 'member';

  // Navigation config
  const navConfig = {
    public: [
      { name: 'Home', path: '/', icon: HomeIcon },
      { name: 'How It Works', path: '/usage', icon: InformationCircleIcon },
      { name: 'About Us', path: '/about', icon: BuildingOffice2Icon },
      { name: 'Get Started', path: '/get-started', icon: QrCodeIcon },
      { name: 'Sign In', path: '/login', icon: ArrowLeftOnRectangleIcon },
      { name: 'Register', path: '/signup', icon: ArrowRightOnRectangleIcon },
    ],
    admin: [
      { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
      { name: 'Generate QR', path: '/qrgenerator', icon: QrCodeIcon },
      { name: 'Visitor Records', path: '/form-submission', icon: DocumentTextIcon },
    ],
    member: [
      { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
      { name: 'Visitor Records', path: '/form-submission', icon: DocumentTextIcon },
    ],
    management: [
      { name: 'Roles', path: '/designation', icon: BriefcaseIcon },
      { name: 'Departments', path: '/department', icon: BuildingOffice2Icon },
      { name: 'Office Locations', path: '/location-list', icon: BuildingOffice2Icon },
      { name: 'Visitor Types', path: '/application-list', icon: DocumentTextIcon },
      { name: 'Users', path: '/members', icon: UserCircleIcon },
      { name: 'Access Status', path: '/status', icon: UserCircleIcon },
    ],
    userMenu: [
      { name: 'Profile', path: '/profile', icon: UserCircleIcon },
      { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
      { name: 'Sign Out', action: 'logout', icon: ArrowRightOnRectangleIcon },
    ],
  };

  const navItems = user ? (isAdmin ? navConfig.admin : navConfig.member) : navConfig.public;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Signed out successfully', {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
        style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
      });
    } catch (err) {
      console.error('Logout error:', { error: err.message, stack: err.stack });
      toast.error('Failed to sign out', {
        icon: <XCircleIcon className="h-5 w-5 text-red-600" />,
        style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
      });
    }
  };

  const handleClearNotifications = async () => {
    try {
      await markAllAsRead();
      toast.success('Notifications cleared', {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
        style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
      });
      fetchNotificationCounter();
    } catch (err) {
      console.error('Error clearing notifications:', { error: err.message, stack: err.stack });
      toast.error('Failed to clear notifications', {
        icon: <XCircleIcon className="h-5 w-5 text-red-600" />,
        style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
      });
    }
  };

  const toggleMenu = useCallback(
    (menu) => {
      setManagementMenuOpen(menu === 'management' ? !managementMenuOpen : false);
      setUserMenuOpen(menu === 'user' ? !userMenuOpen : false);
      setNotificationsOpen(menu === 'notifications' ? !notificationsOpen : false);
      if (menu === 'notifications' && notifications.length === 0) {
        fetchNotifications(1).catch((err) => {
          console.error('Error fetching notifications:', { error: err.message, stack: err.stack });
          toast.error('Failed to load notifications', {
            icon: <XCircleIcon className="h-5 w-5 text-red-600" />,
            style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
          });
        });
      }
    },
    [managementMenuOpen, userMenuOpen, notificationsOpen, notifications.length, fetchNotifications]
  );

  useEffect(() => {
    if (user) {
      fetchNotificationCounter().catch((err) => {
        console.error('Error fetching notification counter:', { error: err.message, stack: err.stack });
        toast.error('Failed to fetch notification count', {
          icon: <XCircleIcon className="h-5 w-5 text-red-600" />,
          style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
        });
      });
    }
  }, [user, fetchNotificationCounter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !userMenuRef.current?.contains(event.target) &&
        !managementMenuRef.current?.contains(event.target) &&
        !notificationsMenuRef.current?.contains(event.target)
      ) {
        setManagementMenuOpen(false);
        setUserMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileManagementOpen(false);
    }
  }, [mobileMenuOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await updateNotificationStatus(notification.id, true);
        fetchNotificationCounter();
      } catch (err) {
        console.error('Error updating notification status:', { error: err.message, stack: err.stack });
        toast.error('Failed to update notification', {
          icon: <XCircleIcon className="h-5 w-5 text-red-600" />,
          style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
        });
      }
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setNotificationsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read', {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
        style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
      });
      fetchNotificationCounter();
    } catch (err) {
      console.error('Error marking all notifications as read:', { error: err.message, stack: err.stack });
      toast.error('Failed to mark all as read', {
        icon: <XCircleIcon className="h-5 w-5 text-red-600" />,
        style: { background: '#ffffff', color: '#111827', padding: '12px', borderRadius: '8px' },
      });
    }
  };

  const formatDate = (date) => {
    const parsedDate = new Date(date);
    return isValid(parsedDate) ? format(parsedDate, 'MMM d, yyyy h:mm a') : 'Unknown date';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <nav className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-lg sticky top-0 z-50 transition-all duration-300 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            fontSize: '14px',
            background: '#ffffff',
            color: '#111827',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              to={user ? '/dashboard' : '/'}
              className="text-xl sm:text-2xl font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 transition-colors duration-200 tracking-tight"
              aria-label="QRVibe Home"
            >
              QRVibe
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300"
                aria-label={item.name}
              >
                <item.icon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => navigate('/demo')}
              className="flex items-center px-4 py-2 text-[12px] font-medium text-white bg-pink-600 dark:bg-pink-400 hover:bg-pink-700 dark:hover:bg-pink-500 rounded-lg transition-all duration-200 shadow-sm"
              aria-label="Get a Demo"
            >
              <PhoneIcon className="w-5 h-5 mr-2 animate-[ring_1.5s_ease-in-out_infinite]" />
              Get a Demo
            </button>
            {user && isAdmin && (
              <div className="relative" ref={managementMenuRef}>
                <button
                  onClick={() => toggleMenu('management')}
                  className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300"
                  aria-expanded={managementMenuOpen}
                  aria-controls="management-menu"
                  aria-label="Management menu"
                >
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                  Management
                  <ChevronDownIcon
                    className={`ml-2 w-4 h-4 transition-transform duration-300 ${managementMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {managementMenuOpen && (
                  <div
                    id="management-menu"
                    className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
                  >
                    {navConfig.management.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200"
                        aria-label={item.name}
                      >
                        <item.icon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {user && (
              <>
                <div className="relative" ref={notificationsMenuRef}>
                  <button
                    onClick={() => toggleMenu('notifications')}
                    className="p-2 rounded-full relative text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    aria-expanded={notificationsOpen}
                    aria-controls="notifications-menu"
                    aria-label="Notifications"
                  >
                    <BellIcon className="w-6 h-6" />
                    {NotificationCount > 0 && (
                      <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-pink-600 dark:bg-pink-400 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {Math.min(NotificationCount, 9)}
                          {NotificationCount > 9 ? '+' : ''}
                        </span>
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div
                      id="notifications-menu"
                      className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-50"
                    >
                      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          Notifications
                        </span>
                        <div className="flex items-center space-x-3">
                          {notifications.length > 0 && (
                            <>
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 hover:underline focus:outline-none"
                                aria-label="Mark all notifications as read"
                              >
                                Mark All as Read
                              </button>
                              <button
                                onClick={handleClearNotifications}
                                className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 hover:underline focus:outline-none"
                                aria-label="Clear all notifications"
                              >
                                Clear All
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <InfiniteScroll
                        dataLength={notifications.length}
                        next={loadMoreNotifications}
                        hasMore={hasMore}
                        loader={
                          <div className="p-4 text-center">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-pink-600 dark:border-pink-400 mx-auto"></div>
                          </div>
                        }
                        height={300}
                      >
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 ${
                                notification.isRead ? 'opacity-70' : ''
                              }`}
                              aria-label={`Notification: ${notification.message}`}
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formatDate(notification.created_at)}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-pink-600 dark:bg-pink-400 mt-1.5 ml-2"></span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </InfiniteScroll>
                    </div>
                  )}
                </div>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => toggleMenu('user')}
                    className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    aria-expanded={userMenuOpen}
                    aria-controls="user-menu"
                    aria-label="User menu"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="User avatar"
                        className="w-8 h-8 rounded-full mr-2 object-cover border border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-pink-600 dark:bg-pink-400 text-white flex items-center justify-center mr-2 text-sm font-medium">
                        {getUserInitials()}
                      </div>
                    )}
                    <span className="truncate max-w-[140px] text-sm">{user?.name || 'User'}</span>
                    <ChevronDownIcon
                      className={`ml-2 w-4 h-4 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {userMenuOpen && (
                    <div
                      id="user-menu"
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
                    >
                      {navConfig.userMenu.map((item) => (
                        <button
                          key={item.name}
                          onClick={item.action === 'logout' ? handleLogout : () => navigate(item.path)}
                          className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200"
                          aria-label={item.name}
                        >
                          <item.icon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => navigate('/demo')}
              className="flex items-center px-3 py-1.5 text-[12px] font-medium text-white bg-pink-600 dark:bg-pink-400 hover:bg-pink-700 dark:hover:bg-pink-500 rounded-lg transition-all duration-200 shadow-sm"
              aria-label="Get a Demo"
            >
              <PhoneIcon className="w-5 h-5 mr-2 animate-[ring_1.5s_ease-in-out_infinite]" />
              Get a Demo
            </button>
            {user && (
              <button
                onClick={() => toggleMenu('notifications')}
                className="p-2 rounded-full relative text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                aria-label="Notifications"
              >
                <BellIcon className="w-6 h-6" />
                {NotificationCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-pink-600 dark:bg-pink-400 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {Math.min(NotificationCount, 9)}
                      {NotificationCount > 9 ? '+' : ''}
                    </span>
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Link
              to={user ? '/dashboard' : '/'}
              className="text-xl font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 transition-colors duration-200"
              aria-label="QRVibe Home"
              onClick={() => setMobileMenuOpen(false)}
            >
              QRVibe
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label="Close mobile menu"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200"
                aria-label={item.name}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                {item.name}
              </Link>
            ))}
            {user && isAdmin && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setMobileManagementOpen(!mobileManagementOpen)}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200"
                  aria-expanded={mobileManagementOpen}
                  aria-controls="mobile-management-menu"
                  aria-label="Management menu"
                >
                  <BriefcaseIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                  Management
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-300 ${mobileManagementOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileManagementOpen && (
                  <div id="mobile-management-menu" className="pl-6 bg-gray-50 dark:bg-gray-900">
                    {navConfig.management.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200"
                        aria-label={item.name}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {user && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {navConfig.userMenu.map((item) => (
                  <button
                    key={item.name}
                    onClick={
                      item.action === 'logout'
                        ? handleLogout
                        : () => {
                            navigate(item.path);
                            setMobileMenuOpen(false);
                          }
                    }
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200"
                    aria-label={item.name}
                  >
                    <item.icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {notificationsOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4"
          ref={notificationsMenuRef}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </span>
              <div className="flex items-center space-x-3">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 hover:underline focus:outline-none"
                      aria-label="Mark all notifications as read"
                    >
                      Mark All as Read
                    </button>
                    <button
                      onClick={handleClearNotifications}
                      className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-500 hover:underline focus:outline-none"
                      aria-label="Clear all notifications"
                    >
                      Clear All
                    </button>
                  </>
                )}
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  aria-label="Close notifications"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <InfiniteScroll
              dataLength={notifications.length}
              next={loadMoreNotifications}
              hasMore={hasMore}
              loader={
                <div className="p-4 text-center">
                  <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-pink-600 dark:border-pink-400 mx-auto"></div>
                </div>
              }
              height={400}
            >
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 ${
                      notification.isRead ? 'opacity-70' : ''
                    }`}
                    aria-label={`Notification: ${notification.message}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-pink-600 dark:bg-pink-400 mt-1.5 ml-2"></span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </InfiniteScroll>
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes ring {
            0% { transform: rotate(0deg); }
            10% { transform: rotate(15deg); }
            20% { transform: rotate(-15deg); }
            30% { transform: rotate(15deg); }
            40% { transform: rotate(-15deg); }
            50% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </nav>
  );
}
export default Navbar;