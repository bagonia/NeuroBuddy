
import React, { useMemo } from 'react';
import { AnalysisResult, Flag, FlagCategory } from '../types';

interface ParentReportProps {
  results: AnalysisResult[];
  onRestart: () => void;
}

const FlagCard: React.FC<{ flag: Flag, totalTurns: number }> = ({ flag, totalTurns }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-400">
        <h3 className="font-bold text-gray-800">{flag.category}</h3>
        <p className="text-gray-600 mt-1">{flag.description}</p>
        <p className="text-sm text-gray-500 mt-2 font-medium">Observed in {flag.count} of {totalTurns} responses.</p>
    </div>
);

const ParentReport: React.FC<ParentReportProps> = ({ results, onRestart }) => {
  const totalTurns = results.length;

  const averageCalibratedResponseTime = useMemo(() => {
    if (totalTurns === 0) return 0;

    // Estimated speaking rate for a child (words per second)
    const WORDS_PER_SECOND = 2; 

    const totalNetTime = results.reduce((sum, r) => {
        const wordCount = r.rawResponse.trim().split(/\s+/).length;
        const estimatedSpeechTime = wordCount / WORDS_PER_SECOND;
        // Net time is the "thinking time" after accounting for speaking
        const netTime = r.responseTime - estimatedSpeechTime;
        // Don't allow negative time if they speak faster than the estimate
        return sum + Math.max(0, netTime); 
    }, 0);

    return (totalNetTime / totalTurns).toFixed(1);
  }, [results, totalTurns]);

  const flaggedPatterns = useMemo((): Flag[] => {
    const flags: { [key: string]: Flag } = {};

    const addFlag = (category: FlagCategory, description: string) => {
        const key = `${category}-${description}`;
        if (flags[key]) {
            flags[key].count++;
        } else {
            flags[key] = { category, description, count: 1 };
        }
    };

    results.forEach(r => {
        // Attention
        if (r.analysis.attention.isDelayed) {
            addFlag(FlagCategory.ATTENTION, "Delayed responses (>10 seconds)");
        }
        if (r.analysis.attention.fillerWordCount > 1) {
            addFlag(FlagCategory.ATTENTION, "Frequent use of filler words (e.g., 'um', 'uh')");
        }
        // Language
        if (r.analysis.language.isShortResponse) {
            addFlag(FlagCategory.LANGUAGE, "Very short responses (<5 words)");
        }
        if (r.analysis.language.isSentenceIncomplete) {
            addFlag(FlagCategory.LANGUAGE, "Incomplete sentences");
        }
        if(r.analysis.language.vocabularyDiversity <= 2){
            addFlag(FlagCategory.LANGUAGE, "Limited vocabulary (repetitive words)");
        }
        // Engagement
        if (!r.analysis.engagement.isOnTopic) {
            addFlag(FlagCategory.ENGAGEMENT, "Off-topic responses");
        }
        if (!r.analysis.engagement.answersQuestion) {
            addFlag(FlagCategory.ENGAGEMENT, "Did not answer the question");
        }
    });

    // We only show flags that appear in more than one response to avoid over-flagging single instances
    return Object.values(flags).filter(f => f.count > 1).sort((a,b) => b.count - a.count);
  }, [results]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 text-gray-800">
      <h1 className="text-3xl font-bold text-center text-purple-600 mb-2">Parent Report</h1>
      <p className="text-center text-gray-500 mb-6">This is a summary of observed patterns from the story game.</p>
      
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md mb-8" role="alert">
        <p className="font-bold">Important Disclaimer</p>
        <p>NeuroBuddy is a developmental screening tool, not a diagnostic tool. These observations are intended to help you understand your child's response patterns and are not a substitute for professional medical advice.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg text-center shadow-inner">
            <p className="text-lg text-gray-600">Total Story Turns</p>
            <p className="text-4xl font-bold text-purple-600">{totalTurns}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center shadow-inner">
            <p className="text-lg text-gray-600">Avg. Calibrated Response Time</p>
            <p className="text-4xl font-bold text-purple-600">{averageCalibratedResponseTime}s</p>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Observed Patterns</h2>
        {flaggedPatterns.length > 0 ? (
          <div className="space-y-4">
            {flaggedPatterns.map(flag => <FlagCard key={`${flag.category}-${flag.description}`} flag={flag} totalTurns={totalTurns} />)}
          </div>
        ) : (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center">
            <p className="font-semibold">No consistent patterns were flagged during this session. Great engagement!</p>
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
        <button 
          onClick={onRestart}
          className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 transition-colors duration-300 shadow-lg transform hover:scale-105"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default ParentReport;
