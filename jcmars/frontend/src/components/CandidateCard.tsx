import React from 'react';
import { JCCandidate } from '../types';

interface CandidateCardProps {
  candidate: JCCandidate;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const confidencePercentage = Math.round(candidate.confidence_score * 100);
  const confidenceColor = 
    confidencePercentage >= 80 ? 'bg-green-500' :
    confidencePercentage >= 60 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-4 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-jc-blue text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4">
            {candidate.rank}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{candidate.name}</h3>
            <p className="text-gray-600">
              {candidate.year}年 {candidate.region_name} {candidate.position}
            </p>
          </div>
        </div>
        {candidate.verified && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            公式確認済
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <span className="text-sm text-gray-600 mr-2">信頼度:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div
              className={`${confidenceColor} h-4 rounded-full transition-all duration-500`}
              style={{ width: `${confidencePercentage}%` }}
            />
          </div>
          <span className="ml-2 font-medium text-gray-800">{confidencePercentage}%</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          情報源（{candidate.evidence_sources.length}件）
        </h4>
        <div className="space-y-1">
          {candidate.evidence_sources.slice(0, 3).map((source, index) => (
            <a
              key={index}
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-jc-blue hover:underline block truncate"
            >
              {new URL(source).hostname}
            </a>
          ))}
          {candidate.evidence_sources.length > 3 && (
            <span className="text-sm text-gray-500">
              他{candidate.evidence_sources.length - 3}件
            </span>
          )}
        </div>
      </div>

      {candidate.context_snippets.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">抽出コンテキスト</h4>
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
            {candidate.context_snippets[0]}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateCard;