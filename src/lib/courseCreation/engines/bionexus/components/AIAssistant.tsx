import React from 'react';

const AIAssistant = ({ moduleName, onClose }: { moduleName: string; onClose: () => void }) => {
  return (
    <div>
      AIAssistant for: {moduleName}
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default AIAssistant;
