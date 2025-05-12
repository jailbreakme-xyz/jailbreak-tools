import mongoose from 'mongoose';
import { ChatDocument } from '../types/index.js';

// Define the schema
const chatSchema = new mongoose.Schema<ChatDocument>(
  {
    challenge: {
      type: String,
      ref: 'Challenge',
      required: true,
    },
    model: String,
    role: { 
      type: String, 
      required: true,
      enum: ['user', 'assistant', 'system']
    },
    content: { 
      type: String, 
      required: true 
    },
    tool_calls: Object,
    address: { 
      type: String, 
      required: true 
    },
    txn: String,
    fee: Number,
    thread_id: String,
    win: Boolean,
    alcatraz: Boolean,
    date: { 
      type: Date, 
      default: Date.now 
    },
  },
  {
    collection: process.env.NODE_ENV === 'development' ? 'chats_test' : 'chats',
  }
);

// Create and export the model
export const Chat = mongoose.model<ChatDocument>('Chat', chatSchema); 