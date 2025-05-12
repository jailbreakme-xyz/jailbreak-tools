import { EmbeddedChat } from '../models/EmbeddedChat.js';
import { EmbeddingVector } from '../types/index.js';
import { calculateCosineSimilarity } from './embedding.service.js';

/**
 * Interface for filter options used in vector search
 */
interface VectorSearchFilters {
  'metadata.thread_id'?: any;
  'metadata.win'?: boolean;
  'metadata.alcatraz'?: boolean;
  challenge?: string;
}

/**
 * Find documents similar to the embedding using vector search
 * @param embedding - The embedding vector to find similar documents for
 * @param limit - Maximum number of results to return
 * @param filters - Optional MongoDB filters to apply
 * @returns Array of similar documents with metadata
 */
export async function findSimilarDocuments(
  embedding: EmbeddingVector, 
  limit = 3, 
  filters: VectorSearchFilters = {}
): Promise<any[]> {
  try {
    // Construct MongoDB aggregation pipeline
    const pipeline = [];
    
    // Vector search stage - finds similar documents by vector similarity
    const vectorSearchStage = {
      $vectorSearch: {
        index: 'vector_index',
        queryVector: embedding,
        path: 'embedding',
        numCandidates: Math.max(100, limit * 3),
        limit: limit,
      },
    };
    
    pipeline.push(vectorSearchStage);
    
    // Match stage - applies additional filters
    if (Object.keys(filters).length > 0) {
      pipeline.push({
        $match: filters,
      });
    }
    
    // Project stage - shapes the output
    pipeline.push({
      $project: {
        _id: 1,
        content: 1,
        challenge: 1,
        address: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    });
    
    // Execute the aggregation
    const results = await EmbeddedChat.aggregate(pipeline as any);
    return results;
  } catch (error) {
    if (error instanceof Error) {
      // If vector search fails due to MongoDB Atlas limitations,
      // we can fall back to a manual approach
      if (error.message.includes('PlanExecutor error')) {
        return findSimilarDocumentsManually(embedding, limit, filters);
      }
      console.error(`❌ Vector search error: ${error.message}`);
    } else {
      console.error('❌ Unknown vector search error');
    }
    throw error;
  }
}

/**
 * Fallback method for finding similar documents when vector search is unavailable
 * @param embedding - The embedding vector to find similar documents for
 * @param limit - Maximum number of results to return
 * @param filters - Optional MongoDB filters to apply
 * @returns Array of similar documents with metadata
 */
async function findSimilarDocumentsManually(
  embedding: EmbeddingVector, 
  limit = 3, 
  filters: VectorSearchFilters = {}
): Promise<any[]> {
  // Query for documents matching filters
  const documents = await EmbeddedChat.find(filters).limit(1000);
  
  // Calculate similarity scores
  const scoredDocuments = documents.map(doc => {
    const similarity = calculateCosineSimilarity(embedding, doc.embedding);
    return {
      _id: doc._id,
      content: doc.content,
      challenge: doc.challenge,
      address: doc.address,
      metadata: doc.metadata,
      score: similarity,
    };
  });
  
  // Sort by similarity and limit results
  return scoredDocuments
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
} 