import { HomeIcon, CodeBracketIcon, CubeTransparentIcon, CircleStackIcon, UserGroupIcon, LifebuoyIcon,CommandLineIcon,RectangleGroupIcon } from '@heroicons/react/24/outline';

// NOTE: The IDs here are used for routing and state management.
export const SECTIONS = [
  { id: 'projects', name: 'Projects', icon: RectangleGroupIcon },
  { id: 'editor', name: 'Editor', icon: CodeBracketIcon },
  { id: 'ai-assistant', name: 'Genie', icon: LifebuoyIcon },
  { id: 'source-control', name: 'Source Control', icon: CircleStackIcon },
  { id: 'extensions', name: 'Extensions', icon: CubeTransparentIcon },
  { id: 'collaboration', name: 'Collaboration', icon: UserGroupIcon },
  { id: 'terminal', name: 'Terminal', icon: CommandLineIcon }
];