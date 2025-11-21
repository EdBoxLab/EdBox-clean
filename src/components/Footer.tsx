
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-200 dark:bg-gray-800 p-3 sm:p-4 text-center">
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} EdBox. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
