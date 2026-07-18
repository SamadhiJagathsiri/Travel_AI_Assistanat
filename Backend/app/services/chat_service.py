import json
import logging
import re
from collections import deque
from typing import Optional

from app.config import settings
from app.models.schemas import ChatPayload, SourceReference
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from app.utils.prompt import (
    build_general_prompt,
    build_rag_prompt,
    build_relevance_validation_prompt,
)

logger = logging.getLogger(__name__)


class ConversationMessage:
    """Stores a message in conversation history"""
    def __init__(self, role: str, content: str):
        self.role = role  # "user" or "assistant"
        self.content = content

    def format(self) -> str:
        """Format message for inclusion in prompt"""
        return f"{self.role.capitalize()}: {self.content}"


class ChatService:
    GREETING_PATTERNS = [
        r"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|hola|howdy)\b",
        r"^(what\'s\s+up|sup|yo)[\s!?.]*$",
        r"^(how\s+are\s+you|how\s+do\s+you\s+do)\b",
    ]
    THANKS_PATTERNS = [r"^(thanks|thank you|thx|appreciate it)\b"]
    GOODBYE_PATTERNS = [r"^(bye|goodbye|see you|farewell|take care)\b"]
    HELP_PATTERNS = [r"^(help|assist me|can you help)\b"]
    SIMILARITY_THRESHOLD = 0.60
    RETRIEVAL_TOP_K = 5
    MAX_HISTORY_MESSAGES = 4  # Keep last 4 messages for context
    MAX_HISTORY_CONTENT_CHARS = 240
    MAX_RAG_ANSWER_CHARS = 900
    MAX_VALIDATION_CHARS = 700

    def __init__(self):
        
        self.conversation_history: deque = deque(maxlen=self.MAX_HISTORY_MESSAGES * 2)

    def _normalize_message(self, message: str) -> str:
        return message.strip().lower()

    def _compact_history_content(self, content: str) -> str:
        compacted = re.sub(r"\s+", " ", content).strip()

        if len(compacted) <= self.MAX_HISTORY_CONTENT_CHARS:
            return compacted

        return compacted[: self.MAX_HISTORY_CONTENT_CHARS].rstrip() + "..."

    def _add_to_history(self, role: str, content: str) -> None:
        """Add a message to conversation history"""
        self.conversation_history.append(
            ConversationMessage(role, self._compact_history_content(content))
        )

    def _get_conversation_context(self, include_assistant: bool = True) -> str:
        """Retrieve recent conversation history as formatted context"""
        if len(self.conversation_history) < 2:
            return ""  # Not enough history

        context_messages = [
            message
            for message in self.conversation_history
            if include_assistant or message.role == "user"
        ]

        if not context_messages:
            return ""

        formatted_context = "\n".join(msg.format() for msg in context_messages)

        return f"Recent conversation context:\n{formatted_context}\n"

    def _get_recent_user_context(self) -> str:
        user_messages = [
            message.content
            for message in self.conversation_history
            if message.role == "user"
        ]

        return " ".join(user_messages[-2:])

    def _needs_contextual_retrieval(self, message: str) -> bool:
        normalized = self._normalize_message(message)
        contextual_terms = [
            "there",
            "that place",
            "this place",
            "that destination",
            "this destination",
            "itinerary",
            "how many days",
            "how long",
            "stay there",
            "should i stay",
        ]

        return any(term in normalized for term in contextual_terms)

    def _build_retrieval_query(self, message: str) -> str:
        if not self._needs_contextual_retrieval(message):
            return message

        recent_user_context = self._get_recent_user_context()
        if not recent_user_context:
            return message

        return f"{recent_user_context} {message}"

    def _build_prompt_with_context(self, message: str, rag_context: Optional[str] = None) -> str:
        """Build prompt with conversation context"""
        if rag_context:
            # For RAG prompts, keep memory to recent user turns only so prior
            # assistant answers cannot reintroduce previously retrieved chunks.
            conversation_context = self._get_conversation_context(include_assistant=False)
            return build_rag_prompt(
                user_message=message,
                context=rag_context,
                conversation_context=conversation_context,
            )
        else:
            # General prompt with conversation context
            conversation_context = self._get_conversation_context()
            base_prompt = build_general_prompt(message)
            if conversation_context:
                return conversation_context + "\n" + base_prompt
            return base_prompt

    def _is_greeting(self, message: str) -> bool:
        normalized = self._normalize_message(message)

        for pattern in self.GREETING_PATTERNS:
            if re.match(pattern, normalized):
                return True

        return False

    def _is_thanks(self, message: str) -> bool:
        normalized = self._normalize_message(message)

        for pattern in self.THANKS_PATTERNS:
            if re.match(pattern, normalized):
                return True

        return False

    def _is_goodbye(self, message: str) -> bool:
        normalized = self._normalize_message(message)

        for pattern in self.GOODBYE_PATTERNS:
            if re.match(pattern, normalized):
                return True

        return False

    def _is_help(self, message: str) -> bool:
        normalized = self._normalize_message(message)

        for pattern in self.HELP_PATTERNS:
            if re.match(pattern, normalized):
                return True

        return False

    def _classify_intent(self, message: str) -> str:
        if self._is_greeting(message):
            return "greeting"
        if self._is_thanks(message):
            return "thanks"
        if self._is_goodbye(message):
            return "goodbye"
        if self._is_help(message):
            return "help"
        return "travel_or_general"

    def _build_sources(self, documents) -> list[SourceReference]:
        sources = []

        for doc in documents:
            metadata = doc.metadata or {}
            source = metadata.get("source", "unknown")
            chunk = metadata.get("chunk")
            page = metadata.get("page")

            sources.append(
                SourceReference(
                    document=source,
                    chunk=chunk,
                    page=page,
                )
            )

        return sources

    def _handle_social_response(self, intent: str) -> ChatPayload:
        responses = {
            "greeting": (
                "Hi there! I'm GlobeGuide AI. I can help you plan trips, answer travel questions, "
                "and use uploaded travel guides when they're relevant."
            ),
            "thanks": "You're welcome! I'm happy to help with your travel plans.",
            "goodbye": "Goodbye! Come back anytime you want help planning a trip.",
            "help": (
                "I can help with destinations, itineraries, visas, budgets, packing, weather, transport, "
                "and uploaded travel guides when they match your question."
            ),
        }

        return ChatPayload(
            answer=responses.get(intent, "How can I help with your travel plans today?"),
            provider="cohere",
            model=settings.COHERE_MODEL,
            sources=[],
        )

    def _format_document_context(self, documents) -> str:
        context_chunks = []

        for doc in documents:
            if not doc.page_content or not doc.page_content.strip():
                continue

            metadata = doc.metadata or {}
            source = metadata.get("source", "unknown")
            chunk = metadata.get("chunk", "unknown")

            context_chunks.append(
                f"[Source: {source} | Chunk: {chunk}]\n{doc.page_content.strip()}"
            )

        return "\n\n".join(context_chunks)

    def _format_relevance_validation_context(self, documents) -> str:
        candidate_chunks = []

        for index, doc in enumerate(documents, start=1):
            if not doc.page_content or not doc.page_content.strip():
                continue

            metadata = doc.metadata or {}
            source = metadata.get("source", "unknown")
            chunk = metadata.get("chunk", "unknown")
            excerpt = re.sub(r"\s+", " ", doc.page_content).strip()
            excerpt = excerpt[: self.MAX_VALIDATION_CHARS].rstrip()

            candidate_chunks.append(
                f"[Candidate {index} | Source: {source} | Chunk: {chunk}]\n{excerpt}"
            )

        return "\n\n".join(candidate_chunks)

    def _parse_relevance_validation(self, validation_response: str, candidate_count: int) -> set[int]:
        if not validation_response:
            return set()

        try:
            parsed_response = json.loads(validation_response.strip())
            chunks = parsed_response.get("relevant_chunks", [])
        except json.JSONDecodeError:
            match = re.search(
                r'"relevant_chunks"\s*:\s*\[([^\]]*)\]',
                validation_response,
                re.IGNORECASE,
            )
            if not match:
                return set()
            chunks = re.findall(r"\d+", match.group(1))

        return {
            int(chunk)
            for chunk in chunks
            if str(chunk).isdigit() and 1 <= int(chunk) <= candidate_count
        }

    def _validate_relevant_documents(self, message: str, documents) -> list:
        if not documents:
            return []

        candidate_context = self._format_relevance_validation_context(documents)
        if not candidate_context:
            return []

        prompt = build_relevance_validation_prompt(
            user_message=message,
            candidate_context=candidate_context,
            conversation_context=self._get_conversation_context(include_assistant=False),
        )

        try:
            validation_response = llm_service.generate_response(prompt)
        except Exception:
            return []

        logger.info(f"Relevance validation raw: {validation_response}")

        relevant_indices = self._parse_relevance_validation(
            validation_response,
            candidate_count=len(documents),
        )

        return [
            doc
            for index, doc in enumerate(documents, start=1)
            if index in relevant_indices
        ]

    def _looks_like_context_dump(self, answer: str) -> bool:
        if "[source:" in answer.lower():
            return True

        if re.search(r"\bchunk\s*:\s*\d+", answer, re.IGNORECASE):
            return True

        if len(answer) > 2500:
            return True

        return False

    def _extract_destination(self, message: str) -> str:
        match = re.search(
            r"\b(?:go|going|travel|visit|trip)\s+to\s+([A-Za-z][A-Za-z\s-]{1,40})",
            message,
            re.IGNORECASE,
        )

        if not match:
            return "that destination"

        destination = match.group(1).strip(" .?!,")
        return destination.title()

    def _build_concise_rag_fallback(self, message: str, documents) -> str:
        destination = self._extract_destination(message)
        combined_context = " ".join(
            doc.page_content.strip()
            for doc in documents
            if doc.page_content and doc.page_content.strip()
        ).lower()

        tips = []

        if "flight" in combined_context or "air" in combined_context:
            tips.append(f"The guide mentions air services as an option for reaching {destination}.")

        if "train" in combined_context:
            tips.append("The guide also mentions train travel as a comfortable way to cover longer distances.")

        if "bus" in combined_context:
            tips.append("Buses are described as frequent and cheap, though they can be crowded or less comfortable.")

        if not tips:
            return (
                f"{destination} sounds like a worthwhile stop. Tell me whether you care most about "
                "transport, things to do, food, nearby places, or pacing, and I can narrow the plan down."
            )

        return (
            f"For {destination}, I would plan around the transport options the guide surfaced: "
            + " ".join(tips[:3])
        )

    def chat(self, message: str) -> ChatPayload:
        if not message.strip():
            raise ValueError("Message cannot be empty.")

        intent = self._classify_intent(message)

        # Handle social intents (greetings, thanks, etc.)
        if intent in {"greeting", "thanks", "goodbye", "help"}:
            response = self._handle_social_response(intent)
            # Store in history for context
            self._add_to_history("user", message)
            self._add_to_history("assistant", response.answer)
            return response

        retrieval_results = []

        if rag_service.has_documents():
            try:
                retrieval_query = self._build_retrieval_query(message)
                retrieval_results = rag_service.retrieve_with_scores(
                    retrieval_query,
                    top_k=self.RETRIEVAL_TOP_K,
                )
            except ValueError:
                retrieval_results = []

        if not retrieval_results:
            # use general prompt with conversation context
            prompt = self._build_prompt_with_context(message, rag_context=None)
            answer = llm_service.generate_response(prompt)
            
            # Store in history
            self._add_to_history("user", message)
            self._add_to_history("assistant", answer)
            
            return ChatPayload(
                answer=answer,
                provider="cohere",
                model=settings.COHERE_MODEL,
                sources=[],
            )

        # Filter documents by similarity threshold
        relevant_documents = [
            (doc, score)
            for doc, score in retrieval_results
            if score >= self.SIMILARITY_THRESHOLD
        ]

        if not relevant_documents:
            # Below threshold - use general prompt with conversation context
            prompt = self._build_prompt_with_context(message, rag_context=None)
            answer = llm_service.generate_response(prompt)
            
            # Store in history
            self._add_to_history("user", message)
            self._add_to_history("assistant", answer)
            
            return ChatPayload(
                answer=answer,
                provider="cohere",
                model=settings.COHERE_MODEL,
                sources=[],
            )

        # Format RAG context from relevant documents (top 2 to optimize LLM latency)
        documents = [doc for doc, _ in relevant_documents][:2]

        if not documents:
            prompt = self._build_prompt_with_context(message, rag_context=None)
            answer = llm_service.generate_response(prompt)

            self._add_to_history("user", message)
            self._add_to_history("assistant", answer)

            return ChatPayload(
                answer=answer,
                provider="cohere",
                model=settings.COHERE_MODEL,
                sources=[],
            )

        rag_context = self._format_document_context(documents)

        if not rag_context:
            raise ValueError("Retrieved document chunks were empty.")

        #conversation context + RAG context
        prompt = self._build_prompt_with_context(message, rag_context=rag_context)
        answer = llm_service.generate_response(prompt)

        if self._looks_like_context_dump(answer):
            answer = self._build_concise_rag_fallback(message, documents)

        # Store in history
        self._add_to_history("user", message)
        self._add_to_history("assistant", answer)

        return ChatPayload(
            answer=answer,
            provider="cohere",
            model=settings.COHERE_MODEL,
            sources=self._build_sources(documents),
        )

    def generate_response(self, message: str) -> ChatPayload:
        return self.chat(message)


chat_service = ChatService()
