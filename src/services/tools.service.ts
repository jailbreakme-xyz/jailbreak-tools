import { Chat } from '../models/Chat.js';
import { 
  DetectJailbreakInput, 
  DetectJailbreakOutput, 
  SimulateResponseInput, 
  SimulateResponseOutput,
  VectorSearchInput,
  VectorSearchOutput,
  SimilarPrompt,
  SimulatedResponse,
  SearchResult
} from '../types/index.js';
import { createEmbedding } from './embedding.service.js';
import { findSimilarDocuments } from './vector-search.service.js';

/**
 * Detects if a prompt resembles a jailbreak attempt using vector similarity
 * @param params - The parameters for jailbreak detection
 * @returns Classification results with similar prompts
 */
export async function detectJailbreak(params: DetectJailbreakInput): Promise<DetectJailbreakOutput> {
  const { prompt } = params;
  
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid input: prompt must be a non-empty string');
  }

  // Generate embedding for the prompt
  const embedding = await createEmbedding(prompt);
  
  // Find similar prompts, potentially focusing on known unsafe ones
  const similarResults = await findSimilarDocuments(embedding, 5);
  
  // Calculate jailbreak score based on similarity
  let score = 0;
  if (similarResults.length > 0) {
    const highestSimilarity = similarResults[0].score;
    
    // Score calculation based on similarity thresholds
    if (highestSimilarity > 0.92) {
      score = 0.9 + (highestSimilarity - 0.92) * 1; // Scale remaining 0.08 to 0.1
    } else if (highestSimilarity > 0.85) {
      score = 0.6 + (highestSimilarity - 0.85) * 3.75; // Scale 0.85-0.92 to 0.6-0.9
    } else if (highestSimilarity > 0.7) {
      score = 0.5 + (highestSimilarity - 0.7) * 1.0; // Scale 0.7-0.8 to 0.5-0.6
    } else if (highestSimilarity > 0.65) {
      score = 0.1 + (highestSimilarity - 0.65) * 2; // Scale 0.65-0.75 to 0.1-0.3
    } else {
      score = highestSimilarity * 0.15; // Scale 0-0.65 to 0-0.1
    }
  }
  
  // Round to 3 decimal places
  score = Math.round(score * 1000) / 1000;
  
  // Determine classification based on score
  let classification: 'safe' | 'unsafe' | 'unknown' = 'unknown';
  if (score < 0.3) {
    classification = 'safe';
  } else if (score >= 0.5) {
    classification = 'unsafe';
  }
  
  // Format similar prompts for response
  const similar_prompts: SimilarPrompt[] = similarResults.map(result => ({
    prompt: result.content,
    similarity_score: result.score
  }));
  
  return {
    classification,
    score,
    similar_prompts
  };
}

/**
 * Simulates responses to a prompt by finding semantically similar historical exchanges
 * @param params - The parameters for response simulation
 * @returns Simulated responses based on similar historical exchanges
 */
export async function simulateResponse(params: SimulateResponseInput): Promise<SimulateResponseOutput> {
  const { prompt } = params;
  
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid input: prompt must be a non-empty string');
  }

  let simulated_responses: SimulatedResponse[] = [];
  
  try {
    // Generate embedding for the prompt
    const embedding = await createEmbedding(prompt);
    
    // Find similar prompts with thread_id metadata
    const similarResults = await findSimilarDocuments(
      embedding, 
      50, 
      { 'metadata.thread_id': { $exists: true } }
    );
    
    // Get thread IDs from similar results
    const threadIds = similarResults
      .map(result => result.metadata?.thread_id)
      .filter(Boolean);
    
    // Find assistant responses for those thread IDs
    const responses = await Chat.find({
      role: 'assistant',
      thread_id: { $in: threadIds }
    });
    
    // Match responses with the corresponding prompts
    simulated_responses = responses
      .map(result => {
        const matchingResult = similarResults.find(
          r => r.metadata?.thread_id === result.thread_id
        );
        
        if (!matchingResult) return null;
        
        return {
          prompt: matchingResult.content,
          response: result.content,
          similarity: matchingResult.score
        };
      })
      .filter((item): item is SimulatedResponse => item !== null)
      .sort((a, b) => b.similarity - a.similarity);
      
  } catch (error) {
    console.error('Error in simulateResponse:', error);
    // Return empty array if error occurs
    simulated_responses = [];
  }
  
  return { simulated_responses };
}

/**
 * Performs semantic search for prompts similar to the query
 * @param params - The parameters for vector search
 * @returns Search results with similarity scores
 */
export async function vectorSearch(params: VectorSearchInput): Promise<VectorSearchOutput> {
  const { query, limit = 5 } = params;
  
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid input: query must be a non-empty string');
  }

  try {
    // Generate embedding for the query
    const embedding = await createEmbedding(query);
    
    // Find similar documents
    const similarResults = await findSimilarDocuments(embedding, limit);
    
    // Format results
    const results: SearchResult[] = similarResults.map(result => ({
      content: result.content,
      challenge: result.challenge,
      score: result.score,
      win: result.metadata?.win,
      alcatraz: result.metadata?.alcatraz
    }));
    
    return { results };
  } catch (error) {
    console.error('Error in vectorSearch:', error);
    throw error;
  }
} 