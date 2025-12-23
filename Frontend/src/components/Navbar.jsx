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
  Cog6ToothIcon, BellIcon, QrCodeIcon, 
  BriefcaseIcon,
  BuildingOffice2Icon,
  InformationCircleIcon, 
  ArrowLeftOnRectangleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PhoneIcon,
  UserGroupIcon, // Added for Shortlisted Candidates
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
    deleteNotification,
    deleteAllNotifications,
    loadMoreNotifications,
    hasMore,
    loading,
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
      { name: 'Interview', path: '/form-submission', icon: DocumentTextIcon },
      { name: 'Meet-Up', path: '/form-submission', icon: DocumentTextIcon },
    ],
    member: [
      { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
      { name: 'Visitor Records', path: '/form-submission', icon: DocumentTextIcon },
      { name: 'Interview', path: '/form-submission', icon: DocumentTextIcon },
      { name: 'Meet-Up', path: '/form-submission', icon: DocumentTextIcon },
    ],
    management: [
      { name: 'Designation', path: '/designation', icon: BriefcaseIcon },
      { name: 'Departments', path: '/department', icon: BuildingOffice2Icon },
      { name: 'Geo Office Locations', path: '/location-list', icon: BuildingOffice2Icon },
      { name: 'Visitor Application Types', path: '/application-list', icon: DocumentTextIcon },
      { name: 'Create Member', path: '/members', icon: UserCircleIcon },
      { name: 'Status', path: '/status', icon: UserCircleIcon },
      {
        name: 'Shortlisted Candidates',
        icon: UserGroupIcon,
        subItems: [
          { name: 'Applied', path: '/shortlisted-candidates/applied' },
          { name: 'Hired', path: '/shortlisted-candidates/hired' },
          { name: 'Rejected', path: '/shortlisted-candidates/blacklist' },
        ],
      },
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
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
        duration: 3000,
      });
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to sign out', {
        icon: <XCircleIcon className="h-5 w-5 text-red-600" />,
        style: { background: '#ffffff', color: '#1e293b', padding: '12px', borderRadius: '8px' },
        duration: 3000,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await fetchNotificationCounter();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) return;
    try {
      await deleteAllNotifications();
      await fetchNotificationCounter();
      toast.success('All notifications deleted');
    } catch (err) {
      toast.error('Failed to delete all notifications');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await deleteNotification(notificationId);
      await fetchNotificationCounter();
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const toggleMenu = useCallback(
    (menu) => {
      if (menu === 'management') setManagementMenuOpen((prev) => !prev);
      else setManagementMenuOpen(false);
      if (menu === 'user') setUserMenuOpen((prev) => !prev);
      else setUserMenuOpen(false);
      if (menu === 'notifications') {
        setNotificationsOpen((prev) => !prev);
        if (!notifications.length && !loading) {
          fetchNotifications(1);
        }
      } else {
        setNotificationsOpen(false);
      }
    },
    [notifications.length, loading, fetchNotifications]
  );

  useEffect(() => {
    if (user) {
      fetchNotificationCounter();
    }
  }, [user, fetchNotificationCounter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current && !userMenuRef.current.contains(event.target) &&
        managementMenuRef.current && !managementMenuRef.current.contains(event.target) &&
        notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)
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
    if (notification.status !== 'read') {
      try {
        await updateNotificationStatus(notification.id);
        await fetchNotificationCounter();
      } catch (err) {
        toast.error('Failed to update notification');
      }
    }
    if (notification.actionUrl){
      navigate(notification.actionUrl);
      setNotificationsOpen(false);
    } else {
      setNotificationsOpen(false);
    }
  };

  const NotificationItem = ({ notification }) => (
    <div className="relative group">
      <button
        onClick={() => handleNotificationClick(notification)}
        className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-lg ${
          notification.status === 'read' ? 'opacity-60' : 'bg-blue-50 dark:bg-blue-900/20'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {notification.message}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatDate(notification.created_at)}
            </p>
          </div>
          {notification.type && (
            <span className="flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {notification.type}
            </span>
          )}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteNotification(notification.id);
        }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
        aria-label="Delete notification"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );

  const formatDate = (date) => {
    const parsedDate = new Date(date);
    return isValid(parsedDate) ? format(parsedDate, 'MMM dd, yyyy • h:mm a') : 'Unknown date';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ').filter(Boolean);
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  const NotificationSkeleton = () => (
    <div className="p-4 border-b border-slate-100 dark:border-slate-700 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-2 h-2 bg-slate-200 dark:bg-slate-600 rounded-full mt-2.5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  return (
    <nav className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 shadow-sm sticky top-0 z-50 font-[Inter]">
      <Toaster position="top-right" />

      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={user ? '/dashboard' : '/'}
              className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200 tracking-tight"
            >
              QRVibe
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="group flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
              >
                <item.icon className="w-4 h-4 mr-2 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                {item.name}
              </Link>
            ))}

            <button
              onClick={() => navigate('/demo')}
              className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <PhoneIcon className="w-4 h-4 mr-2" />
              Get a Demo
            </button>

            {/* Management Dropdown - Only for Admin */}
            {user && isAdmin && (
              <div className="relative" ref={managementMenuRef}>
                <button
                  onClick={() => toggleMenu('management')}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                >
                  <BriefcaseIcon className="w-4 h-4 mr-2" />
                  Management
                  <ChevronDownIcon className={`ml-1 w-3 h-3 transition-transform duration-200 ${managementMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {managementMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 z-50 overflow-hidden">
                    {navConfig.management.map((item, index) => (
                      <div key={index}>
                        {/* Regular menu item */}
                        {item.path && (
                          <Link
                            to={item.path}
                            onClick={() => setManagementMenuOpen(false)}
                            className="flex items-center px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                          >
                            <item.icon className="w-4 h-4 mr-3 text-slate-400" />
                            {item.name}
                          </Link>
                        )}

                        {/* Submenu: Shortlisted Candidates */}
                        {item.subItems && (
                          <>
                            <div className="px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-t border-slate-200 dark:border-slate-700">
                              <item.icon className="w-4 h-4 inline mr-2" />
                              {item.name}
                            </div>
                            {item.subItems.map((sub) => (
                              <Link
                                key={sub.name}
                                to={sub.path}
                                onClick={() => setManagementMenuOpen(false)}
                                className="block pl-12 pr-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              >
                                → {sub.name}
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notificationsMenuRef}>
                <button
                  onClick={() => toggleMenu('notifications')}
                  className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all duration-200"
                >
                  <BellIcon className="w-5 h-5" />
                  {NotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {NotificationCount > 99 ? '99+' : NotificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 max-h-96 overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {notifications.length > 0 && (
                          <>
                            <button onClick={handleMarkAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                              Mark All Read
                            </button>
                            <button onClick={handleDeleteAllNotifications} className="text-xs text-red-600 hover:text-red-700 font-medium">
                              Delete All
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <InfiniteScroll
                        dataLength={notifications.length}
                        next={loadMoreNotifications}
                        hasMore={hasMore}
                        loader={<NotificationSkeleton />}
                        height={320}
                      >
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-500">No notifications yet</div>
                        ) : (
                          notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
                        )}
                      </InfiniteScroll>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => toggleMenu('user')}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-7 h-7 rounded-full mr-2 object-cover border-2 border-slate-200 dark:border-slate-600" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-2 text-xs font-semibold">
                      {getUserInitials()}
                    </div>
                  )}
                  <span className="hidden sm:inline truncate max-w-[120px]">{user?.name || 'User'}</span>
                  <ChevronDownIcon className={`ml-1 w-3 h-3 transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 z-50">
                    {navConfig.userMenu.slice(0, -1).map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          navigate(item.path);
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                      >
                        <item.icon className="w-4 h-4 mr-3 text-slate-400" />
                        {item.name}
                      </button>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 border-t border-slate-200 dark:border-slate-700"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Buttons */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => navigate('/demo')}
              className="flex items-center px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-all"
            >
              <PhoneIcon className="w-4 h-4 mr-1" />
              Demo
            </button>

            {user && (
              <button
                onClick={() => toggleMenu('notifications')}
                className="relative p-2 text-slate-500 hover:text-indigo-600 rounded-full"
              >
                <BellIcon className="w-5 h-5" />
                {NotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {NotificationCount > 99 ? '99+' : NotificationCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-indigo-600 rounded-full"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full Screen Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <Link to={user ? '/dashboard' : '/'} onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-indigo-600">
              QRVibe
            </Link>
            <button onClick={() => setMobileMenuOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}

            {/* Mobile Management Section */}
            {user && isAdmin && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                <button
                  onClick={() => setMobileManagementOpen(!mobileManagementOpen)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md"
                >
                  <div className="flex items-center">
                    <BriefcaseIcon className="w-5 h-5 mr-3" />
                    Management
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${mobileManagementOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileManagementOpen && (
                  <div className="pl-6 mt-2 space-y-1">
                    {navConfig.management.map((item, idx) => (
                      <div key={idx}>
                        {item.path && (
                          <Link
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                          >
                            {item.name}
                          </Link>
                        )}
                        {item.subItems && (
                          <>
                            <div className="font-semibold text-indigo-600 dark:text-indigo-400 py-1 pl-4">
                              {item.name}
                            </div>
                            {item.subItems.map((sub) => (
                              <Link
                                key={sub.name}
                                to={sub.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block pl-8 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                              >
                                → {sub.name}
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Actions in Mobile */}
            {user && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md"
                >
                  <UserCircleIcon className="w-5 h-5 mr-3" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md"
                >
                  <Cog6ToothIcon className="w-5 h-5 mr-3" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md mt-2"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Notification Modal */}
      {notificationsOpen && user && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 md:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-base font-semibold">Notifications</h3>
              <button onClick={() => setNotificationsOpen(false)}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InfiniteScroll
                dataLength={notifications.length}
                next={loadMoreNotifications}
                hasMore={hasMore}
                loader={<NotificationSkeleton />}
                height={400}
              >
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">No notifications yet</div>
                ) : (
                  notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
                )}
              </InfiniteScroll>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;