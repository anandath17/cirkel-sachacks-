import React from 'react';
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex items-center justify-center">
        <img 
          src="/logo.svg" 
          alt="Cirkel Logo" 
          className="w-24 h-24"
        />
        <span className="text-lg font-medium text-gray-900">Cirkel</span>
      </div>
    </Link>
  );
} 