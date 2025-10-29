# 🦎 Gecko Chatbot



Gecko Chatbot is a local AI chatbot built with Electron, React, and llama.cpp.

It runs completely offline — no servers, no tracking, just a clean desktop app that lets you chat with your own models.

Gecko Chatbot is a local AI chatbot built with Electron, React, and llama.cpp.Gecko Chatbot is a local AI chatbot built with Electron, React, and llama.cpp.

## What It Does

It runs completely offline — no servers, no tracking, just a clean desktop app that lets you chat with your own models.It runs completely offline — no servers, no tracking, just a clean desktop app that lets you chat with your own models.

1. Runs local LLMs (like GGUF models via llama.cpp or Transformers.js) 
Fix: Transformer.js models integration still not added so only GGUF and GGML models.

2. Works 100% offline

3. Lets you switch between models easily

4. Keeps chat history locally## What It Does🧠 What It Does

5. Lets you tweak settings like temperature, max tokens, and presets



Basically, it's a private, simple, customizable AI assistant that lives on your computer.

1. Runs local LLMs (like GGUF models via llama.cpp or Transformers.js)Runs local LLMs (like GGUF models via llama.cpp or Transformers.js)

## How to Run It

2. Works 100% offline

### Requirements

3. Lets you switch between models easilyWorks 100% offline

1. Node.js 18 or newer

2. npm or yarn4. Keeps chat history locally

3. Around 8GB RAM for smooth model inference but depends on the model completely

5. Lets you tweak settings like temperature, max tokens, and presetsLets you switch between models easily

### Setup



```bash

git clone https://github.com/AlMahmud22/gecko-chatbot.gitBasically, it's a private, simple, customizable AI assistant that lives on your computer.Keeps chat history locally

cd gecko-chatbot

npm install

npm run dev

```## How to Run ItLets you tweak settings like temperature, max tokens, and presets



### Build for Production



If you want to make a desktop app build:### RequirementsBasically, it’s a private, simple, customizable AI assistant that lives on your computer.



```bash

npm run build

npm run dist:win   # for Windows. Node.js 18 or newer⚙️ How to Run It

npm run dist:mac   # for macOS

npm run dist:linux # for Linux2. npm or yarnRequirements

```

3. Around 8GB RAM for smooth model inference but depends on the model completely

This will create the packaged app inside the dist/ folder.

Node.js 18 or newer

## Deployment

### Setup

If you want to share the installer:

npm or yarn

1. Upload the .exe, .AppImage, or .dmg from the dist/ folder

2. You can host it on GitHub Releases, FileHippo, or anywhere you like```bash



That's all you need to make it downloadable.git clone https://github.com/AlMahmud22/gecko-chatbot.gitAround 8GB RAM for smooth model inference but depends on the model completely. 



## Tech Usedcd gecko-chatbot



1. Electron for the desktop appnpm installSetup

2. React + Vite for the UI

3. node-llama-cpp and Transformers.js for AI model handlingnpm run devgit clone https://github.com/AlMahmud22/gecko-chatbot.git

4. Tailwind CSS for basic styling

5. Zustand for state management```cd gecko-chatbot

6. Electron Store for local data

npm install

## Folder Overview

### Build for Productionnpm run dev

```

gecko-chatbot/

├── public/        # images, icons

├── src/           # frontend + backendIf you want to make a desktop app build:Build for Production

│   ├── components/

│   ├── pages/

│   ├── backend/

│   └── utils/```bashIf you want to make a desktop app build:

├── main.js

├── preload.jsnpm run build

├── package.json

└── DEPLOYMENT.mdnpm run dist:win   # for Windowsnpm run build

```

npm run dist:mac   # for macOSnpm run dist:win   # for Windows

## License

npm run dist:linux # for Linuxnpm run dist:mac   # for macOS

This project is licensed under the Apache 2.0 License © 2025 Sadik Al Mahmud.  

See the [LICENSE](./LICENSE) file for full details.```npm run dist:linux # for Linux



