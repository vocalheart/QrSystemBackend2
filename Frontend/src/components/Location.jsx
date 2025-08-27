import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  FunnelIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  UsersIcon,
  CalendarIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const locationsPerPage = 9;

  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/locations?page=${currentPage}&limit=${locationsPerPage}`
        );
        setLocations(response.data.locations);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Error fetching locations:', err);
        toast.error('Failed to load locations. Please try again later.', {
          style: { background: '#FEE2E2', color: '#B91C1C' }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [API_URL, currentPage]);

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || location.type === filter;
    return matchesSearch && matchesFilter;
  });

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/locations?page=${currentPage}&limit=${locationsPerPage}`
      );
      setLocations(response.data.locations);
      setTotalPages(response.data.totalPages);
      toast.success('Locations refreshed successfully!', {
        icon: '🔄',
        style: { background: '#D1FAE5', color: '#065F46' }
      });
    } catch (err) {
      console.error('Error refreshing locations:', err);
      toast.error('Failed to refresh locations.', {
        style: { background: '#FEE2E2', color: '#B91C1C' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getLocationFeatures = (location) => {
    const features = [];
    if (location.capacity) features.push(`${location.capacity} people`);
    if (location.hasWifi) features.push('Wi-Fi');
    if (location.hasParking) features.push('Parking');
    if (location.hasConferenceRoom) features.push('Conference Room');
    return features.join(' • ');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold tracking-tight">Our Locations</h1>
              <p className="mt-2 max-w-2xl text-indigo-100 dark:text-indigo-200">
                Discover all our office locations and plan your visit
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/location/add')}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors duration-200"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add New Location
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search by name, address, or features..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Locations</option>
                <option value="office">Offices</option>
                <option value="warehouse">Warehouses</option>
                <option value="retail">Retail Stores</option>
                <option value="meeting">Meeting Rooms</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Total Locations</h3>
            </div>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{locations.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <UsersIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Active Today</h3>
            </div>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">24</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Upcoming Events</h3>
            </div>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">5</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No locations found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No locations have been added yet'}
            </p>
            <div className="mt-6 space-x-3">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset filters
              </button>
              <button
                onClick={() => navigate('/location/add')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
              >
                Add First Location
              </button>
            </div>
          </div>
        )}

        {/* Locations Grid */}
        {!loading && filteredLocations.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((location) => (
                <div key={location._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                    {location.image ? (
                      <img
                        src={location.image}
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BuildingOfficeIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-full">
                      {location.type}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{location.name}</h3>
                    <div className="flex items-start mb-3">
                      <MapPinIcon className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-2" />
                      <p className="text-gray-600 dark:text-gray-300">{location.address}</p>
                    </div>
                    
                    {location.features && (
                      <div className="flex items-center mb-3">
                        <WifiIcon className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {getLocationFeatures(location)}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      {location.hours && (
                        <div className="flex items-start">
                          <ClockIcon className="flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">{location.hours}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        to={`/location/${location._id}`}
                        className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        View details
                        <ChevronRightIcon className="ml-1 h-4 w-4" />
                      </Link>
                      <div className="flex space-x-2">
                        <Link
                          to={`/location/${location._id}/schedule`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
                        >
                          Schedule
                        </Link>
                        <Link
                          to={`/location/${location._id}/check-in`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Check In
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Locations;