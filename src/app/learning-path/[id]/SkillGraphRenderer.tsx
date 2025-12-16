'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Skill } from './types';
import { SkillCard } from './SkillCard';

interface SkillRendererProps {
  skills: Skill[];
  onSelectSkill: (skill: Skill) => void;
}

export function SkillRenderer({ skills, onSelectSkill }: SkillRendererProps) {
  if (!skills || skills.length === 0) {
    return <p className="text-gray-500 text-sm">No skills available yet.</p>;
  }

  const nextSkill = skills.find(
    s => s.prerequisitesMet && s.status !== 'mastered'
  );

  const remainingSkills = skills.filter(
    s => s.id !== nextSkill?.id
  );

  const allMastered = skills.every(s => s.status === 'mastered');

  return (
    <div className="space-y-10">

      {/* NEXT SKILL */}
      <AnimatePresence mode="wait">
        {nextSkill && !allMastered && (
          <motion.div
            key={nextSkill.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="rounded-3xl border border-black p-6">
              <p className="text-xs uppercase tracking-wide mb-2 text-gray-500">
                Next Skill to Master
              </p>
              <SkillCard
                skill={nextSkill}
                onClick={() => onSelectSkill(nextSkill)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEARNING PATH */}
      <div>
        <h4 className="text-sm font-medium mb-4">Learning Path</h4>
        {allMastered ? (
          <p className="text-green-600 text-sm">🎉 All skills mastered!</p>
        ) : (
          <div className="grid gap-3">
            {remainingSkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onClick={() => onSelectSkill(skill)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}