You can use, modify, or share it freely — just keep the license note.



## NotesThis will create the packaged app inside the dist/ folder.



This is a personal project made for learning and experimentation.This will create the packaged app inside the dist/ folder.

Feel free to fork it, test your own models, or improve it.

No fancy nonsense — just a simple offline AI chat app that works.## Deployment



---📦 Deployment



## Future ImprovementsIf you want to share the installer:



### 1. API IntegrationIf you want to share the installer:

- Support for external AI APIs (OpenAI, Anthropic, Cohere, etc.)

- Hybrid mode: Switch between local models and cloud APIs1. Upload the .exe, .AppImage, or .dmg from the dist/ folder

- API key management and secure storage

- Cost tracking for API usage2. You can host it on GitHub Releases, FileHippo, or anywhere you likeUpload the .exe, .AppImage, or .dmg from the dist/ folder



### 2. Python-Based Transformer Models

- Direct integration with Python transformer models

- Support for PyTorch and TensorFlow modelsThat's all you need to make it downloadable.You can host it on GitHub Releases, FileHippo, or anywhere you like

- Python environment management within the app

- Easy model import from Hugging Face transformers library



### 3. Model Compatibility Expansion## Tech UsedThat’s all you need to make it downloadable.

- Broader template support for various model architectures

- Custom template creation guide for unsupported models

- Known incompatible models list with workarounds

- Template error handling: If a model throws template errors, users can:1. Electron for the desktop app🧩 Tech Used

  1. Submit the model name and error to the repository

  2. Find or create a custom chat template2. React + Vite for the UI

  3. Add it to the template registry manually

3. node-llama-cpp and Transformers.js for AI model handlingElectron for the desktop app

### 4. Template Error Solutions

4. Tailwind CSS for basic styling

If you encounter template-related errors:

- Check if your model is in the supported list5. Zustand for state managementReact + Vite for the UI

- Report the issue with model details

- We'll add the template to the registry6. Electron Store for local data

- Or follow the template creation guide (coming soon)

node-llama-cpp and Transformers.js for AI model handling

### Contributing

## Folder Overview

Found a model that doesn't work? Open an issue with:

- Model name and sourceTailwind CSS for basic styling

- Error message

- Model architecture details```



We'll help add support for it.gecko-chatbot/Zustand for state management



---├── public/        # images, icons



Made by Sadik Al Mahmud  ├── src/           # frontend + backendElectron Store for local data

Local, Fast, and Yours.

│   ├── components/

│   ├── pages/📁 Folder Overview

│   ├── backend/gecko-chatbot/

│   └── utils/├── public/        # images, icons

├── main.js├── src/           # frontend + backend

├── preload.js│   ├── components/

├── package.json│   ├── pages/

└── DEPLOYMENT.md│   ├── backend/

```│   └── utils/

├── main.js

## License├── preload.js

├── package.json

This project is licensed under the Apache 2.0 License © 2025 Sadik Al Mahmud.  └── DEPLOYMENT.md

See the [LICENSE](./LICENSE) file for full details.

📜 License

You can use, modify, or share it freely — just keep the license note.

## 📄 License

## NotesThis project is licensed under the Apache 2.0 License © 2025 Sadik Al Mahmud.  

See the [LICENSE](./LICENSE) file for full details.

This is a personal project made for learning and experimentation.

Feel free to fork it, test your own models, or improve it.You can use, modify, or share it freely — just keep the license note.

No fancy nonsense — just a simple offline AI chat app that works.

💬 Notes

---

This is a personal project made for learning and experimentation.

Made by Sadik Al Mahmud  Feel free to fork it, test your own models, or improve it.

IMPROVEMENTS :

Local, Fast, and Yours.No fancy nonsense — just a simple offline AI chat app that works.


Made by Sadik Al Mahmud
Local, Fast, and Yours. 🦎
