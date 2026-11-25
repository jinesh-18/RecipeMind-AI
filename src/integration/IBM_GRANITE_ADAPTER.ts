/**
 * IBM Granite Service Adapter Interface
 *
 * This module defines the interface for integrating IBM Granite language models
 * via IBM watsonx.ai. Replace the local demo engine by implementing this interface.
 *
 * Required environment variables (never expose in frontend):
 *   VITE_WATSONX_API_URL       - e.g. https://us-south.ml.cloud.ibm.com
 *   VITE_WATSONX_PROJECT_ID    - Your watsonx.ai project ID
 *   IBM_API_KEY                - IBM Cloud API key (server-side only)
 *
 * Integration pattern: proxy all IBM API calls through a backend service (Node.js/Express)
 * to keep API credentials out of the browser bundle.
 *
 * IBM Granite models available on watsonx.ai:
 *   - ibm/granite-13b-instruct-v2
 *   - ibm/granite-20b-multilingual
 *   - ibm/granite-34b-code-instruct
 *
 * @see https://dataplatform.cloud.ibm.com/docs/content/wsj/analyze-data/fm-api.html
 */

export interface GraniteGenerationRequest {
  modelId: string;
  input: string;
  parameters: {
    decoding_method: 'greedy' | 'sample';
    max_new_tokens: number;
    min_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
    stop_sequences?: string[];
  };
  project_id: string;
}

export interface GraniteGenerationResponse {
  model_id: string;
  created_at: string;
  results: Array<{
    generated_text: string;
    generated_token_count: number;
    input_token_count: number;
    stop_reason: string;
  }>;
}

/**
 * Interface for the Granite service adapter.
 * Implement this interface and inject it into chatbotService and recipeGenerationService
 * to enable real IBM Granite inference.
 */
export interface IGraniteAdapter {
  generateText(prompt: string, options?: Partial<GraniteGenerationRequest['parameters']>): Promise<string>;
  generateRecipe(context: string, userRequest: string): Promise<string>;
  answerQuestion(question: string, context: string): Promise<string>;
}

/**
 * Demo adapter — returns null to signal fallback to local engine.
 * Replace with a real implementation pointing to your backend proxy.
 */
export class DemoGraniteAdapter implements IGraniteAdapter {
  async generateText(_prompt: string): Promise<string> {
    throw new Error('IBM Granite not configured. See integration/IBM_GRANITE_ADAPTER.ts');
  }
  async generateRecipe(_context: string, _userRequest: string): Promise<string> {
    throw new Error('IBM Granite not configured. See integration/IBM_GRANITE_ADAPTER.ts');
  }
  async answerQuestion(_question: string, _context: string): Promise<string> {
    throw new Error('IBM Granite not configured. See integration/IBM_GRANITE_ADAPTER.ts');
  }
}

/**
 * Example implementation — connect to your backend proxy endpoint.
 *
 * export class GraniteAdapter implements IGraniteAdapter {
 *   private baseUrl: string;
 *
 *   constructor(backendUrl: string) {
 *     this.baseUrl = backendUrl;
 *   }
 *
 *   async generateText(prompt: string, options = {}): Promise<string> {
 *     const res = await fetch(`${this.baseUrl}/api/granite/generate`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ prompt, ...options }),
 *     });
 *     if (!res.ok) throw new Error(`Granite API error: ${res.status}`);
 *     const data = await res.json();
 *     return data.generated_text;
 *   }
 * }
 */
