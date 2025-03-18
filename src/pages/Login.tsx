import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import axios from "axios";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign Up
  const [messName, setMessName] = useState(""); // For Sign Up
  const [confirmPassword, setConfirmPassword] = useState(""); // For Sign Up
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  // Login Logic (unchanged)
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check if user is admin
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.admin) {
        localStorage.setItem("admin", "true"); // Start session
        navigate("/dashboard");
      } else {
        setError("Access Denied: You are not an admin.");
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Sign Up Logic
  const handleSignUp = async (e: any) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      console.log("Checking if user exists...");

      // Step 1: Check if the user already exists
      const checkUserResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/check-user`,
        { email }
      );

      if (checkUserResponse.data.exists) {
        setError("User already exists. Please log in.");
        return;
      }

      console.log("User does not exist. Proceeding with sign-up...");

      // Step 2: If the user doesn't exist, proceed with sign-up
      const signUpResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/signup`,
        {
          email,
          password,
          displayName: messName,
          address,
        }
      );

      console.log("Sign-up response:", signUpResponse);

      if (signUpResponse.data.success) {
        console.log("Sign-up successful!");
        setError("Sign Up successful! Please log in.");
        setIsLogin(true); // Switch to Login after successful Sign Up
      } else {
        console.error("Sign-up failed:", signUpResponse.data.message);
        setError(signUpResponse.data.message || "Sign Up failed.");
      }
    } catch (error: any) {
      console.error("Sign-up error:", error);

      // Handle specific Axios errors
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error("Server responded with:", error.response.data);
        setError(
          error.response.data.message || "An error occurred during Sign Up."
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        setError("No response from the server. Please try again.");
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", error.message);
        setError("An error occurred during Sign Up.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isLogin ? "Admin Login" : "Sign Up"}
        </h2>
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        {isLogin ? (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </form>
        ) : (
          // Sign Up Form
          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mess Name
              </label>
              <input
                type="text"
                placeholder="Enter your mess name"
                value={messName}
                onChange={(e) => setMessName(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign Up
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
