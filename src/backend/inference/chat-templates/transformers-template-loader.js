// Template loader for transformers engine (HuggingFace models)
// Loads file-based templates from chat-templates/transformers/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, 'transformers');

// Artifact patterns for transformers models
const ARTIFACT_PATTERNS = [
  /<\|begin_of_text\|>/gi,
  /<\|end_of_text\|>/gi,
  /<\|eot_id\|>/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<s>/gi,
  /<\/s>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<\/SYS>/gi,
  /<\|end\|>/gi,
  /<end_of_turn>/gi,
  /<start_of_turn>/gi,
  /<bos>/gi,
  /^USER:\s*/gim,
  /^ASSISTANT:\s*/gim,
  /^Human:\s*/gim,
  /^Assistant:\s*/gim,
  /<\/?[A-Z]{3,}>/gi,
];

export class TransformersTemplateLoader {
  constructor() {
    this.templates = new Map();
    this.loaded = false;
  }

  // Load all templates from transformers directory
  async loadTemplates() {
    if (this.loaded) return;

    try {
      const files = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(TEMPLATE_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const template = JSON.parse(content);
        
        if (template.engine !== 'transformers') {
          console.warn(`[TransformersTemplateLoader] Skipping ${file} - wrong engine: ${template.engine}`);
          continue;
        }
        
        this.templates.set(template.name, template);
        console.log(`[TransformersTemplateLoader] Loaded template: ${template.name}`);
      }
      
      this.loaded = true;
      console.log(`[TransformersTemplateLoader] Loaded ${this.templates.size} templates`);
    } catch (err) {
      console.error('[TransformersTemplateLoader] Failed to load templates:', err);
      throw err;
    }
  }

  // Detect model family from filename
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

    // Default to chatml for transformers
    if (!bestMatch) {
      console.warn(`[TransformersTemplateLoader] No match for "${modelName}", using chatml`);
      return 'chatml';
    }

    console.log(`[TransformersTemplateLoader] Detected "${modelName}" → ${bestMatch}`);
    return bestMatch;
  }

  // Get template configuration
  getTemplate(templateName) {
    if (!this.loaded) {
      throw new Error('Templates not loaded. Call loadTemplates() first.');
    }

    const template = this.templates.get(templateName);
    if (!template) {
      console.warn(`[TransformersTemplateLoader] Template "${templateName}" not found, using chatml`);
      return this.templates.get('chatml') || this.templates.get('gpt2');
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
      // Llama 2 style
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
    } else if (tpl.specialHandling === 't5_concatenate' || tpl.specialHandling === 'bart_concatenate') {
      // T5/BART: concatenate user and system messages only
      for (const msg of messages) {
        if (msg.role === 'user' || msg.role === 'system') {
          formatted += msg.content + ' ';
        }
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

  // Clean response from artifacts
  cleanResponse(text) {
    if (!text) return '';
    
    let cleaned = text;
    
    for (const pattern of ARTIFACT_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Remove lines with only artifacts
    const lines = cleaned.split('\n');
    const validLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^[\[\]<>\/|#]+$/.test(trimmed)) return false;
      return true;
    });
    
    cleaned = validLines.join('\n');
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/  +/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }

  // Validate response
  isValidResponse(text) {
    if (!text || text.trim().length === 0) return false;
    
    const errorPatterns = [
      /^\[Model generated/i,
      /^\[Generation stopped/i,
      /\[INST\]/,
      /\[\/INST\]/,
      /<\|im_start\|>/,
      /<\|im_end\|>/,
    ];
    
    for (const pattern of errorPatterns) {
      if (pattern.test(text)) return false;
    }
    
    return true;
  }

  // Filter conversation history
  filterConversationHistory(messages) {
    return messages.filter(msg => {
      if (msg.role === 'user' || msg.role === 'system') return true;
      if (msg.role === 'assistant') {
        return this.isValidResponse(msg.content);
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
export const transformersTemplateLoader = new TransformersTemplateLoader();
