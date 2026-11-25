# RecipeMind AI — IBM Integration Guide

## Overview

RecipeMind AI is architected for seamless IBM cloud service integration. The local demo engine is designed to be replaced by IBM Granite and IBM watsonx Orchestrate with minimal changes.

## Integration Points

### 1. IBM Granite (Language Model Inference)

**File**: `src/integration/IBM_GRANITE_ADAPTER.ts`
**Used by**: `src/services/chatbotService.ts`, `src/services/recipeGenerationService.ts`

IBM Granite powers:
- Natural language recipe Q&A
- Recipe generation from document context
- Ingredient substitution suggestions
- Cooking technique explanations

**Setup steps**:
1. Create an IBM Cloud account and provision a watsonx.ai instance
2. Create a project in watsonx.ai
3. Note your Project ID and API key
4. Create a backend proxy server (never expose credentials in the React frontend)
5. Implement `IGraniteAdapter` with calls to your proxy
6. Inject the adapter into `chatbotService` and `recipeGenerationService`

**Recommended model**: `ibm/granite-13b-instruct-v2`

---

### 2. IBM watsonx Orchestrate (Agentic Workflows)

**File**: `src/integration/WATSONX_ORCHESTRATE_ADAPTER.ts`
**Potential agents**: Document Processing Agent ("Try Document Processing Agent")

watsonx Orchestrate can automate:
- PDF to structured recipe extraction (replace current client-side text extraction)
- Multi-step meal planning workflows
- Shopping list optimization
- Nutritional analysis pipelines

**Setup steps**:
1. Access your IBM watsonx Orchestrate instance
2. Verify the capabilities of the "Try Document Processing Agent"
3. Note the Agent ID and instance API URL
4. Implement `IOrchestrateAdapter` calling your Orchestrate endpoints
5. Replace `documentService.uploadDocument()` with Orchestrate-based extraction

---

### 3. IBM Cloud Storage (Document Persistence)

For production, replace `localStorage` document storage with IBM Cloud Object Storage:
- `src/services/documentService.ts` — swap `localStorage` calls with COS SDK calls
- Store document chunks in IBM Cloudant or a vector database
- Use IBM Watson Discovery for semantic search over recipe documents

---

## Environment Variables

Create `.env.local` (never commit to version control):

```env
# Backend proxy URL (create a Node.js/Express proxy server)
VITE_BACKEND_URL=http://localhost:3001

# Never put IBM API keys in VITE_ variables — they are exposed in the browser bundle
# These go in your backend server's environment:
# WATSONX_API_URL=https://us-south.ml.cloud.ibm.com
# WATSONX_PROJECT_ID=your-project-id
# IBM_API_KEY=your-ibm-api-key
# ORCHESTRATE_API_URL=https://your-orchestrate-instance.ibm.com
# ORCHESTRATE_API_KEY=your-orchestrate-key
```

---

## RAG Pipeline Upgrade Path

| Component | MVP (Current) | IBM Integration |
|-----------|--------------|-----------------|
| Text extraction | mammoth (DOCX), native (TXT) | watsonx Orchestrate Document Agent |
| Chunking | Local word splitting | IBM Watson Discovery chunking |
| Retrieval | Keyword scoring | Watson Discovery + vector embeddings |
| Generation | Template engine | IBM Granite (granite-13b-instruct-v2) |
| Persistence | localStorage | IBM Cloud Object Storage + Cloudant |

---

## Security Notes

- **Never** expose `IBM_API_KEY` in frontend code
- All IBM API calls must go through a backend proxy
- Use environment variables for all credentials
- The `.env.local` file is in `.gitignore` by default in Vite projects
