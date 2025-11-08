
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Sender, GamePhase, AnalysisResult, AnalysisPayload } from './types';
import { getStoryResponse, analyzeResponse } from './services/geminiService';
import ChatBubble from './components/ChatBubble';
import TypingIndicator from './components/TypingIndicator';
import { SendIcon, RobotIcon, MicrophoneIcon } from './components/icons';
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
const INITIAL_PROMPT = "Hi! Let's tell a story together! You find a magic door. What color is it?";

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
         setUserInput(prev => prev + finalTranscript);
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
    const firstMessage: ChatMessage = { id: Date.now().toString(), sender: Sender.AI, text: INITIAL_PROMPT };
    setMessages([firstMessage]);
    setGamePhase(GamePhase.PLAYING);
    responseStartTime.current = Date.now();
    speakText(INITIAL_PROMPT);
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

    const lastAiMessage = messages[messages.length - 1]?.text || INITIAL_PROMPT;

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
            <div className="bg-purple-500 rounded-full p-4 mb-6 shadow-lg">
                <RobotIcon />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to NeuroBuddy!</h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">A fun story game to explore creativity and response patterns.</p>
            <button
              onClick={startGame}
              className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full hover:bg-purple-700 transition-colors duration-300 shadow-lg transform hover:scale-105"
            >
              Let's Play!
            </button>
          </div>
        );
      case GamePhase.PLAYING:
        return (
          <div className="flex flex-col h-full">
            <header className="bg-white p-4 text-center shadow-md">
              <h2 className="text-xl font-bold text-purple-600">NeuroBuddy Story Time</h2>
              <p className="text-sm text-gray-500">Turns remaining: {MAX_TURNS - analysisResults.length}</p>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-blue-50">
              {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
              {isLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </main>
            <footer className="p-4 bg-white border-t">
              <div className="flex items-center max-w-3xl mx-auto">
                <button
                  onClick={handleMicClick}
                  disabled={isLoading}
                  className={`p-3 border-2 border-r-0 rounded-l-full transition-colors flex items-center justify-center
                    ${isListening 
                      ? 'bg-red-100 border-red-300 text-red-500 animate-pulse' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }
                    disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-300`}
                  aria-label={isListening ? "Stop listening" : "Use microphone"}
                >
                  <MicrophoneIcon />
                </button>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? "Listening... click mic to stop" : "Type or press mic to talk..."}
                  className="flex-1 w-full p-3 border-y-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  disabled={isLoading}
                  aria-label="Chat input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || userInput.trim() === ''}
                  className="bg-purple-600 text-white p-3 rounded-r-full hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors border-2 border-l-0 border-purple-600 disabled:border-gray-400"
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </footer>
          </div>
        );
      case GamePhase.REPORT:
        return (
            <div className="p-4 md:p-6 overflow-y-auto">
                <ParentReport results={analysisResults} onRestart={resetGame} />
            </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-blue-100 font-sans flex items-center justify-center">
        <div className="h-full w-full md:h-[90vh] md:w-[60vw] md:max-w-4xl md:min-w-[400px] bg-gray-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            {renderContent()}
        </div>
    </div>
  );
};

export default App;
