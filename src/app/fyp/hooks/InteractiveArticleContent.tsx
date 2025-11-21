import React from 'react';
import { KeyTerm } from './KeyTerm';
import { MiniQuiz } from './MiniQuiz';

interface InteractiveArticleContentProps {
  content: string;
}

// This regex will split the string by our special syntax, keeping the delimiters
const INTERACTIVE_ELEMENT_REGEX = /({[^|]+?\|[^}]+?}|\[QUIZ:[^|]+?\|[^|]+?\|[^\]]+?\])/g;

const KEY_TERM_REGEX = /^{([^|]+?)\|([^}]+?)}$/;
const MINI_QUIZ_REGEX = /^\[QUIZ:([^|]+?)\|([^|]+?)\|([^\]]+?)\]$/;

export const InteractiveArticleContent: React.FC<InteractiveArticleContentProps> = ({ content }) => {
  if (!content) {
    return null;
  }

  const parts = content.split(INTERACTIVE_ELEMENT_REGEX).filter(part => part);

  return (
    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap space-y-4">
      {parts.map((part, index) => {
        const keyTermMatch = part.match(KEY_TERM_REGEX);
        if (keyTermMatch) {
          const [, term, definition] = keyTermMatch;
          return <KeyTerm key={index} term={term} definition={definition} />;
        }

        const miniQuizMatch = part.match(MINI_QUIZ_REGEX);
        if (miniQuizMatch) {
          const [, question, optionsStr, answer] = miniQuizMatch;
          const options = optionsStr.split(',');
          return <MiniQuiz key={index} question={question} options={options} correctAnswer={answer} />;
        }

        // It's a plain text part, but we need to handle paragraphs.
        // Split by newlines to create separate paragraphs.
        const paragraphs = part.split('\n').map(p => p.trim()).filter(p => p);
        return paragraphs.map((p, pIndex) => (
            <p key={`${index}-${pIndex}`}>{p}</p>
        ));
      })}
    </div>
  );
};