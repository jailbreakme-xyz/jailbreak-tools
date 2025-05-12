import mongoose from 'mongoose';
import { EmbeddedChatDocument } from '../types/index.js';

// Define the schema
const embeddedChatSchema = new mongoose.Schema<EmbeddedChatDocument>(
  {
    original_chat_id: {
      type: String,
      ref: 'Chat',
      required: true,
    },
    challenge: {
      type: String,
      ref: 'Challenge',
      required: true,
    },
    content: { 
      type: String, 
      required: true 
    },
    embedding: {
      type: [Number],
      required: true,
    },
    address: { 
      type: String, 
      required: true 
    },
    metadata: {
      model: String,
      thread_id: String,
      win: Boolean,
      alcatraz: Boolean,
      date: Date
    },
    created_at: { 
      type: Date, 
      default: Date.now 
    }
  },
  {
    collection: process.env.NODE_ENV === 'development' ? 'embedded_chats_test' : 'embedded_chats',
  }
);

// Create text index on content for basic text search functionality
embeddedChatSchema.index({ content: 'text' });

// Create an index on the embedding field for vector search
embeddedChatSchema.index({ embedding: 1 });

// Create a unique index on original_chat_id to prevent duplicates
embeddedChatSchema.index({ original_chat_id: 1 }, { unique: true });

// Create and export the model
export const EmbeddedChat = mongoose.model<EmbeddedChatDocument>('EmbeddedChat', embeddedChatSchema); 