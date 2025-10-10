// Domain configuration for ElderVoice Landing Site
// This file contains the domain URLs for cross-site navigation

// The main app domain where auth, admin, and dashboard functionality lives
export const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'http://localhost:5174';

// API base URL for backend calls
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

// Current landing domain
export const LANDING_DOMAIN = window.location.origin;

