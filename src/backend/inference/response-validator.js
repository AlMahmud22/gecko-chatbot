// Response Validation Utilities

import { ResponseSanitizer } from './universal-template-system.js';

export class ResponseValidator {
  /**
   * Validate if a response is meaningful and should be kept
   */
  static isValidResponse(responseText) {
    return ResponseSanitizer.validate(responseText);
  }

  /**
   * Clean and validate a response
   * Returns the cleaned response or null if invalid
   */
  static validateAndClean(responseText) {
    if (!responseText) return null;
    
    const cleaned = responseText.trim();
    
    if (!this.isValidResponse(cleaned)) {
      console.warn('[Validator] Invalid response detected:', cleaned.substring(0, 100));
      return null;
    }
    
    return cleaned;
  }

  /**
   * Filter conversation history to remove invalid messages
   * Delegates to UniversalTemplateSystem for consistency
   */
  static filterConversationHistory(messages) {
    return messages.filter(msg => {
      // Always keep user and system messages
      if (msg.role === 'user' || msg.role === 'system') return true;
      
      // Validate assistant messages
      if (msg.role === 'assistant') {
        return this.isValidResponse(msg.content);
      }
      
      return true;
    });
  }

  /**
   * Check if response contains common error patterns
   */
  static hasErrorPatterns(responseText) {
    const errorPatterns = [
      /^\[Model generated/i,
      /^\[Generation stopped/i,
      /^\[NEVER\]$/i,
      /^\[ERROR\]/i,
      /^\[FAILED\]/i,
      /\[INST\]/i,
      /\[\/INST\]/i,
      /<\/INST>/i,
      /<<SYS>>/i,
      /<\/SYS>/i,
      /<\|im_start\|>/i,
      /<\|im_end\|>/i,
      /<\/[A-Z]{3,}>/,  // Malformed tags
    ];
    
    for (const pattern of errorPatterns) {
      if (pattern.test(responseText)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get a user-friendly error message for failed generation
   */
  static getFailureMessage(originalResponse) {
    if (!originalResponse || originalResponse.trim().length === 0) {
      return '[Model generated an empty response. Please try again or use a different model.]';
    }
    
    if (this.hasErrorPatterns(originalResponse)) {
      return '[Model generated an invalid response with template artifacts. Please try again.]';
    }
    
    return '[Unable to generate a valid response. Please try again or adjust generation parameters.]';
  }

  /**
   * Validate a complete conversation history
   * Returns statistics about the validation
   */
  static validateConversationHistory(messages) {
    let total = messages.length;
    let valid = 0;
    let invalid = 0;
    let filtered = [];

    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'system') {
        valid++;
        filtered.push(msg);
      } else if (msg.role === 'assistant') {
        if (this.isValidResponse(msg.content)) {
          valid++;
          filtered.push(msg);
        } else {
          invalid++;
        }
      }
    }

    return {
      total,
      valid,
      invalid,
      filtered,
      stats: {
        validPercentage: total > 0 ? (valid / total * 100).toFixed(1) : 0,
        invalidPercentage: total > 0 ? (invalid / total * 100).toFixed(1) : 0
      }
    };
  }
}
