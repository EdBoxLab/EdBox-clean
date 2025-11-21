'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Simple theme palette — keep accents consistent across the page.
// If you later build a theme system, source these from context or CSS variables.
const THEME = {
  primary: 'blue',        // accent color family
  primaryFill: 'bg-blue-500',
  primaryHover: 'hover:bg-blue-600',
  buttonFill: 'bg-blue-500',     // matches card header
  buttonHover: 'hover:bg-blue-600',
};

const availableCourses = [
  { id: '1', title: 'Introduction to Python', creator: 'CodeWizard' },
  { id: '2', title: 'The Science of Well-being', creator: 'Dr. Happy' },
];

const discoverCourses = [
  {
    id: '3',
    title: 'Financial Markets 101',
    creator: 'MoneyMaven',
    category: 'Finance',
    difficulty: 'Intermediate',
    rating: 4.7,
  },
  {
    id: '4',
    title: 'Creative Writing Masterclass',
    creator: 'WordSmith',
    category: 'Arts',
    difficulty: 'Beginner',
    rating: 4.6,
  },
];

// Card made responsive with consistent header height and flex layout
// so cards align to equal height within rows.
const CourseCard = ({
  course,
  onSelect,
}: {
  course: any;
  onSelect: (id: string) => void;
}) => (
  <div
    className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all cursor-pointer h-full flex flex-col"
    onClick={() => onSelect(course.id)}
    aria-label={`Open course ${course.title}`}
    role="button"
  >
    {/* Consistent visual accent tied to theme */}
    <div
      className={`w-full h-24 sm:h-28 ${THEME.primaryFill} flex items-center justify-center font-bold text-lg sm:text-xl`}
    >
      {course.title.split(' ')[0]}
    </div>

    {/* Content area grows to fill the card, keeping heights aligned */}
    <div className="p-3 sm:p-4 flex-1 flex flex-col">
      <h3 className="text-base sm:text-lg font-bold leading-snug">{course.title}</h3>
      <p className="text-gray-400 text-xs sm:text-sm mt-1">By {course.creator}</p>

      {/* Metadata row pinned to bottom when present */}
      {course.category && (
        <div className="mt-auto pt-3 flex justify-between items-center">
          <span className={`text-${THEME.primary}-300 text-[10px] sm:text-xs`}>
            {course.category} · {course.difficulty}
          </span>
          <span className="text-yellow-400 font-semibold text-xs sm:text-sm">
            ⭐ {course.rating}
          </span>
        </div>
      )}
    </div>
  </div>
);

export default function CoursesDashboard() {
  const router = useRouter();

  const handleSelectCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleCreateCourse = () => {
    router.push('/courses/create');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6 md:p-8 relative">
      {/* Create button matches theme accent. Elevated and responsive spacing. */}
      <button
        onClick={handleCreateCourse}
        className={`fixed sm:absolute bottom-4 sm:bottom-auto right-4 sm:top-6 sm:right-8 ${THEME.buttonFill} ${THEME.buttonHover} text-white px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base rounded-lg shadow-lg transition`}
        aria-label="Create a new course"
      >
        + Create New Course
      </button>

      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 md:space-y-16">
        {/* Available Courses Section */}
        <section>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Available Courses
          </h1>

          {/* Consistent grid across sections:
             - 1 col on mobile
             - 2 cols on sm+
             - 3 cols on lg+ (optional)
             - auto-rows ensure cards align in rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
            {availableCourses.map((course) => (
              <CourseCard key={course.id} course={course} onSelect={handleSelectCourse} />
            ))}
          </div>
        </section>

        {/* Discover New Courses Section — uses same grid sizing to match */}
        <section>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Discover New Courses
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
            {discoverCourses.map((course) => (
              <CourseCard key={course.id} course={course} onSelect={handleSelectCourse} />
            ))}
          </div>
        </section>
      </div>

      {/* Padding so the fixed button doesn’t overlay content on mobile */}
      <div className="pb-16 sm:pb-0" />
    </div>
  );
}
