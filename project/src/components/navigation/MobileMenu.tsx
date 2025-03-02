import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { currentUser } = useAuth();

  const menuItems = [
    { label: 'About', href: '/about' },
    { label: 'Partnership', href: '/partnership' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[280px] bg-white shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <nav className="space-y-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={onClose}
                    >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {!currentUser && (
                <div className="space-y-3 pt-6 border-t">
                  <Link
                    to="/login"
                    className="block w-full px-4 py-2 text-center text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
                      onClick={onClose}
                    >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full px-4 py-2 text-center text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                      onClick={onClose}
                    >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}