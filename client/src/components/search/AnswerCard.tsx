// Client: Answer display with sources and feedback

import React, { useState } from 'react';
import { SourceCard } from './SourceCard';
import { Button } from '../ui/Button';

interface Source {
  chunkId: string;
  label: string;
  title: string;
  excerpt: string;
}

interface AnswerCardProps {
  answer: string;
  sources: Source[];
  messageId: string;
  onFeedbackSubmit: (rating: 'HELPFUL' | 'NOT_HELPFUL') => void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  sources,
  messageId,
  onFeedbackSubmit,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  const handleFeedback = (rating: 'HELPFUL' | 'NOT_HELPFUL') => {
    onFeedbackSubmit(rating);
    setFeedbackGiven(rating);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 space-y-6">
      {/* Answer Text */}
      <div className="bg-surface p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-text whitespace-pre-wrap leading-relaxed">{answer}</p>

        {/* Feedback Control */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          {feedbackGiven ? (
            <p className="text-sm text-text-secondary">Thanks for your feedback!</p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Was this helpful?</span>
              <Button variant="ghost" size="sm" onClick={() => handleFeedback('HELPFUL')}>
                👍 Yes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleFeedback('NOT_HELPFUL')}>
                👎 No
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sources Grid */}
      {sources && sources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-text">Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((source, idx) => (
              <SourceCard
                key={idx}
                label={source.label}
                title={source.title}
                excerpt={source.excerpt}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
