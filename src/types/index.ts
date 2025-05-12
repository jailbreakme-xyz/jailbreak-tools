// JSON-RPC 2.0 types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface JsonRpcSuccessResponse {
  jsonrpc: '2.0';
  id: string | number;
  result: any;
}

export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

// Error codes
export enum ErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
}

// Tool input/output types
export interface DetectJailbreakInput {
  prompt: string;
}

export interface SimilarPrompt {
  prompt: string;
  similarity_score: number;
}

export interface DetectJailbreakOutput {
  classification: 'safe' | 'unsafe' | 'unknown';
  score: number;
  similar_prompts: SimilarPrompt[];
}

export interface SimulateResponseInput {
  prompt: string;
}

export interface SimulatedResponse {
  prompt: string;
  response: string;
  similarity: number;
}

export interface SimulateResponseOutput {
  simulated_responses: SimulatedResponse[];
}

export interface VectorSearchInput {
  query: string;
  limit?: number;
}

export interface SearchResult {
  content: string;
  challenge: string;
  score: number;
  win?: boolean;
  alcatraz?: boolean;
}

export interface VectorSearchOutput {
  results: SearchResult[];
}

// Embedding vector type
export type EmbeddingVector = number[];

// MongoDB document types
export interface ChatDocument {
  _id?: string;
  challenge: string;
  model?: string;
  role: string;
  content: string;
  tool_calls?: any;
  address: string;
  txn?: string;
  fee?: number;
  thread_id?: string;
  win?: boolean;
  alcatraz?: boolean;
  date?: Date;
}

export interface EmbeddedChatDocument {
  _id?: string;
  original_chat_id: string;
  challenge: string;
  content: string;
  embedding: EmbeddingVector;
  address: string;
  metadata: {
    model?: string;
    thread_id?: string;
    win?: boolean;
    alcatraz?: boolean;
    date?: Date;
  };
  created_at?: Date;
}

// MCP Tool function types
export type DetectJailbreakFn = (params: DetectJailbreakInput) => Promise<DetectJailbreakOutput>;
export type SimulateResponseFn = (params: SimulateResponseInput) => Promise<SimulateResponseOutput>;
export type VectorSearchFn = (params: VectorSearchInput) => Promise<VectorSearchOutput>; 