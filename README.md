🦎 Gecko Chatbot

Gecko Chatbot is a fully offline AI chatbot built with Electron, React, and llama.cpp.
It lets you chat with local LLMs on your desktop — no servers, no tracking, no internet required.

🧠 What It Does

Runs local LLMs (GGUF / GGML models via llama.cpp)

100% offline — privacy-first

Switch easily between multiple models

Stores chat history locally

Adjustable parameters: temperature, max tokens, presets

Simple, private, and customizable AI assistant on your computer

⚙️ How to Run
Requirements

Node.js 18+

npm or yarn

Around 8GB RAM (depends on model size)

Setup
git clone https://github.com/AlMahmud22/gecko-chatbot.git
cd gecko-chatbot
npm install
npm run dev

Build for Production
npm run build
npm run dist:win   # Windows
npm run dist:mac   # macOS
npm run dist:linux # Linux


The built app will appear inside the dist/ folder.

📦 Deployment

To share your app:

Upload the .exe, .AppImage, or .dmg from the dist/ folder.

Host it on GitHub Releases or any file hosting platform.

🧩 Tech Used

Electron – desktop app framework

React + Vite – frontend

node-llama-cpp – local LLM inference

Tailwind CSS – styling

Zustand – state management

Electron Store – local storage

📁 Folder Overview
gecko-chatbot/
├── public/        # images, icons
├── src/           # frontend + backend
│   ├── components/
│   ├── pages/
│   ├── backend/
│   └── utils/
├── main.js
├── preload.js
├── package.json
└── DEPLOYMENT.md

🚀 Future Improvements

Support for cloud APIs (OpenAI, Anthropic, etc.)

Python-based model integration (PyTorch, TensorFlow)

Expanded model compatibility templates

Template error handling and user submissions

🤝 Contributing

Found a model issue or idea?
Open an issue with:

Model name and source

Error message

Model architecture details

📜 License

Licensed under the Apache 2.0 License © 2025 Sadik Al Mahmud
See the LICENSE
 file for full details.
You can use, modify, or share it freely — just keep the license note.

💬 Notes

This is a personal project made for learning and experimentation.
Feel free to fork, test your own models, or improve it.

Made by Sadik Al Mahmud
Local, Fast, and Yours.
