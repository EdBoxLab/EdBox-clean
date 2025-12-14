import React from 'react';

const ModuleCard = ({ module, onClick }: { module: any; onClick: (module: any) => void }) => {
  return <div onClick={() => onClick(module)}>ModuleCard: {module.name}</div>;
};

export default ModuleCard;
