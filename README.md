# equators-chatbot
Equators Chatbot
A fully offline, GUI-only desktop chatbot app built with Electron, React, and llama.cpp. Designed for non-technical users, it provides an intuitive interface for chatting, managing models, and viewing history.
Setup

Install Dependencies:
npm install


Place Dependencies:

Copy Python binaries to python-win/, python-mac/, or python-linux/.
Copy MongoDB binaries to mongodb-win/, mongodb-mac/, or mongodb-linux/.
Place the default Qwen1.5-1.5B-Instruct model in models/ for offline mode.


Run Development:
npm run dev


Build:
npm run package



Features

Fully GUI-based with no CLI or config files.
Local GGUF model support via llama.cpp.
Embedded storage for chat history and presets.
Local model installation via file picker.
System profiling for model recommendations.

Platforms

Windows (.exe)
macOS (.dmg)
Linux (.AppImage, .deb)
Portable (.zip)
