//// src/backend/inference/chat-templates/llama-chat-template-registry.js
//// Chat template registry for llama.cpp engine
//// Provides formatting functions for different model chat formats

export class LlamaChatTemplateRegistry {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  //// Initialize all available chat templates
  initializeTemplates() {
    return {
      //// Llama 2 chat format
      llama2: (messages) => {
        let formatted = '<s>';
        for (const msg of messages) {
          if (msg.role === 'system') {
            formatted += `[INST] <<SYS>>\n${msg.content}\n<</SYS>>\n\n`;
          } else if (msg.role === 'user') {
            formatted += `[INST] ${msg.content} [/INST]`;
          } else if (msg.role === 'assistant') {
            formatted += ` ${msg.content}</s><s>`;
          }
        }
        return formatted;
      },

      //// Llama 3 chat format
      llama3: (messages) => {
        let formatted = '<|begin_of_text|>';
        for (const msg of messages) {
          formatted += `<|start_header_id|>${msg.role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
        }
        formatted += '<|start_header_id|>assistant<|end_header_id|>\n\n';
        return formatted;
      },

      //// Mistral/Mixtral chat format
      mistral: (messages) => {
        let formatted = '';
        for (const msg of messages) {
          if (msg.role === 'user') {
            formatted += `[INST] ${msg.content} [/INST]`;
          } else if (msg.role === 'assistant') {
            formatted += ` ${msg.content}</s>`;
          } else if (msg.role === 'system') {
            formatted += `[INST] ${msg.content} [/INST]`;
          }
        }
        return formatted;
      },

      //// ChatML format (OpenHermes, Zephyr, Nous, etc.)
      chatml: (messages) => {
        let formatted = '';
        for (const msg of messages) {
          formatted += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
        }
        formatted += '<|im_start|>assistant\n';
        return formatted;
      },

      //// Alpaca format
      alpaca: (messages) => {
        let formatted = '';
        let instruction = '';
        let input = '';
        
        for (const msg of messages) {
          if (msg.role === 'system') {
            instruction = msg.content;
          } else if (msg.role === 'user') {
            input = msg.content;
          }
        }
        
        if (instruction) {
          formatted = `### Instruction:\n${instruction}\n\n`;
        }
        if (input) {
          formatted += `### Input:\n${input}\n\n`;
        }
        formatted += '### Response:\n';
        return formatted;
      },

      //// Vicuna format
      vicuna: (messages) => {
        let formatted = '';
        for (const msg of messages) {
          if (msg.role === 'system') {
            formatted += `${msg.content}\n\n`;
          } else if (msg.role === 'user') {
            formatted += `USER: ${msg.content}\n`;
          } else if (msg.role === 'assistant') {
            formatted += `ASSISTANT: ${msg.content}\n`;
          }
        }
        formatted += 'ASSISTANT: ';
        return formatted;
      },

      //// Phi format
      phi: (messages) => {
        let formatted = '';
        for (const msg of messages) {
          if (msg.role === 'system') {
            formatted += `<|system|>\n${msg.content}<|end|>\n`;
          } else if (msg.role === 'user') {
            formatted += `<|user|>\n${msg.content}<|end|>\n`;
          } else if (msg.role === 'assistant') {
            formatted += `<|assistant|>\n${msg.content}<|end|>\n`;
          }
        }
        formatted += '<|assistant|>\n';
        return formatted;
      },

      //// Gemma format
      gemma: (messages) => {
        let formatted = '<bos>';
        for (const msg of messages) {
          if (msg.role === 'user') {
            formatted += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
          } else if (msg.role === 'assistant') {
            formatted += `<start_of_turn>model\n${msg.content}<end_of_turn>\n`;
          } else if (msg.role === 'system') {
            formatted += `<start_of_turn>user\n${msg.content}<end_of_turn>\n`;
          }
        }
        formatted += '<start_of_turn>model\n';
        return formatted;
      },

      //// Command-R format
      'command-r': (messages) => {
        let formatted = '<BOS_TOKEN>';
        for (const msg of messages) {
          if (msg.role === 'system') {
            formatted += `<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>${msg.content}<|END_OF_TURN_TOKEN|>`;
          } else if (msg.role === 'user') {
            formatted += `<|START_OF_TURN_TOKEN|><|USER_TOKEN|>${msg.content}<|END_OF_TURN_TOKEN|>`;
          } else if (msg.role === 'assistant') {
            formatted += `<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>${msg.content}<|END_OF_TURN_TOKEN|>`;
          }
        }
        formatted += '<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>';
        return formatted;
      },
    };
  }

