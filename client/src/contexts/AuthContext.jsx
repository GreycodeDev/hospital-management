import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth.js';
import { authAPI } from '../services/api.js';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, loading: false, user: action.payload, isAuthenticated: true, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const user = authService.getUser();
      
      if (token && user) {
        try {
          // Verify token is still valid
          const response = await authAPI.getProfile();
          dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.data.user });
        } catch (error) {
          // Token is invalid or expired
          console.error('Token validation failed:', error);
          authService.logout();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        // No token found, set loading to false
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    console.log('AuthContext: login started with credentials:', credentials);
    dispatch({ type: 'LOGIN_START' });
    
    try {
      console.log('AuthContext: making API call...');
      const response = await authAPI.login(credentials);
      console.log('AuthContext: API response received:', response);
      
      const { user, token } = response.data.data;
      
      console.log('AuthContext: setting token and user...');
      authService.setToken(token);
      authService.setUser(user);
      
      console.log('AuthContext: dispatching LOGIN_SUCCESS...');
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      
      console.log('AuthContext: returning success result...');
      // Return the user data so the Login component can use it
      return { 
        success: true, 
        user: user,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        console.log('AuthContext: Server responded with error:', error.response);
        // Server responded with error
        if (error.response.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.response.status === 403) {
          errorMessage = 'Your account has been deactivated. Please contact the administrator.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        console.log('AuthContext: No response received:', error.request);
        // Request made but no response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        console.log('AuthContext: Other error:', error.message);
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      console.log('AuthContext: dispatching LOGIN_FAILURE...');
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      
      console.log('AuthContext: returning error result...');
      // Return error object - this is what the Login component will receive
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = () => {
    console.log('AuthContext: logout called');
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.data.user;
      authService.setUser(updatedUser);
      dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      
      let errorMessage = 'Update failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = 'Unable to connect to server';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    updateProfile,
    clearError,
  };

  console.log('AuthContext: current state:', state);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};