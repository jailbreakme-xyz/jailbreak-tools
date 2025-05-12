import { Request, Response } from 'express';
import { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  ErrorCode 
} from '../types/index.js';
import * as toolsService from '../services/tools.service.js';

/**
 * Creates a JSON-RPC 2.0 response object
 * @param id - The request ID
 * @param result - The result to include in the response (if no error)
 * @param error - The error to include in the response (if any)
 * @returns A formatted JSON-RPC 2.0 response
 */
function createResponse(id: string | number | null, result: any = null, error: any = null): JsonRpcResponse {
  if (error) {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  } else {
    return {
      jsonrpc: '2.0',
      id: id as string | number, // id is never null in success responses
      result
    };
  }
}

/**
 * Handles JSON-RPC 2.0 requests for the MCP server
 * @param req - Express request object
 * @param res - Express response object
 */
export async function handleJsonRpcRequest(req: Request, res: Response): Promise<void> {
  const rpcRequest = req.body as JsonRpcRequest;
  
  // Validate JSON-RPC 2.0 format
  if (rpcRequest.jsonrpc !== '2.0') {
    res.json(createResponse(rpcRequest.id || null, null, {
      code: ErrorCode.INVALID_REQUEST,
      message: 'Invalid JSON-RPC 2.0 request'
    }));
    return;
  }
  
  try {
    const { method, params, id } = rpcRequest;
    let result;
    
    switch (method) {
      case 'detectJailbreak':
        if (!params?.prompt) {
          throw {
            code: ErrorCode.INVALID_PARAMS,
            message: 'Missing required parameter: prompt'
          };
        }
        result = await toolsService.detectJailbreak({ prompt: params.prompt });
        break;
      
      case 'simulateResponse':
        if (!params?.prompt) {
          throw {
            code: ErrorCode.INVALID_PARAMS,
            message: 'Missing required parameter: prompt'
          };
        }
        result = await toolsService.simulateResponse({ prompt: params.prompt });
        break;
      
      case 'vectorSearch':
        if (!params?.query) {
          throw {
            code: ErrorCode.INVALID_PARAMS,
            message: 'Missing required parameter: query'
          };
        }
        result = await toolsService.vectorSearch({ 
          query: params.query,
          limit: params.limit
        });
        break;
      
      default:
        throw {
          code: ErrorCode.METHOD_NOT_FOUND,
          message: `Method not found: ${method}`
        };
    }
    
    res.json(createResponse(id, result));
    
  } catch (error: any) {
    // Handle errors with proper error codes
    if (error.code) {
      // Error already has a code (JSON-RPC error)
      res.json(createResponse(rpcRequest.id, null, error));
    } else {
      // Internal server error
      console.error('Internal server error:', error);
      res.json(createResponse(rpcRequest.id, null, {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message || 'Internal server error'
      }));
    }
  }
} 