
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Sender } from "../types";

const STORYTELLER_MODEL = 'gemini-2.5-flash';
const ANALYZER_MODEL = 'gemini-2.5-flash';

// This function assumes the API key is set in the environment
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const storytellerSystemInstruction = `You are NeuroBuddy, a friendly and imaginative AI friend for a young child (around 5-7 years old). 
Your goal is to create a fun, interactive story together.
- Keep your responses short, simple, and exciting (1-2 sentences).
- Always end your response with an open-ended question to encourage the child to continue the story.
- Use simple language and a positive, encouraging tone.
- Never mention that you are an AI. You are a story buddy!
- Base your next story part on the child's previous response.`;

const analyzerSystemInstruction = `You are an expert AI assistant specializing in developmental psychology. 
Your task is to analyze a child's text response within a story-telling context. 
Analyze the provided text based ONLY on the criteria given in the schema.
Provide a neutral, data-driven analysis. Do not offer diagnoses or advice.
The child's response time will be provided; use it to determine if the response was delayed (>10 seconds).`;

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    attention: {
      type: Type.OBJECT,
      properties: {
        fillerWordCount: {
          type: Type.INTEGER,
          description: "Count the number of filler words like 'um', 'uh', 'er', 'like', 'you know'."
        },
        isDelayed: {
          type: Type.BOOLEAN,
          description: "True if the response time (provided in the prompt) is greater than 10 seconds."
        },
      },
    },
    language: {
      type: Type.OBJECT,
      properties: {
        responseLength: {
          type: Type.INTEGER,
          description: "The total number of words in the child's response."
        },
        isShortResponse: {
          type: Type.BOOLEAN,
          description: "True if the response length is less than 5 words."
        },
        vocabularyDiversity: {
          type: Type.INTEGER,
          description: "A score from 1 (very repetitive) to 5 (very diverse) for the vocabulary used."
        },
        isSentenceIncomplete: {
            type: Type.BOOLEAN,
            description: "True if the response seems to be an incomplete sentence or thought."
        }
      },
    },
    engagement: {
      type: Type.OBJECT,
      properties: {
        isOnTopic: {
          type: Type.BOOLEAN,
          description: "True if the response is relevant to the story prompt."
        },
        answersQuestion: {
          type: Type.BOOLEAN,
          description: "True if the response directly or indirectly answers the AI's last question."
        }
      }
    }
  }
};

export const getStoryResponse = async (chatHistory: ChatMessage[]): Promise<string> => {
  const ai = getAi();
  
  const contents = chatHistory.map(msg => ({
    role: msg.sender === Sender.USER ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: STORYTELLER_MODEL,
        contents: contents,
        config: {
            systemInstruction: storytellerSystemInstruction,
            temperature: 0.9,
        },
    });
    return response.text;
  } catch (error) {
    console.error("Error getting story response:", error);
    return "Oh no! My imagination got stuck. Let's try again. What happens next?";
  }
};

export const analyzeResponse = async (childResponse: string, storyContext: string, responseTime: number): Promise<any> => {
  const ai = getAi();
  
  const prompt = `
    Analyze the following child's response based on the provided context.
    - Story Context (My last question): "${storyContext}"
    - Child's Response: "${childResponse}"
    - Response Time: ${responseTime.toFixed(1)} seconds.
  `;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: ANALYZER_MODEL,
        contents: prompt,
        config: {
            systemInstruction: analyzerSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });
    
    // The response text is a JSON string, parse it.
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing response:", error);
    // Return a default structure on error to prevent crashes
    return {
        attention: { fillerWordCount: 0, isDelayed: responseTime > 10 },
        language: { responseLength: childResponse.split(' ').length, isShortResponse: childResponse.split(' ').length < 5, vocabularyDiversity: 1, isSentenceIncomplete: false },
        engagement: { isOnTopic: false, answersQuestion: false }
    };
  }
};
