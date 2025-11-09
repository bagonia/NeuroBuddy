
export enum Sender {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
}

export enum GamePhase {
  START,
  PLAYING,
  REPORT,
}

export interface AnalysisPayload {
  attention: {
    fillerWordCount: number;
    isDelayed: boolean;
  };
  language: {
    responseLength: number;
    isShortResponse: boolean;
    vocabularyDiversity: number; // Score 1-5
    isSentenceIncomplete: boolean;
  };
  engagement: {
    isOnTopic: boolean;
    answersQuestion: boolean;
  };
}

export interface AnalysisResult {
  responseTime: number; // in seconds
  analysis: AnalysisPayload;
  rawResponse: string;
}

export enum FlagCategory {
    ATTENTION = 'Attention Markers',
    LANGUAGE = 'Language Markers',
    ENGAGEMENT = 'Engagement Markers',
}

export interface Flag {
    category: FlagCategory;
    description: string;
    count: number;
}