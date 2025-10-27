// Template loader for llama.cpp engine (GGUF models)
// Loads file-based templates from chat-templates/llama-cpp/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ResponseSanitizer } from '../universal-template-system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, 'llama-cpp');

export class LlamaCppTemplateLoader {
  constructor() {
    this.templates = new Map();
    this.patternCache = null;
    this.loaded = false;
  }

  // Load all templates from llama-cpp directory
  async loadTemplates() {
    if (this.loaded) return;

    try {
      const files = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(TEMPLATE_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const template = JSON.parse(content);
        
        if (template.engine !== 'llama-cpp') {
          console.warn(`[LlamaCppTemplateLoader] Skipping ${file} - wrong engine: ${template.engine}`);
          continue;
        }
        
        this.templates.set(template.name, template);
        console.log(`[LlamaCppTemplateLoader] Loaded template: ${template.name}`);
      }
      
      this.loaded = true;
      console.log(`[LlamaCppTemplateLoader] Loaded ${this.templates.size} templates`);
    } catch (err) {
      console.error('[LlamaCppTemplateLoader] Failed to load templates:', err);
      throw err;
    }
  }

  // Detect model family from filename using template patterns
  detectModelFamily(modelName) {
    if (!this.loaded) {
      throw new Error('Templates not loaded. Call loadTemplates() first.');
    }

    const nameLower = modelName.toLowerCase();
    let bestMatch = null;
    let highestPriority = -1;

    for (const [name, template] of this.templates) {
      for (const patternStr of template.patterns) {
        const pattern = new RegExp(patternStr, 'i');
        if (pattern.test(nameLower)) {
          if (template.priority > highestPriority) {
            bestMatch = name;
            highestPriority = template.priority;
          }
        }
      }
    }

    // Default to chatml if no match
    if (!bestMatch) {
      console.warn(`[LlamaCppTemplateLoader] No match for "${modelName}", using chatml`);
      return 'chatml';
    }

    console.log(`[LlamaCppTemplateLoader] Detected "${modelName}" → ${bestMatch}`);
    return bestMatch;
  }

  // Get template configuration
  getTemplate(templateName) {
    if (!this.loaded) {
      throw new Error('Templates not loaded. Call loadTemplates() first.');
    }

    const template = this.templates.get(templateName);
    if (!template) {
      console.warn(`[LlamaCppTemplateLoader] Template "${templateName}" not found, using chatml`);
      return this.templates.get('chatml');
    }

    return template;
  }

  // Format messages using template
  formatPrompt(messages, templateName) {
    const template = this.getTemplate(templateName);
    const tpl = template.template;
    let formatted = tpl.prefix || '';

    // Handle special formatting cases
    if (tpl.specialHandling === 'system_first_user_merge') {
      // Llama 2 style: merge system into first user message
      let systemMsg = null;
      const otherMsgs = [];

      for (const msg of messages) {
        if (msg.role === 'system' && !systemMsg) {
          systemMsg = msg;
        } else {
          otherMsgs.push(msg);
        }
      }

      if (systemMsg && otherMsgs.length > 0 && otherMsgs[0].role === 'user') {
        formatted += tpl.systemMessage.replace('{{content}}', systemMsg.content);
        formatted += otherMsgs[0].content + ' [/INST]';
        
        for (let i = 1; i < otherMsgs.length; i++) {
          formatted += this.formatMessage(otherMsgs[i], tpl);
        }
      } else {
        for (const msg of messages) {
          formatted += this.formatMessage(msg, tpl);
        }
      }
    } else if (tpl.specialHandling === 'alpaca_format') {
      // Alpaca: collect system as instruction, users as input
      let instruction = '';
      let input = '';

      for (const msg of messages) {
        if (msg.role === 'system') {
          instruction = msg.content;
        } else if (msg.role === 'user') {
          input += (input ? '\n' : '') + msg.content;
        }
      }

      if (instruction && tpl.systemMessage) {
        formatted += tpl.systemMessage.replace('{{content}}', instruction);
      }
      if (input && tpl.userMessage) {
        formatted += tpl.userMessage.replace('{{content}}', input);
      }
    } else {
      // Standard message-by-message formatting
      for (const msg of messages) {
        formatted += this.formatMessage(msg, tpl);
      }
    }

    formatted += tpl.suffix || '';
    
    return {
      prompt: formatted,
      stopTokens: template.stopTokens
    };
  }

  // Format a single message
  formatMessage(msg, tpl) {
    const role = msg.role;
    let formatted = '';

    if (role === 'system' && tpl.systemMessage) {
      formatted = tpl.systemMessage.replace('{{content}}', msg.content);
    } else if (role === 'user' && tpl.userMessage) {
      formatted = tpl.userMessage.replace('{{content}}', msg.content);
    } else if (role === 'assistant' && tpl.assistantMessage) {
      formatted = tpl.assistantMessage.replace('{{content}}', msg.content);
    } else if (tpl.message) {
      // Generic message format with role placeholder
      formatted = tpl.message
        .replace('{{role}}', role)
        .replace('{{content}}', msg.content);
    }

    return formatted;
  }

  // Process response (sanitize artifacts)
  processResponse(rawResponse, templateName) {
    const template = this.getTemplate(templateName);
    const sanitized = ResponseSanitizer.sanitize(rawResponse, templateName);
    const valid = ResponseSanitizer.validate(sanitized);

    return {
      text: sanitized,
      valid: valid,
      original: rawResponse
    };
  }

  // Clean message history
  cleanMessageHistory(messages) {
    const cleaned = [];
    let lastRole = null;

    for (const msg of messages) {
      // Skip consecutive same-role messages (keep last)
      if (msg.role === lastRole && lastRole === 'user') {
        cleaned.pop();
      }

      if (msg.content && msg.content.trim().length > 0) {
        cleaned.push({
          role: msg.role,
          content: msg.content.trim()
        });
        lastRole = msg.role;
      }
    }

    return cleaned;
  }

  // Filter conversation history
  filterConversationHistory(messages) {
    return messages.filter(msg => {
      if (msg.role === 'user' || msg.role === 'system') return true;
      if (msg.role === 'assistant') {
        return ResponseSanitizer.validate(msg.content);
      }
      return true;
    });
  }

  // Get all available template names
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }
}

// Export singleton instance
export const llamaCppTemplateLoader = new LlamaCppTemplateLoader();
