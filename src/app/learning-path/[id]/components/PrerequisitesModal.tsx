'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Info, CheckCircle, Target, X } from 'lucide-react';
import { SkillGraph, SkillNode } from '@/lib/courseCreation/types';
import type { SkillState } from '@/types/skill-progression';

interface SkillProgress {
  challengesCompleted: number;
  challengesRequired: number;
  progressPercentage: number;
}

interface PrerequisitesModalProps {
  showPrerequisites: string | null;
  graph: SkillGraph;
  getSkillState: (skillId: string) => SkillState;
  getSkillProgress: (skillId: string) => SkillProgress | null;
  getUnmetPrerequisites: (skill: SkillNode) => SkillNode[];
  onClose: () => void;
  onSkillClick: (skillId: string) => void;
}

export default function PrerequisitesModal({
  showPrerequisites,
  graph,
  getSkillState,
  getSkillProgress,
  getUnmetPrerequisites,
  onClose,
  onSkillClick
}: PrerequisitesModalProps) {
  return (
    <AnimatePresence>
      {showPrerequisites && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full shadow-2xl"
          >
            {(() => {
              const skill = graph.nodes.find(n => n.id === showPrerequisites);
              const unmetPrereqs = skill ? getUnmetPrerequisites(skill) : [];

              return (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Lock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Skill Locked</h3>
                      <p className="text-sm text-gray-400">{skill?.title}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-300 text-sm mb-2">
                      Complete these prerequisites to unlock this skill:
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Info className="w-3 h-3" />
                      <span>{unmetPrereqs.length} of {skill?.prerequisites?.length || 0} remaining</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {unmetPrereqs.map((prereq, index) => {
                      const prereqState = getSkillState(prereq.id);
                      const prereqProgress = getSkillProgress(prereq.id);

                      return (
                        <motion.div
                          key={prereq.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors group"
                          onClick={() => {
                            onClose();
                            onSkillClick(prereq.id);
                          }}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
                            prereqState === 'mastered' ? 'bg-green-500' :
                            prereqState === 'unlocked' ? 'bg-indigo-500' : 'bg-gray-600'
                          }`}>
                            {prereqState === 'mastered' ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : prereqState === 'unlocked' ? (
                              <Target className="w-4 h-4 text-white" />
                            ) : (
                              <Lock className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium group-hover:text-indigo-300 transition-colors">
                              {prereq.title}
                            </p>
                            {prereqProgress && (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-400">
                                  {prereqProgress.challengesCompleted}/{prereqProgress.challengesRequired} challenges
                                </p>
                                {prereqProgress.progressPercentage > 0 && (
                                  <div className="flex-1 max-w-16 bg-gray-600 rounded-full h-1">
                                    <div
                                      className={`h-1 rounded-full ${
                                        prereqState === 'mastered' ? 'bg-green-500' : 'bg-indigo-500'
                                      }`}
                                      style={{ width: `${prereqProgress.progressPercentage}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end text-xs text-gray-400">
                            <span>{prereq.estimatedMinutes}m</span>
                            {prereqState === 'unlocked' && (
                              <span className="text-indigo-400 font-medium">Available</span>
                            )}
                            {prereqState === 'mastered' && (
                              <span className="text-green-400 font-medium">Complete</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    {unmetPrereqs.length > 0 && (
                      <button
                        onClick={() => {
                          onClose();
                          // Navigate to first unmet prerequisite
                          onSkillClick(unmetPrereqs[0].id);
                        }}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                      >
                        Start First
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}