  //// Format a prompt using the appropriate template
  //// @param prompt - The user prompt text
  //// @param templateType - The template type to use (e.g., 'llama2', 'mistral')
  //// @param conversationHistory - Array of previous messages [{role, content}]
  //// @returns Object with formatted prompt string and stop sequences
  formatPrompt(prompt, templateType, conversationHistory = []) {
    //// Build complete message array including history and current prompt
    let messages = [...conversationHistory];
    
    //// Only add current prompt if it's not already the last message
    //// Check both content AND that it's a user message
    const lastMsg = messages[messages.length - 1];
    const shouldAddPrompt = !lastMsg || 
                           lastMsg.role !== 'user' || 
                           lastMsg.content.trim() !== prompt.trim();
    
    if (shouldAddPrompt) {
      messages.push({ role: 'user', content: prompt });
    }
    
    //// IMPORTANT: Ensure proper message alternation
    //// Remove consecutive messages with the same role to avoid confusing the model
    const cleanedMessages = [];
    let lastRole = null;
    
    for (const msg of messages) {
      //// Skip if same role as previous message (keep only the last one)
      if (msg.role === lastRole && lastRole === 'user') {
        //// Replace the previous user message with this one
        cleanedMessages.pop();
      }
      cleanedMessages.push(msg);
      lastRole = msg.role;
    }
    
    messages = cleanedMessages;

    //// Get the template function
    const templateFn = this.templates[templateType];
    
    if (!templateFn) {
      console.warn(`Template type '${templateType}' not found, using chatml as fallback`);
      return {
        prompt: this.templates.chatml(messages),
        stopStrings: ['<|im_end|>', '<|im_start|>']
      };
    }

    //// Apply the template and return formatted prompt with stop strings
    const formattedPrompt = templateFn(messages);
    const stopStrings = this.getStopStrings(templateType);
    
    return {
      prompt: formattedPrompt,
      stopStrings: stopStrings
    };
  }

  //// Get appropriate stop strings for each template type
  getStopStrings(templateType) {
    const stopStringsMap = {
      'llama2': ['</s>', '[INST]'],
      'llama3': ['<|eot_id|>', '<|end_of_text|>'],
      'mistral': ['</s>', '[INST]'],
      'chatml': ['<|im_end|>', '<|im_start|>'],
      'alpaca': ['###', '\n\n###'],
      'vicuna': ['USER:', '\n\nUSER:'],
      'phi': ['<|end|>', '<|user|>'],
      'gemma': ['<end_of_turn>', '<start_of_turn>'],
      'command-r': ['<|END_OF_TURN_TOKEN|>']
    };
    
    return stopStringsMap[templateType] || ['<|im_end|>', '<|im_start|>'];
  }

