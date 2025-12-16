

export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface Skill {
  id: string;
  title: string;
  description?: string;
  status: SkillStatus;
  prerequisitesMet: boolean;
}

'use client';

import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface SkillCardProps {
  skill: Skill;
  onClick?: () => void;
}

export function SkillCard({ skill, onClick }: SkillCardProps) {
  const isLocked = skill.status === 'locked';
  const isMastered = skill.status === 'mastered';

  return (
    <motion.div
      layout
      whileHover={!isLocked ? { scale: 1.02 } : undefined}
      className={clsx(
        'rounded-2xl border p-4 transition-colors',
        {
          'bg-white border-black text-black cursor-pointer': skill.status === 'available' || skill.status === 'in_progress',
          'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed': isLocked,
          'bg-black border-black text-white': isMastered,
        }
      )}
      onClick={!isLocked ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">{skill.title}</h3>
        {isLocked && <Lock size={14} />}
        {isMastered && <CheckCircle size={14} />}
      </div>

      {skill.description && (
        <p className="mt-2 text-xs opacity-80">{skill.description}</p>
      )}
    </motion.div>
  );
}




const nextSkill = skills.find(
  s => s.prerequisitesMet && s.status !== 'mastered'
);

const remainingSkills = skills.filter(
  s => s.id !== nextSkill?.id
);




'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface SkillRendererProps {
  skills: Skill[];
  onSelectSkill: (skill: Skill) => void;
}

export function SkillRenderer({ skills, onSelectSkill }: SkillRendererProps) {
  const nextSkill = skills.find(
    s => s.prerequisitesMet && s.status !== 'mastered'
  );

  const remainingSkills = skills.filter(
    s => s.id !== nextSkill?.id
  );

  return (
    <div className="space-y-10">

      {/* NEXT SKILL */}
      <AnimatePresence mode="wait">
        {nextSkill && (
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
        <div className="grid gap-3">
          {remainingSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onClick={() => onSelectSkill(skill)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}


 