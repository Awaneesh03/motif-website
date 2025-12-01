import Groq from "groq-sdk";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class GroqService {
  private groq: Groq | null = null;

  constructor() {
    // Initialize without API key - will be set by user
  }

  setApiKey(apiKey: string) {
    this.groq = new Groq({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq API key not set. Please set your API key in the chat settings.');
    }

    try {
      const groqMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const completion = await this.groq.chat.completions.create({
        messages: groqMessages,
        model: "llama-3.1-8b-instant", // Fast and reliable model
        max_tokens: 4000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Error sending message to Groq:', error);
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your Groq API key.');
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      throw new Error('Failed to send message. Please try again.');
    }
  }

  isConfigured(): boolean {
    return this.groq !== null;
  }
}

export const groqService = new GroqService();