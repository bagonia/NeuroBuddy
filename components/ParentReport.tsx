
import React, { useMemo } from 'react';
import { AnalysisResult, Flag, FlagCategory } from '../types';
import { InfoIcon } from './icons';

interface ParentReportProps {
  results: AnalysisResult[];
  onRestart: () => void;
}

const getFlagStyle = (category: FlagCategory): { border: string; bg: string; text: string } => {
    switch (category) {
        case FlagCategory.ATTENTION:
            return { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-800' };
        case FlagCategory.LANGUAGE:
            return { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-800' };
        case FlagCategory.ENGAGEMENT:
            return { border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-800' };
        default:
            return { border: 'border-slate-500', bg: 'bg-slate-50', text: 'text-slate-800' };
    }
};

const FlagCard: React.FC<{ flag: Flag, totalTurns: number }> = ({ flag, totalTurns }) => {
    const style = getFlagStyle(flag.category);
    return (
        <div className={`p-4 rounded-lg shadow-sm border-l-4 ${style.border} ${style.bg}`}>
            <h3 className={`font-bold ${style.text}`}>{flag.category}</h3>
            <p className="text-slate-600 mt-1">{flag.description}</p>
            <p className="text-sm text-slate-500 mt-2 font-semibold">Observed {flag.count} time(s) in {totalTurns} responses.</p>
        </div>
    );
}

const ParentReport: React.FC<ParentReportProps> = ({ results, onRestart }) => {
  const totalTurns = results.length;

  const averageCalibratedResponseTime = useMemo(() => {
    if (totalTurns === 0) return 0;
    const WORDS_PER_SECOND = 2; 
    const totalNetTime = results.reduce((sum, r) => {
        const wordCount = r.rawResponse.trim().split(/\s+/).length;
        const estimatedSpeechTime = wordCount / WORDS_PER_SECOND;
        const netTime = r.responseTime - estimatedSpeechTime;
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
        if (r.analysis.attention.isDelayed) addFlag(FlagCategory.ATTENTION, "Delayed responses (>10 seconds)");
        if (r.analysis.attention.fillerWordCount > 1) addFlag(FlagCategory.ATTENTION, "Frequent use of filler words (e.g., 'um', 'uh')");
        if (r.analysis.language.isShortResponse) addFlag(FlagCategory.LANGUAGE, "Very short responses (<5 words)");
        if (r.analysis.language.isSentenceIncomplete) addFlag(FlagCategory.LANGUAGE, "Incomplete sentences");
        if(r.analysis.language.vocabularyDiversity <= 2) addFlag(FlagCategory.LANGUAGE, "Limited vocabulary (repetitive words)");
        if (!r.analysis.engagement.isOnTopic) addFlag(FlagCategory.ENGAGEMENT, "Off-topic responses");
        if (!r.analysis.engagement.answersQuestion) addFlag(FlagCategory.ENGAGEMENT, "Did not answer the question");
    });

    return Object.values(flags).filter(f => f.count > 1).sort((a,b) => b.count - a.count);
  }, [results]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 text-slate-800 font-sans">
      <h1 className="text-4xl font-extrabold text-center text-slate-700 mb-2">Parent Report</h1>
      <p className="text-center text-slate-500 mb-8">A summary of observed patterns from the story game.</p>
      
      <div className="bg-sky-100 border-l-4 border-sky-500 text-sky-800 p-4 rounded-lg mb-8 flex items-start space-x-3">
        <InfoIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div>
            <h3 className="font-bold">Important Disclaimer</h3>
            <p>NeuroBuddy is a developmental screening tool, not a diagnostic one. These observations are not a substitute for professional medical advice.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-slate-50 p-5 rounded-xl text-center shadow-inner ring-1 ring-slate-200">
            <p className="text-lg text-slate-600 font-semibold">Total Story Turns</p>
            <p className="text-5xl font-extrabold text-teal-500">{totalTurns}</p>
        </div>
        <div className="bg-slate-50 p-5 rounded-xl text-center shadow-inner ring-1 ring-slate-200">
            <p className="text-lg text-slate-600 font-semibold">Avg. Thinking Time</p>
            <p className="text-5xl font-extrabold text-teal-500">{averageCalibratedResponseTime}s</p>
            <p className="text-xs text-slate-400 -mt-1">(Calibrated for speech)</p>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4 text-slate-700 border-b-2 pb-2">Observed Patterns</h2>
        <p className="text-sm text-slate-500 mb-4">Patterns are only shown if they occurred more than once.</p>
        {flaggedPatterns.length > 0 ? (
          <div className="space-y-4">
            {flaggedPatterns.map(flag => <FlagCard key={`${flag.category}-${flag.description}`} flag={flag} totalTurns={totalTurns} />)}
          </div>
        ) : (
          <div className="bg-green-100 text-green-800 p-5 rounded-lg text-center font-semibold">
            <p>No consistent patterns were flagged. Great engagement!</p>
          </div>
        )}
      </div>

      <div className="mt-12 text-center">
        <button 
          onClick={onRestart}
          className="bg-teal-500 text-white font-bold py-3 px-10 rounded-full hover:bg-teal-600 transition-all duration-300 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-200"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default ParentReport;