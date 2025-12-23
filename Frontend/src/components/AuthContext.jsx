import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Loder from '../Loader/ApiLoader';
import { Navigate } from "react-router-dom";

export const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ip, setIp] = useState("unknown");
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Validate user data structure
  const isValidUser = (userData) => {
    return (
      userData &&
      typeof userData === "object" &&
      userData.id &&
      typeof userData.email === "string" &&
      ["admin", "member"].includes(userData.role)
    );
  };

  // Fetch IP address
  const fetchIp = async () => {
    try {
      const res = await axios.get("https://api.ipify.org?format=json", { timeout: 5000 });
      setIp(res.data.ip || "unknown");
    } catch (err) {
      console.error("Error fetching IP:", err.message);
      toast.error(err.response?.status === 429 ? "Too many IP requests." : "Failed to fetch IP.", {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      setIp("unknown");
    }
  };

  // Restore session
  const restoreSession = async (retryCount = 0, maxRetries = 3) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (isValidUser(response.data.data)) {
        setUser(response.data.data);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("Session restored:", response.data.data);
      } else {
        throw new Error("Invalid user data");
      }
    } catch (err) {
      console.error("Session restore error:", err.response?.data || err.message);
      if (err.name === "AbortError" || err.message === "Network Error") {
        if (retryCount < maxRetries) {
          console.log(`Retrying session restore (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => restoreSession(retryCount + 1, maxRetries), 1000 * Math.pow(2, retryCount));
          return;
        }
      }
      toast.error(err.response?.status === 401 ? "Session expired. Please log in again." : "Failed to restore session.", {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      localStorage.removeItem("token");
      setToken(null);
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    } finally {
      // Always set loading to false after completion or failure
      setLoading(false);
    }
  };

  // Pre-signup to request OTP without creating account
  const preSignup = async (name, email, password, ipAddress, googleToken) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/pre-signup`,
        googleToken
          ? { googleToken, ip: ipAddress || ip }
          : { name, email: email.toLowerCase(), password, ip: ipAddress || ip },
        { timeout: 10000 }
      );
      return response.data;
    } catch (err) {
      console.error("Pre-signup error:", err.response?.data || err.message);
      const errorMsg =
        err.response?.status === 429
          ? "Too many attempts. Please try again later."
          : err.response?.data?.message || "Failed to initiate signup.";
      toast.error(errorMsg, {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      throw new Error(errorMsg);
    }
  };

  // Request OTP
  const requestOtp = async (email) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/request-otp`,
        { email: email.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      toast.success("OTP sent to your email!", {
        style: { fontSize: "14px", background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" },
      });
      return response.data;
    } catch (err) {
      console.error("Request OTP error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || "Failed to send OTP.";
      toast.error(errorMsg, {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      throw new Error(errorMsg);
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otp) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/verify-otp`,
        { email: email.toLowerCase(), otp },
        { timeout: 10000 }
      );
      toast.success("OTP verified successfully!", {
        style: { fontSize: "14px", background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" },
      });
      return response.data;
    } catch (err) {
      console.error("Verify OTP error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || "Invalid or expired OTP.";
      toast.error(errorMsg, {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      throw new Error(errorMsg);
    }
  };

  // Signup function (admin only)
  const signup = async (email) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/signup`,
        { email: email.toLowerCase() },
        { timeout: 10000 }
      );
      toast.success("Account created successfully! Please log in.", {
        style: { fontSize: "14px", background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" },
      });
      return response.data;
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      const errorMsg =
        err.response?.status === 429
          ? "Too many signup attempts. Please try again later."
          : err.response?.data?.message
      throw new Error(errorMsg);
    }
  };

  // Login function
  const login = async (email, password, ipAddress, googleToken) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        googleToken
          ? { googleToken, ip: ipAddress || ip }
          : { email: email.toLowerCase(), password, ip: ipAddress || ip },
        { timeout: 10000 }
      );
      const { token: newToken, user: newUser } = response.data.data;
      if (!isValidUser(newUser)) {
        throw new Error("Invalid user data received from server");
      }
      localStorage.setItem("token", newToken);
      setToken(newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setUser(newUser);
      return true;
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      const errorMsg =
        err.response?.status === 429
          ? "Too many login attempts. Please try again later."
          : err.response?.data?.message ;
      
      throw new Error(errorMsg);
    }
  };

  // Create member (admin only)
  const createMember = async (name, email, password, ipAddress) => {
    if (user?.role !== 'admin') {
      const errorMsg = "Only admins can create members.";
      toast.error(errorMsg, {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      throw new Error(errorMsg);
    }

    try {
      const response = await axios.post(
        `${API_URL}/create-member`,
        { name, email: email.toLowerCase(), password, ip: ipAddress || ip },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      toast.success("Member created successfully!", {
        style: { fontSize: "14px", background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" },
      });
      return response.data.data;
    } catch (err) {
      console.error("Create member error:", err.response?.data || err.message);
      const errorMsg =
        err.response?.status === 429
          ? "Too many attempts. Please try again later."
          : err.response?.data?.message || "Failed to create member.";
      toast.error(errorMsg, {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      throw new Error(errorMsg);
    }
  };

  // Fetch members (admin only)
  const fetchMembers = async () => {
    if (user?.role !== 'admin') {
      const errorMsg = "Only admins can view members.";
      toast.error(errorMsg, {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      throw new Error(errorMsg);
    }

    try {
      const response = await axios.get(`${API_URL}/members`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      return response.data.data;
    } catch (err) {
      console.error("Fetch members error:", err.response?.data || err.message);
      const errorMsg =
        err.response?.status === 429
          ? "Too many requests. Please try again later."
          : err.response?.data?.message || "Failed to fetch members.";
      toast.error(errorMsg, {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
      throw new Error(errorMsg);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
        console.log("Logout successful");
      }
    } catch (err) {
      console.error("Logout error:", err.response?.data || err.message);
      toast.error("Error during logout. Session cleared locally.", {
        style: { fontSize: "14px", background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" },
      });
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      setIp("unknown");
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await fetchIp();
      await restoreSession();
      setLoading(false); // Ensure loading is false after initialization
    };
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, signup, preSignup, createMember, fetchMembers, logout, isLoading: loading, ip, requestOtp, verifyOtp }}
    >
      {loading ? <Loder /> : children}
    </AuthContext.Provider>
  );
}

export default AuthContext;