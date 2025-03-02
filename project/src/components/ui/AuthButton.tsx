import React from 'react';
import { Link } from 'react-router-dom';

export function AuthButton() {
  return (
    <div className="flex items-center gap-4">
      <Link
        to="/login"
        className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
      >
        Log in
      </Link>
      <Link
        to="/signup"
        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
      >
        Sign up
      </Link>
    </div>
  );
}