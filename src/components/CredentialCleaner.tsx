"use client";

import { useEffect } from "react";

/**
 * Security component that clears sensitive credentials from storage on page reload
 * This prevents stored user/admin objects from persisting across sessions
 */
export default function CredentialCleaner() {
  useEffect(() => {
    // Clear any stored user/admin credentials on page load for security
    const keysToRemove = ['user', 'admin', 'credentials', 'userCredentials', 'adminCredentials'];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
      }
    });
  }, []);

  return null;
}
