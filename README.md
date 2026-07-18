# 🌍 GlobeGuide AI

**GlobeGuide AI** is an AI-powered travel assistant that helps users plan trips, discover destinations, answer travel-related questions, and intelligently use uploaded travel guides through Retrieval-Augmented Generation (RAG).

The assistant combines **general travel knowledge** with **uploaded PDF travel guides**, automatically deciding when to use document knowledge and when to answer using its own travel expertise.

---

## ✨ Features

- 🌍 General AI-powered travel assistant
- 📄 Upload travel guide PDFs
- 🤖 Intelligent Retrieval-Augmented Generation (RAG)
- 🧠 Semantic search using Sentence Transformers + FAISS
- ✅ Second-stage relevance validation to prevent incorrect document retrieval
- 💬 Conversational chat interface
- 📚 Conversation memory
- 📎 Upload PDFs directly from the chat input
- 📄 Automatic source attribution when uploaded guides are used
- 🎨 Modern responsive UI inspired by ChatGPT/Gemini
- ⚡ Fast local embedding model loading
- 📱 Responsive design for desktop and mobile

---

# 🏗️ Architecture

```
                        +----------------------+
                        |   React + Vite UI    |
                        +----------+-----------+
                                   |
                                   |
                                   v
                        +----------------------+
                        |   FastAPI Backend    |
                        +----------+-----------+
                                   |
                                   |
                        +----------+-----------+
                        |      Chat Service    |
                        +----------+-----------+
                                   |
                 +-----------------+------------------+
                 |                                    |
                 |                                    |
                 v                                    v
      General Travel Prompt                 RAG Pipeline
                                                |
                                                v
                               Sentence Transformer Embeddings
                                                |
                                                v
                                          FAISS Vector Search
                                                |
                                                v
                                  Similarity Threshold Filter
                                                |
                                                v
                                LLM Relevance Validation
                                                |
                               +----------------+----------------+
                               |                                 |
                               |                                 |
                               v                                 v
                      General LLM Prompt                RAG Prompt
                               |                                 |
                               +----------------+----------------+
                                                |
                                                v
                                         Cohere Chat API
                                                |
                                                v
                                          Final Response
```

---

# 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- FastAPI
- Python

### AI / Machine Learning

- Cohere API
- Sentence Transformers
- FAISS
- Hugging Face Transformers

### Other

- REST API
- PDF Processing
- Semantic Search

---

# 📂 Project Structure

```
Travel_AI_Assistant/

├── Backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── uploads/
│   ├── tests/
│   └── requirements.txt
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

# 🚀 Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/globeguide-ai.git

cd globeguide-ai
```

---

## 2. Backend

Create a virtual environment.

```bash
python -m venv venv
```

Activate it.

### Windows

```bash
venv\Scripts\activate
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Create a `.env` file.

```env
COHERE_API_KEY=YOUR_API_KEY
COHERE_MODEL=command-r-plus
```

Run the backend.

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```
http://localhost:8000
```

---

## 3. Frontend

Install dependencies.

```bash
npm install
```

Create:

```
Frontend/.env.local
```

```env
VITE_API_URL=http://localhost:8000
```

Run the frontend.

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🧠 RAG Workflow

When a user asks a question:

1. User query is embedded.
2. FAISS retrieves the most similar document chunks.
3. Similarity threshold removes weak matches.
4. LLM relevance validation checks whether retrieved chunks actually answer the user's question.
5. If relevant:
   - RAG prompt is used.
   - Source document is shown.
6. Otherwise:
   - General travel knowledge is used.
   - No source card is displayed.

This prevents unrelated travel guides from influencing responses.

---

# 🔍 Key Features

### General Travel Knowledge

Ask questions such as:

- Best places to visit in Japan
- Plan a trip to Italy
- Budget for Switzerland

without uploading any document.

---

### PDF-Based Answers

Upload a travel guide and ask:

- Local food
- Attractions
- Transportation
- Accommodation

The assistant automatically uses the uploaded guide whenever it is relevant.

---

### Intelligent Relevance Validation

The assistant does **not** blindly use uploaded documents.

A second-stage LLM validation step determines whether retrieved document chunks truly answer the user's question before RAG is applied.

---

# 📈 Future Improvements

- 🎤 Voice interaction
- 🌎 Multi-language support
- 🗺️ Interactive maps
- 🏨 Hotel recommendations
- ✈️ Flight search integration
- 📍 Location-aware suggestions
- User authentication
- Travel history and saved itineraries

---

# 👨‍💻 Author

**Samadhi Jagathsiri**

Computer Science Undergraduate

University of Kelaniya

---

# 📄 License

This project was developed for educational and portfolio purposes.