  //// Clean response text by removing any template artifacts
  cleanResponse(responseText, templateType) {
    if (!responseText) return '';
    
    let cleaned = responseText;
    
    //// Remove common template artifacts that might leak through
    const artifactsToRemove = [
      '</s>',
      '<s>',
      '[INST]',
      '[/INST]',
      '<|im_start|>',
      '<|im_end|>',
      '<|eot_id|>',
      '<|end_of_text|>',
      '<|begin_of_text|>',
      '<|end|>',
      '<|user|>',
      '<|assistant|>',
      '<|system|>',
      '<end_of_turn>',
      '<start_of_turn>',
      '<bos>',
      '<eos>',
      'USER:',
      'ASSISTANT:',
      '<BOS_TOKEN>',
      '<|START_OF_TURN_TOKEN|>',
      '<|END_OF_TURN_TOKEN|>',
      '<|USER_TOKEN|>',
      '<|CHATBOT_TOKEN|>',
      '<|SYSTEM_TOKEN|>'
    ];
    
    //// Remove artifacts from the response (case-insensitive for some common variations)
    for (const artifact of artifactsToRemove) {
      //// Split and join to remove all occurrences
      cleaned = cleaned.split(artifact).join('');
    }
    
    //// Also try to catch any remaining template-like patterns with regex
    //// This catches variations like [INST], [/INST], </INST>, etc. that might have different spacing or formatting
    cleaned = cleaned.replace(/\[INST\]/gi, '');
    cleaned = cleaned.replace(/\[\/INST\]/gi, '');
    cleaned = cleaned.replace(/<\/INST>/gi, '');  //// Handle malformed </INST> without brackets
    cleaned = cleaned.replace(/<INST>/gi, '');     //// Handle malformed <INST> without brackets
    cleaned = cleaned.replace(/\s*<\/INST>\s*/gi, '');  //// With surrounding whitespace
    cleaned = cleaned.replace(/<\|im_start\|>/gi, '');
    cleaned = cleaned.replace(/<\|im_end\|>/gi, '');
    
    //// Remove common chat template patterns that might leak through
    cleaned = cleaned.replace(/<<SYS>>/gi, '');
    cleaned = cleaned.replace(/<\/SYS>/gi, '');
    
    //// CRITICAL: Remove ANY malformed closing tags that models might generate
    //// Pattern: </ANYTHING> where ANYTHING is all caps (like </ASSISTER>, </ASSISTANT>, </INST>, etc.)
    cleaned = cleaned.replace(/<\/[A-Z]+>/gi, '');
    //// Also remove opening tags of similar pattern
    cleaned = cleaned.replace(/<[A-Z]+>/gi, '');
    
    //// Remove specific known malformed artifacts
    cleaned = cleaned.replace(/<\/ASSISTER>/gi, '');
    cleaned = cleaned.replace(/<ASSISTER>/gi, '');
    cleaned = cleaned.replace(/<\/ASSISTANT>/gi, '');
    cleaned = cleaned.replace(/<ASSISTANT>/gi, '');
    
    //// Remove any lines that are only template artifacts or whitespace
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim();
      //// Keep lines that have actual content (not just template remnants)
      if (trimmedLine.length === 0) return false;
      if (/^[\[\]<>\/|]+$/.test(trimmedLine)) return false;
      //// Filter lines that are just template artifacts
      if (/^<\/?INST>$/i.test(trimmedLine)) return false;
      if (/^\[?\/?INST\]?$/i.test(trimmedLine)) return false;
      //// Filter lines that are malformed closing tags
      if (/^<\/[A-Z]+>$/i.test(trimmedLine)) return false;
      if (/^<[A-Z]+>$/i.test(trimmedLine)) return false;
      return true;
    });
    
    cleaned = filteredLines.join('\n');
    
    //// Clean up excessive whitespace
    cleaned = cleaned.trim();
    
    //// Remove multiple consecutive spaces
    cleaned = cleaned.replace(/  +/g, ' ');
    
    //// Remove excessive newlines (more than 2 consecutive)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }

  //// Get list of all available template types
  getAvailableTemplates() {
    return Object.keys(this.templates);
  }

  //// Check if a template type exists
  hasTemplate(templateType) {
    return templateType in this.templates;
  }
}

////=============================================================================
//// MANUAL TEMPLATE ADDITION SECTION
//// Add new templates below this line
//// Follow the existing pattern:
////
//// templateName: (messages) => {
////   let formatted = '';
////   for (const msg of messages) {
////     if (msg.role === 'system') {
////       formatted += `your system format here`;
////     } else if (msg.role === 'user') {
////       formatted += `your user format here`;
////     } else if (msg.role === 'assistant') {
////       formatted += `your assistant format here`;
////     }
////   }
////   return formatted;
//// },
////
//// Then update the initializeTemplates() method to include your new template
////=============================================================================
