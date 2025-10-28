// Centralized Template Registry - Unified template mapping for all engines
// Automatically loads all JSON templates and provides helper functions

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TemplateRegistry {
  constructor() {
    this.templates = new Map(); // Map<templateName, templateObject>
    this.engineTemplates = new Map(); // Map<engineType, Set<templateName>>
    this.loaded = false;
  }

  // Load all templates from both llama-cpp and transformers directories
  async loadAll() {
    if (this.loaded) return;

    this.engineTemplates.set('llama-cpp', new Set());
    this.engineTemplates.set('transformers', new Set());

    // Load llama-cpp templates
    await this._loadFromDirectory('llama-cpp');
    
    // Load transformers templates
    await this._loadFromDirectory('transformers');

    this.loaded = true;
    console.log(`[TemplateRegistry] Loaded ${this.templates.size} templates total`);
  }

  // Load templates from a specific engine directory
  async _loadFromDirectory(engineType) {
    const dirPath = path.join(__dirname, engineType);
    
    try {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const template = JSON.parse(content);
        
        if (template.engine !== engineType) {
          console.warn(`[TemplateRegistry] Skipping ${file} in ${engineType}/ - wrong engine: ${template.engine}`);
          continue;
        }
        
        // Store template with engine-prefixed key for uniqueness
        const key = `${engineType}:${template.name}`;
        this.templates.set(key, template);
        this.engineTemplates.get(engineType).add(template.name);
        
        console.log(`[TemplateRegistry] Loaded ${engineType}/${template.name}`);
      }
    } catch (err) {
      console.error(`[TemplateRegistry] Failed to load from ${engineType}/:`, err);
    }
  }

  // Get template for a specific model and engine type
  getTemplateForModel(modelName, engineType) {
    if (!this.loaded) {
      throw new Error('Templates not loaded. Call loadAll() first.');
    }

    const nameLower = modelName.toLowerCase();
    const engineTemplates = this.engineTemplates.get(engineType);
    
    if (!engineTemplates) {
      console.warn(`[TemplateRegistry] Unknown engine type: ${engineType}`);
      return null;
    }

    let bestMatch = null;
    let highestPriority = -1;

    // Search through templates for this engine
    for (const templateName of engineTemplates) {
      const key = `${engineType}:${templateName}`;
      const template = this.templates.get(key);
      
      if (!template) continue;

      // Check all patterns
      for (const patternStr of template.patterns) {
        const pattern = new RegExp(patternStr, 'i');
        if (pattern.test(nameLower)) {
          if (template.priority > highestPriority) {
            bestMatch = template;
            highestPriority = template.priority;
          }
        }
      }
    }

    if (bestMatch) {
      console.log(`[TemplateRegistry] Matched "${modelName}" → ${bestMatch.name} (${engineType})`);
    }

    return bestMatch;
  }

  // Get template by name and engine
  getTemplate(templateName, engineType) {
    if (!this.loaded) {
      throw new Error('Templates not loaded. Call loadAll() first.');
    }

    const key = `${engineType}:${templateName}`;
    const template = this.templates.get(key);
    
    if (!template) {
      console.warn(`[TemplateRegistry] Template "${templateName}" not found for engine ${engineType}`);
    }
    
    return template;
  }

  // Get default fallback template (chatml)
  getDefaultTemplate(engineType) {
    return this.getTemplate('chatml', engineType);
  }

  // List all templates for an engine
  listTemplates(engineType) {
    if (!this.loaded) {
      throw new Error('Templates not loaded. Call loadAll() first.');
    }

    return Array.from(this.engineTemplates.get(engineType) || []);
  }
}

// Singleton instance
export const templateRegistry = new TemplateRegistry();

// Helper function: get template for model with fallback chain
// 1. Try registry match
// 2. Fallback to universal-template-system
// 3. Final fallback to chatml
export async function getTemplateForModel(modelName, engineType) {
  // Ensure registry is loaded
  if (!templateRegistry.loaded) {
    await templateRegistry.loadAll();
  }

  // Try registry first
  const registryMatch = templateRegistry.getTemplateForModel(modelName, engineType);
  if (registryMatch) {
    return {
      source: 'registry',
      template: registryMatch
    };
  }

  // Fallback to universal template system
  try {
    const { universalTemplateSystem } = await import('../universal-template-system.js');
    const universalMatch = universalTemplateSystem.detectModelFamily(modelName);
    
    if (universalMatch && universalMatch !== 'unknown') {
      console.log(`[getTemplateForModel] Using universal-template-system: ${universalMatch}`);
      return {
        source: 'universal-system',
        familyName: universalMatch,
        template: universalTemplateSystem.getTemplate(universalMatch)
      };
    }
  } catch (err) {
    console.warn('[getTemplateForModel] Universal template system unavailable:', err.message);
  }

  // Final fallback to chatml
  console.log(`[getTemplateForModel] No match for "${modelName}", using chatml fallback`);
  const chatMLFallback = templateRegistry.getDefaultTemplate(engineType);
  
  return {
    source: 'fallback',
    template: chatMLFallback || { name: 'chatml', stopTokens: ['<|im_end|>'] }
  };
}
