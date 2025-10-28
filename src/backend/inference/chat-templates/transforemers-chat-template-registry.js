//// src/backend/inference/chat-templates/transformers-chat-template-registry.js
//// Chat template registry for transformers.js engine
//// Provides formatting functions for different model chat formats

export class TransformersChatTemplateRegistry {
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

      //// GPT-2 / Generic transformer format
      gpt2: (messages) => {
        let formatted = '';
        for (const msg of messages) {
          if (msg.role === 'system') {
            formatted += `${msg.content}\n\n`;
          } else if (msg.role === 'user') {
            formatted += `Human: ${msg.content}\n\n`;
          } else if (msg.role === 'assistant') {
            formatted += `Assistant: ${msg.content}\n\n`;
          }
        }
        formatted += 'Assistant: ';
        return formatted;
      },

      //// T5 format (for encoder-decoder models)
      t5: (messages) => {
        //// T5 expects a single input string
        let formatted = '';
        for (const msg of messages) {
          if (msg.role === 'user' || msg.role === 'system') {
            formatted += msg.content + ' ';
          }
        }
        return formatted.trim();
      },

      //// BART format (similar to T5)
      bart: (messages) => {
        let formatted = '';
        for (const msg of messages) {
          if (msg.role === 'user' || msg.role === 'system') {
            formatted += msg.content + ' ';
          }
        }
        return formatted.trim();
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
    const messages = [...conversationHistory];
    
    //// Only add current prompt if it's not already the last message
    //// Check both content AND that it's a user message
    const lastMsg = messages[messages.length - 1];
    const shouldAddPrompt = !lastMsg || 
                           lastMsg.role !== 'user' || 
                           lastMsg.content.trim() !== prompt.trim();
    
    if (shouldAddPrompt) {
      messages.push({ role: 'user', content: prompt });
    }

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
      'command-r': ['<|END_OF_TURN_TOKEN|>'],
      'gpt2': ['\n\nHuman:', 'Human:'],
      't5': [],
      'bart': []
    };
    
    return stopStringsMap[templateType] || ['<|im_end|>', '<|im_start|>'];
  }

  //// Clean response text by removing any template artifacts
  cleanResponse(responseText, templateType) {
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
    
    //// Remove artifacts from the response
    for (const artifact of artifactsToRemove) {
      cleaned = cleaned.split(artifact).join('');
    }
    
    //// Clean up excessive whitespace
    cleaned = cleaned.trim();
    
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

// Manual Template Addition Section
// Add new templates below following the existing pattern
////       formatted += `your assistant format here`;
////     }
////   }
////   return formatted;
//// },
////
//// Then update the initializeTemplates() method to include your new template
////=============================================================================
