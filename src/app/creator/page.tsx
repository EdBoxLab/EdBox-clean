'use client';

import React, { useEffect, useState } from "react";

export default function CreatorPage() {
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    // In a real app, you'd fetch this from a database.
    // For now, we'll simulate fetching from local storage.
    const storedCourse = localStorage.getItem('generatedCourse');
    if (storedCourse) {
      try {
        setCourse(JSON.parse(storedCourse));
      } catch (e) {
        console.error("Error parsing course from local storage", e);
        // Handle the error, e.g., by clearing the invalid item
        localStorage.removeItem('generatedCourse');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Course Creator
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Create, manage, and publish your interactive learning experiences.
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-3xl font-bold mb-6">Your Course</h2>
            {course ? (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-teal-400">{course.title}</h3>
                    <p className="text-gray-300">{course.description}</p>
                    {/* We will render the rest of the course content here */}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">You haven't created a course yet.</p>
                    <p className="text-gray-500 mt-2">Use the Genie chat to generate a new course!</p>
                    {/* We can add a button here to start the creation process */}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
