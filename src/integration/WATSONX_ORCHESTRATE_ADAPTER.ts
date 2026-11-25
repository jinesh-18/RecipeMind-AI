/**
 * IBM watsonx Orchestrate Adapter Interface
 *
 * This module defines the interface for integrating IBM watsonx Orchestrate
 * for agentic workflow automation in RecipeMind AI.
 *
 * watsonx Orchestrate can automate:
 *   - Multi-step recipe generation workflows
 *   - Document processing via the "Try Document Processing Agent"
 *   - Shopping list optimization
 *   - Meal planning orchestration
 *   - Nutritional analysis workflows
 *
 * IMPORTANT: Do not add agent IDs, app IDs, or credentials here.
 * Connection details must be verified against your actual watsonx Orchestrate instance.
 *
 * Required environment variables (server-side only):
 *   ORCHESTRATE_API_URL         - Your watsonx Orchestrate instance URL
 *   ORCHESTRATE_API_KEY         - API key for your Orchestrate instance
 *   ORCHESTRATE_AGENT_ID        - Agent ID to invoke (verify from your instance)
 *
 * @see https://www.ibm.com/docs/en/watsonx/watson-orchestrate
 */

export interface OrchestrateInvokeRequest {
  agentId: string;
  input: {
    task: string;
    context?: Record<string, unknown>;
  };
  sessionId?: string;
}

export interface OrchestrateInvokeResponse {
  sessionId: string;
  status: 'completed' | 'running' | 'failed';
  output?: {
    text?: string;
    structured?: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Interface for the watsonx Orchestrate adapter.
 * Implement to enable agentic document processing and workflow automation.
 */
export interface IOrchestrateAdapter {
  /**
   * Process a document through the Document Processing Agent.
   * The "Try Document Processing Agent" in your Orchestrate instance
   * may be able to extract structured recipe data from PDFs.
   */
  processDocument(documentContent: string, fileName: string): Promise<OrchestrateInvokeResponse>;

  /**
   * Run a meal planning workflow.
   */
  planMeals(preferences: Record<string, unknown>): Promise<OrchestrateInvokeResponse>;

  /**
   * Invoke a custom agent by ID.
   */
  invoke(request: OrchestrateInvokeRequest): Promise<OrchestrateInvokeResponse>;
}

/**
 * Stub adapter — signals that Orchestrate is not yet configured.
 */
export class StubOrchestrateAdapter implements IOrchestrateAdapter {
  async processDocument(_content: string, _fileName: string): Promise<OrchestrateInvokeResponse> {
    return { sessionId: 'stub', status: 'failed', error: 'watsonx Orchestrate not configured. See integration/WATSONX_ORCHESTRATE_ADAPTER.ts' };
  }
  async planMeals(_prefs: Record<string, unknown>): Promise<OrchestrateInvokeResponse> {
    return { sessionId: 'stub', status: 'failed', error: 'watsonx Orchestrate not configured.' };
  }
  async invoke(_req: OrchestrateInvokeRequest): Promise<OrchestrateInvokeResponse> {
    return { sessionId: 'stub', status: 'failed', error: 'watsonx Orchestrate not configured.' };
  }
}
