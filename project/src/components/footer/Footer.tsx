import React from 'react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <a href="/help" className="hover:text-gray-900 transition-colors">Help</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-gray-900 transition-colors">Terms</a>
          </div>
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Cirkel. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 