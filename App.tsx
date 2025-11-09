import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Sender, GamePhase, AnalysisResult, AnalysisPayload } from './types';
import { getStoryResponse, analyzeResponse } from './services/geminiService';
import ChatBubble from './components/ChatBubble';
import TypingIndicator from './components/TypingIndicator';
import { PaperPlaneIcon, CuteRobotIcon, MicrophoneIcon } from './components/icons';
import ParentReport from './components/ParentReport';

// Fix: Add TypeScript definitions for the Web Speech API which are not available by default.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  // Fix: Add missing property 'resultIndex' to the SpeechRecognitionEvent interface.
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}


const MAX_TURNS = 5;
const INITIAL_PROMPTS = [
    "Hi! Let's tell a story together! You find a magic door. What color is it?",
    "Hello! I'm so glad you're here. Let's imagine something amazing! You stumble upon a mysterious, glowing key. What do you do with it?",
    "Hey there! Ready for an adventure? You meet a tiny dragon who has lost its roar. What's the first thing you say to it?",
    "Hi friend! Let's create a story. You discover a secret map hidden in an old book. Where do you think it leads?",
    "Welcome, storyteller! You're given a special seed that can grow anything you can imagine. What do you plant first?",
];

const App: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.START);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const responseStartTime = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening after pauses
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
         setUserInput(prev => prev.trim() ? prev.trim() + ' ' + finalTranscript.trim() : finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
  }, []);
  
  useEffect(() => {
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            let voice = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Google')) ||
                        voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Zira')) ||
                        voices.find(v => v.lang.startsWith('en-US'));
            setSelectedVoice(voice || voices[0]);
        }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
    }
  }, []);

  const speakText = useCallback((text: string) => {
      if (!selectedVoice || !window.speechSynthesis) return;
      window.speechSynthesis.cancel(); // Stop any currently playing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.pitch = 1.1;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
  }, [selectedVoice]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const resetGame = () => {
    setMessages([]);
    setAnalysisResults([]);
    setUserInput('');
    setIsLoading(false);
    setGamePhase(GamePhase.START);
    window.speechSynthesis.cancel();
  };

  const startGame = () => {
    const randomPrompt = INITIAL_PROMPTS[Math.floor(Math.random() * INITIAL_PROMPTS.length)];
    const firstMessage: ChatMessage = { id: Date.now().toString(), sender: Sender.AI, text: randomPrompt };
    setMessages([firstMessage]);
    setGamePhase(GamePhase.PLAYING);
    responseStartTime.current = Date.now();
    speakText(randomPrompt);
  };
  
  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      setUserInput('');
      recognition.start();
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (userInput.trim() === '' || isLoading) return;

    if (isListening) {
        recognitionRef.current?.stop();
    }

    const responseTime = (Date.now() - responseStartTime.current) / 1000;
    const userMessage: ChatMessage = { id: Date.now().toString(), sender: Sender.USER, text: userInput.trim() };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setUserInput('');
    setIsLoading(true);

    const lastAiMessage = messages[messages.length - 1]?.text || '';

    try {
        const [analysis, story] = await Promise.all([
            analyzeResponse(userMessage.text, lastAiMessage, responseTime),
            getStoryResponse(currentMessages)
        ]);

        const newAnalysisResult: AnalysisResult = {
            responseTime,
            analysis: analysis as AnalysisPayload,
            rawResponse: userMessage.text,
        };
        const updatedResults = [...analysisResults, newAnalysisResult];
        setAnalysisResults(updatedResults);

        const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: Sender.AI, text: story };
        setMessages(prev => [...prev, aiMessage]);
        speakText(story);

        if (updatedResults.length >= MAX_TURNS) {
            setGamePhase(GamePhase.REPORT);
        } else {
            responseStartTime.current = Date.now();
        }
    } catch (error) {
        console.error("Failed to get responses from AI:", error);
        const errorMessageText = "I'm having a little trouble thinking. Can you tell me that again?";
        const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: Sender.AI, text: errorMessageText };
        setMessages(prev => [...prev, errorMessage]);
        speakText(errorMessageText);
    } finally {
        setIsLoading(false);
    }
  }, [userInput, isLoading, messages, analysisResults, isListening, speakText]);

  const renderContent = () => {
    switch (gamePhase) {
      case GamePhase.START:
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <CuteRobotIcon className="h-32 w-32 mb-4" />
            <h1 className="text-5xl font-extrabold text-slate-800 mb-3">Hello, I'm NeuroBuddy!</h1>
            <p className="text-lg text-slate-600 max-w-md mx-auto mb-10">Let's make up a fun story together. Are you ready?</p>
            <button
              onClick={startGame}
              className="bg-teal-500 text-white font-bold py-3 px-10 rounded-full hover:bg-teal-600 transition-all duration-300 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-200"
            >
              Let's Play!
            </button>
          </div>
        );
      case GamePhase.PLAYING:
        return (
          <div className="flex flex-col h-full">
            <header className="p-4 text-center z-10 border-b border-slate-200/50">
              <h2 className="text-2xl font-bold text-slate-700">NeuroBuddy Story Time</h2>
              <p className="text-sm text-slate-500 font-semibold">Turn {analysisResults.length + 1} of {MAX_TURNS}</p>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
              {isLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </main>
            <footer className="p-3 border-t border-slate-200/50">
              <div className="flex items-center max-w-3xl mx-auto bg-white/80 rounded-full p-1.5 shadow-inner ring-1 ring-slate-200">
                <button
                  onClick={handleMicClick}
                  disabled={isLoading}
                  className={`relative p-3 rounded-full transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-400
                    ${isListening 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-slate-500 hover:bg-slate-100'
                    }
                    disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 shadow-sm`}
                  aria-label={isListening ? "Stop listening" : "Use microphone"}
                >
                  <MicrophoneIcon />
                   {isListening && <span className="absolute h-full w-full rounded-full bg-red-500 animate-ping opacity-75"></span>}
                </button>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? "Listening..." : "Type your story here..."}
                  className="flex-1 w-full px-4 py-2 bg-transparent text-slate-700 placeholder-slate-400 focus:outline-none"
                  disabled={isLoading}
                  aria-label="Chat input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || userInput.trim() === ''}
                  className="bg-teal-500 text-white p-3 rounded-full hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
                  aria-label="Send message"
                >
                  <PaperPlaneIcon />
                </button>
              </div>
            </footer>
          </div>
        );
      case GamePhase.REPORT:
        return (
            <div className="p-4 md:p-6 bg-slate-50 overflow-y-auto h-full">
                <ParentReport results={analysisResults} onRestart={resetGame} />
            </div>
        );
    }
  };
  
  const Background = () => (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-10 -left-24 w-96 h-96 bg-white/20 rounded-full filter blur-3xl opacity-80"></div>
        <div className="absolute -top-24 right-10 w-80 h-80 bg-white/20 rounded-full filter blur-3xl opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-full h-48">
            <div className="absolute -bottom-24 -right-20 w-[30rem] h-[30rem] bg-green-300/60 rounded-full filter blur-sm"></div>
            <div className="absolute -bottom-28 -left-20 w-[25rem] h-[25rem] bg-emerald-400/50 rounded-full filter blur-sm"></div>
        </div>
    </div>
  );

  return (
    <div className="h-screen w-screen font-sans relative flex items-center justify-center p-0 md:p-4">
        <Background />
        <div className="relative z-10 h-full w-full md:h-full md:max-h-[850px] md:w-full md:max-w-2xl bg-white/60 backdrop-blur-xl flex flex-col rounded-none md:rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-200/50">
            {renderContent()}
        </div>
    </div>
  );
};

export default App;
