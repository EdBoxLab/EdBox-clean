'use client';
import React from 'react';
import Link from 'next/link';

const Dashboard: React.FC = () => {

  return (
    <div
      className="p-3 sm:p-6 md:p-8 min-h-full"
      style={{ backgroundColor: "lab(8.11897 0.811279 -12.254)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2">
            Welcome, Guest!
          </h1>
          <p className="text-base sm:text-lg text-gray-300">
            Here's a quick overview of your world. Ready to dive back in?
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          <div
            className="p-3 sm:p-4 md:p-6 rounded-lg shadow-md"
            style={{ backgroundColor: "lab(20 0 -10)" }} // lighter variant
          >
            <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-200">Projects</h3>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-300 mt-1 sm:mt-2">12</p>
          </div>
          <div
            className="p-3 sm:p-4 md:p-6 rounded-lg shadow-md"
            style={{ backgroundColor: "lab(20 0 -10)" }}
          >
            <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-200">Courses</h3>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-300 mt-1 sm:mt-2">3</p>
          </div>
          <div
            className="p-3 sm:p-4 md:p-6 rounded-lg shadow-md"
            style={{ backgroundColor: "lab(20 0 -10)" }}
          >
            <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-200">Achievements</h3>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-300 mt-1 sm:mt-2">27</p>
          </div>
          <div
            className="p-3 sm:p-4 md:p-6 rounded-lg shadow-md flex flex-col justify-center items-center text-center"
            style={{ backgroundColor: "lab(20 0 -10)" }}
          >
            <Link href="/ide" className="font-bold text-sm sm:text-base text-indigo-300 hover:underline">
              Launch IDE
            </Link>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">Jump into the coding environment.</p>
          </div>
        </div>

        {/* Call to Action for Courses */}
        <div className="mt-12 sm:mt-16 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">Continue Learning</h2>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 px-4">
            You are halfway through your 'Intro to Web Dev' course.
          </p>
          <Link
            href="/courses/intro-to-web-dev"
            className="inline-block bg-indigo-500 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 text-sm sm:text-base rounded-lg hover:bg-indigo-600 transition-all duration-300"
          >
            Resume Course
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
