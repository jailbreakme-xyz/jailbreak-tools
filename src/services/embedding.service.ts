import { OpenAI } from 'openai';
import { env } from '../config/env.js';
import { EmbeddingVector } from '../types/index.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Model to use for embeddings
const EMBEDDING_MODEL = 'text-embedding-3-large';

/**
 * Creates embedding vector for a text input using OpenAI's API
 * @param text - The text to generate an embedding for
 * @returns The embedding vector
 * @throws Error if the embedding creation fails
 */
export async function createEmbedding(text: string): Promise<EmbeddingVector> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error creating embedding: ${error.message}`);
    } else {
      console.error('❌ Unknown error creating embedding');
    }
    throw error;
  }
}

/**
 * Creates embeddings for multiple texts using OpenAI's API
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embedding vectors
 * @throws Error if the embedding creation fails
 */
export async function createEmbeddings(texts: string[]): Promise<EmbeddingVector[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: 1536,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error creating embeddings: ${error.message}`);
    } else {
      console.error('❌ Unknown error creating embeddings');
    }
    throw error;
  }
}

/**
 * Calculate the cosine similarity between two vectors
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Cosine similarity score between 0 and 1
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  // Calculate dot product
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  
  // Calculate magnitudes
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  
  // Return cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
} 