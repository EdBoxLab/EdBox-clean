import React from 'react';
import * as ICONS from '../icons';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="header">
        <div className="header-title">
          <h1>My Courses</h1>
        </div>
        <div className="header-actions">
          <button className="btn-new-course">+ New Course</button>
        </div>
      </div>

      <div className="course-card">
        <div className="course-card-inner">
          <div className="course-card-front">
            <div className="course-card-image">
              <img src="/python-logo.png" alt="Python Logo" />
            </div>
            <div className="course-card-content">
              <div className="course-card-title">
                <h2>Introduction to Python</h2>
                <p>Beginner - Programming</p>
              </div>
              <div className="course-card-progress">
                <div className="progress-bar">
                  <div className="progress" style={{ width: '0%' }}></div>
                </div>
                <div className="progress-text">0%</div>
              </div>
              <div className="course-card-stats">
                <div className="stat">
                  <ICONS.FileIcon />
                  <span>0</span>
                </div>
                <div className="stat">
                  <ICONS.FileIcon />
                  <span>0</span>
                </div>
              </div>
              <div className="course-card-actions">
                <button className="btn-start">Start</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-item active">
          <ICONS.BookOpenIcon />
          <span>Courses</span>
        </div>
        <div className="nav-item">
          <ICONS.SparklesIcon />
          <span>For You</span>
        </div>
        <div className="nav-item">
          <ICONS.ReportIcon />
          <span>Stats</span>
        </div>
        <div className="nav-item">
          <ICONS.SparklesIcon />
          <span>Genie</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
