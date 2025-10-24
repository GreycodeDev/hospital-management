import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors[name] || errors.general) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== SUBMIT HANDLER CALLED ===');
    
    // MORE AGGRESSIVE EVENT PREVENTION
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (e && typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }
    
    // Prevent default behavior
    if (e && e.nativeEvent && typeof e.nativeEvent.preventDefault === 'function') {
      e.nativeEvent.preventDefault();
    }
    
    console.log('After event prevention - formData:', formData);
    console.log('Loading state:', loading);
    
    // Don't submit if already loading
    if (loading) {
      console.log('Already loading, returning early');
      return false; // Return false to prevent default
    }
    
    // Clear any previous errors first
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      console.log('Form validation failed');
      return false; // Return false to prevent default
    }
    
    console.log('Calling login function...');
    
    try {
      const result = await login(formData);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful');
        addToast('Login successful! Redirecting...', 'success', 2000);
        
        // Use setTimeout to ensure the toast shows before navigation
        setTimeout(() => {
          console.log('Navigating to dashboard...');
          window.location('/', { replace: true });
        }, 1000);
      } else {
        console.log('Login failed:', result);
        const errorMessage = result.error || 'Login failed. Please check your credentials and try again.';
        setErrors({ general: errorMessage });
        addToast(errorMessage, 'error', 5000);
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again later.';
      setErrors({ general: errorMessage });
      addToast(errorMessage, 'error', 5000);
    }
    
    // Return false to prevent default form submission
    return e.preventDefault ? false : true;
  };

  // Alternative: Use button click handler instead of form submit
  const handleButtonClick = (e) => {
    console.log('=== BUTTON CLICK HANDLER ===');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleSubmit(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">VH</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Victoria Chitepo Provincial Hospital
          </p>
        </div>
        
        {/* Remove form and use div instead to prevent any default form behavior */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="space-y-6">
            {/* Success Message */}
            {errors.success && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <div className="text-sm text-green-800 font-medium">{errors.success}</div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.general && !errors.success && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">{errors.general}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  required
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              {/* Password Input */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                  onKeyPress={(e) => {
                    // Prevent form submission on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleButtonClick(e);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Submit Button - Use onClick instead of form submit */}
            <div>
              <button
                type="button" // Changed to button to prevent form submission
                onClick={handleButtonClick}
                disabled={loading}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Contact your administrator if you're having trouble signing in
            </p>
          </div>
        </div>

        {/* System Status */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;