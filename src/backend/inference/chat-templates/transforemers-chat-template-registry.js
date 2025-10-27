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
  //// @returns Formatted prompt string ready for model input
  formatPrompt(prompt, templateType, conversationHistory = []) {
    //// Build complete message array including history and current prompt
    const messages = [...conversationHistory];
    
    //// Add current user prompt if not already in history
    if (!messages.length || messages[messages.length - 1].role !== 'user' || messages[messages.length - 1].content !== prompt) {
      messages.push({ role: 'user', content: prompt });
    }

    //// Get the template function
    const templateFn = this.templates[templateType];
    
    if (!templateFn) {
      console.warn(`Template type '${templateType}' not found, using chatml as fallback`);
      return this.templates.chatml(messages);
    }

    //// Apply the template and return formatted prompt
    return templateFn(messages);
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
