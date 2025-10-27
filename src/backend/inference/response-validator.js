//// src/backend/inference/response-validator.js
//// Response validation and cleaning utilities
//// Ensures only valid, meaningful responses are used in conversation history

export class ResponseValidator {
  //// Validate if a response is meaningful and should be kept
  static isValidResponse(responseText) {
    if (!responseText) return false;
    
    //// Trim whitespace
    const trimmed = responseText.trim();
    
    //// Check if empty
    if (trimmed.length === 0) return false;
    
    //// Check if too short (likely garbage) - but allow single meaningful characters
    if (trimmed.length < 1) return false;
    
    //// Check if response is only template artifacts (shouldn't happen after cleaning, but double-check)
    const templateArtifactRegex = /^[\[\]<>\/|]+$/;
    if (templateArtifactRegex.test(trimmed)) return false;
    
    //// Check for error messages that shouldn't be in conversation history
    const errorMessagePatterns = [
      /^\[Model generated an empty response/i,
      /^\[Model generated an invalid response/i,
      /^\[Unable to generate a valid response/i,
      /^\[Generation stopped by user\]/i,
      /^\[NEVER\]$/i,
      /^\[ERROR\]/i,
      /^\[FAILED\]/i,
    ];
    
    for (const pattern of errorMessagePatterns) {
      if (pattern.test(trimmed)) {
        return false;
      }
    }
    
    //// Check if response contains template format leakage
    //// These shouldn't appear in cleaned responses but let's be extra safe
    const formatLeakagePatterns = [
      /\[INST\]/,
      /\[\/INST\]/,
      /<\/INST>/i,  //// Malformed version without brackets
      /<INST>/i,    //// Malformed version without brackets
      /<<SYS>>/,
      /<\/SYS>/,
      /<\|im_start\|>/,
      /<\|im_end\|>/,
      /<\/ASSISTER>/i,  //// Model-generated malformed tag
      /<ASSISTER>/i,    //// Model-generated malformed tag
      /<\/ASSISTANT>/i, //// Another variant
      /<ASSISTANT>/i,   //// Another variant
      /<\/[A-Z]{3,}>/,  //// Generic: Any closing tag with 3+ capital letters (catches </INST>, </ASSISTER>, etc.)
    ];
    
    for (const pattern of formatLeakagePatterns) {
      if (pattern.test(trimmed)) {
        console.warn('Response contains template format leakage:', trimmed.substring(0, 100));
        return false;
      }
    }
    
    return true;
  }

  //// Clean and validate a response
  //// Returns the cleaned response or null if invalid
  static validateAndClean(responseText) {
    if (!responseText) return null;
    
    const cleaned = responseText.trim();
    
    if (!this.isValidResponse(cleaned)) {
      console.warn('Invalid response detected and filtered out:', cleaned.substring(0, 100));
      return null;
    }
    
    return cleaned;
  }

  //// Filter conversation history to remove invalid messages
  static filterConversationHistory(messages) {
    return messages.filter(msg => {
      //// Keep user messages always
      if (msg.role === 'user') return true;
      
      //// Keep system messages always
      if (msg.role === 'system') return true;
      
      //// Validate assistant messages
      if (msg.role === 'assistant') {
        return this.isValidResponse(msg.content);
      }
      
      return true;
    });
  }

  //// Check if response contains common error patterns
  static hasErrorPatterns(responseText) {
    const errorPatterns = [
      /\[INST\]/i,
      /\[\/INST\]/i,
      /<<SYS>>/i,
      /<\/SYS>/i,
      /^[<|]+$/,  //// Only special tokens
      /^[\s\n]+$/, //// Only whitespace
    ];
    
    for (const pattern of errorPatterns) {
      if (pattern.test(responseText)) {
        return true;
      }
    }
    
    return false;
  }

  //// Get a user-friendly error message for failed generation
  static getFailureMessage(originalResponse) {
    if (!originalResponse || originalResponse.trim().length === 0) {
      return '[Model generated an empty response. Please try again.]';
    }
    
    if (this.hasErrorPatterns(originalResponse)) {
      return '[Model generated an invalid response. Please try again.]';
    }
    
    return '[Unable to generate a valid response. Please try again.]';
  }
}
