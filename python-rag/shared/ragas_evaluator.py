"""RAGAS evaluation module for RAG quality assessment.

Adapts the provided reference, with env-based configuration and
minimal dependencies on the surrounding app.
"""
from __future__ import annotations

import asyncio
import os
import time
from typing import Any, Dict, List, Optional

from datasets import Dataset
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas import evaluate
from ragas.metrics import answer_relevancy, faithfulness

import logging

logger = logging.getLogger(__name__)


class RAGASEvaluator:
    """Evaluator for RAG responses using RAGAS metrics (faithfulness + answer relevancy)."""

    def __init__(
        self,
        *,
        llm_model: Optional[str] = None,
        llm_temperature: Optional[float] = None,
        embedding_model: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        log_results: bool = False,
    ) -> None:
        logger.info("Initializing RAGAS evaluator")
        logger.info(f"RAGAS LLM model: {llm_model or os.getenv('RAGAS_LLM_MODEL') or os.getenv('LLM_MODEL') or 'gpt-4o-mini'}")
        logger.info(f"RAGAS Embedding model: {embedding_model or os.getenv('RAGAS_EMBEDDING_MODEL') or 'text-embedding-3-small'}")

        # Resolve configuration from args or environment
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required for RAGAS evaluation")

        self.llm_model = llm_model or os.getenv("RAGAS_LLM_MODEL") or os.getenv("LLM_MODEL") or "gpt-4o-mini"
        self.llm_temperature = (
            llm_temperature
            if llm_temperature is not None
            else float(os.getenv("RAGAS_LLM_TEMPERATURE", os.getenv("LLM_TEMPERATURE", "0")))
        )
        self.embedding_model = embedding_model or os.getenv("RAGAS_EMBEDDING_MODEL") or "text-embedding-3-small"
        self.log_results = log_results or os.getenv("RAGAS_LOG_RESULTS", "false").lower() == "true"

        # Initialize models
        self.llm = ChatOpenAI(
            model=self.llm_model,
            temperature=self.llm_temperature,
            api_key=self.openai_api_key,
        )
        self.embeddings = OpenAIEmbeddings(
            model=self.embedding_model,
            api_key=self.openai_api_key,
        )

        # Metrics (reference-free)
        self.metrics = [faithfulness, answer_relevancy]

        logger.info(
            "RAGAS evaluator ready - LLM=%s (temp=%s), Embeddings=%s",
            self.llm_model,
            self.llm_temperature,
            self.embedding_model,
        )

    async def aevaluate(self, question: str, answer: str, contexts: List[str]) -> Dict[str, Any]:
        """Async evaluation entry point."""
        start_time = time.time()
        try:
            dataset = self._prepare_dataset(question, answer, contexts)
            result = await asyncio.to_thread(self._evaluate_sync, dataset)
            evaluation_time_ms = (time.time() - start_time) * 1000

            scores = {
                "faithfulness": float(result.get("faithfulness")) if "faithfulness" in result else None,
                "answer_relevancy": float(result.get("answer_relevancy")) if "answer_relevancy" in result else None,
                "evaluation_time_ms": round(evaluation_time_ms, 2),
                "error": None,
            }

            if self.log_results:
                logger.info(
                    "RAGAS results: faithfulness=%s, answer_relevancy=%s, time_ms=%s",
                    scores["faithfulness"],
                    scores["answer_relevancy"],
                    scores["evaluation_time_ms"],
                )

            return scores

        except Exception as exc:  # pragma: no cover - defensive path
            logger.warning("RAGAS evaluation failed: %s", exc, exc_info=True)
            return {
                "faithfulness": None,
                "answer_relevancy": None,
                "evaluation_time_ms": None,
                "error": str(exc),
            }

    def _prepare_dataset(self, question: str, answer: str, contexts: List[str]) -> Dataset:
        data = {
            "question": [question],
            "answer": [answer],
            "contexts": [contexts],
        }
        logger.info(f"RAGAS input: question={question[:100]}, answer={answer[:100]}, contexts={[c[:100] for c in contexts]}")
        return Dataset.from_dict(data)

    def _evaluate_sync(self, dataset: Dataset) -> Dict[str, Any]:
        result = evaluate(
            dataset,
            metrics=self.metrics,
            llm=self.llm,
            embeddings=self.embeddings,
        )
        output = result.to_pandas().to_dict("records")[0]
        logger.info(f"RAGAS raw output: {output}")
        return output
