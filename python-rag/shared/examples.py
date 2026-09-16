"""
NHAI RAG System - Shared Utilities Usage Examples

Practical examples showing how to use the shared utilities
in real-world scenarios for Screen 7 and Screen 8.

Author: NHAI Development Team
Date: January 2026
"""

import os
from typing import List, Dict, Any

# Import shared utilities
from embeddings import (
    create_embedding_generator,
    EmbeddingProvider,
    EmbeddingConfig
)
from llm_utils import (
    create_llm_manager,
    PromptTemplateManager,
    LLMProvider
)


# =============================================================================
# EXAMPLE 1: Document Processing for Screen 7 (Historical Data)
# =============================================================================

def example_1_process_historical_rfp():
    """
    Example: Process and embed a historical RFP document
    Used by Screen 7 History Retriever Agent
    """
    print("\n" + "="*60)
    print("EXAMPLE 1: Process Historical RFP Document")
    print("="*60)
    
    # Sample RFP content
    rfp_document = """
    RFP Number: RFP-2023-NH-145
    Project: Highway Construction - NH-44 Expansion
    
    1. Earnest Money Deposit (EMD)
    Bidders must submit EMD of 2% of estimated project cost.
    EMD can be submitted as bank guarantee or demand draft.
    
    2. Technical Specifications
    - Road width: 8 lanes (4 lanes each direction)
    - Pavement type: Rigid pavement with concrete
    - Design life: 30 years
    
    3. Eligibility Criteria
    - Minimum experience: 5 years in highway construction
    - Minimum turnover: ₹500 crores in last 3 years
    - Valid contractor license required
    """
    
    # Initialize embedding generator
    embedding_gen = create_embedding_generator(
        provider="openai",
        model="text-embedding-3-small"
    )
    
    # Embed the document
    print("\n1. Generating embedding for RFP document...")
    doc_embedding = embedding_gen.embed_query(rfp_document)
    print(f"   ✓ Embedding dimension: {len(doc_embedding)}")
    
    # Initialize LLM for summarization
    llm_manager = create_llm_manager(
        provider="openai",
        model="gpt-4o-mini"
    )
    
    # Generate summary
    print("\n2. Generating document summary...")
    summary_prompt = PromptTemplateManager.format_template(
        "document_summarization",
        document=rfp_document
    )
    summary = llm_manager.generate(summary_prompt)
    print(f"   ✓ Summary generated:\n   {summary[:200]}...")
    
    # Extract metadata using JSON mode
    print("\n3. Extracting structured metadata...")
    metadata_schema = {
        "rfp_number": "string",
        "project_name": "string",
        "emd_percentage": "number",
        "key_requirements": ["string"]
    }
    
    metadata = llm_manager.generate_json(
        prompt=f"Extract metadata from this RFP:\n\n{rfp_document}",
        schema=metadata_schema
    )
    print(f"   ✓ Metadata extracted: {metadata}")
    
    return {
        "embedding": doc_embedding,
        "summary": summary,
        "metadata": metadata
    }


# =============================================================================
# EXAMPLE 2: Query Processing for Screen 8 (Chief Engineer)
# =============================================================================

def example_2_process_vendor_query():
    """
    Example: Process vendor query with historical context
    Used by Screen 8 Chief Engineer Agent
    """
    print("\n" + "="*60)
    print("EXAMPLE 2: Process Vendor Query")
    print("="*60)
    
    # Vendor query
    vendor_query = "What is the minimum EMD amount required for this project?"
    
    # Historical context (from vector search)
    historical_context = """
    From RFP-2023-NH-145:
    EMD requirement is 2% of estimated project cost.
    Project estimated cost: ₹1000 crores
    
    From RFP-2023-NH-087:
    EMD must be submitted as bank guarantee or demand draft.
    No cash deposits accepted.
    """
    
    # Initialize utilities
    embedding_gen = create_embedding_generator(provider="openai")
    llm_manager = create_llm_manager(provider="openai")
    
    # Step 1: Analyze query intent
    print("\n1. Analyzing query intent...")
    analysis_prompt = PromptTemplateManager.format_template(
        "query_analysis",
        query=vendor_query
    )
    analysis = llm_manager.generate_json(analysis_prompt)
    print(f"   ✓ Query category: {analysis.get('category')}")
    print(f"   ✓ Intent: {analysis.get('intent')}")
    
    # Step 2: Generate response with context
    print("\n2. Generating response with historical context...")
    answer_prompt = PromptTemplateManager.format_template(
        "answer_generation",
        context=historical_context,
        query=vendor_query
    )
    response = llm_manager.generate(answer_prompt)
    print(f"   ✓ Generated response:\n   {response[:300]}...")
    
    # Step 3: Calculate confidence
    print("\n3. Calculating confidence score...")
    confidence = 0.85  # Would be calculated based on context relevance
    print(f"   ✓ Confidence: {confidence * 100}%")
    
    return {
        "query": vendor_query,
        "analysis": analysis,
        "response": response,
        "confidence": confidence,
        "sources": ["RFP-2023-NH-145", "RFP-2023-NH-087"]
    }


# =============================================================================
# EXAMPLE 3: Batch Processing Multiple Documents
# =============================================================================

def example_3_batch_processing():
    """
    Example: Efficiently process multiple Q&A pairs
    Used for bulk upload in Screen 7
    """
    print("\n" + "="*60)
    print("EXAMPLE 3: Batch Process Historical Q&A")
    print("="*60)
    
    # Sample Q&A pairs
    qa_pairs = [
        {
            "question": "What is the minimum turnover requirement?",
            "answer": "Minimum turnover of ₹500 crores in last 3 years"
        },
        {
            "question": "What is the EMD percentage?",
            "answer": "EMD is 2% of the estimated project cost"
        },
        {
            "question": "What is the project completion timeline?",
            "answer": "Project must be completed within 36 months"
        },
        {
            "question": "Is JV allowed?",
            "answer": "Yes, Joint Ventures are allowed with proper documentation"
        },
        {
            "question": "What are the payment terms?",
            "answer": "Payment will be made in monthly installments based on work progress"
        }
    ]
    
    # Initialize embedding generator
    embedding_gen = create_embedding_generator(
        provider="openai",
        batch_size=10,
        cache_enabled=True
    )
    
    # Extract all questions and answers
    questions = [qa["question"] for qa in qa_pairs]
    answers = [qa["answer"] for qa in qa_pairs]
    
    # Batch embed questions
    print(f"\n1. Batch embedding {len(questions)} questions...")
    question_embeddings = embedding_gen.embed_documents(questions)
    print(f"   ✓ Generated {len(question_embeddings)} question embeddings")
    
    # Batch embed answers
    print(f"\n2. Batch embedding {len(answers)} answers...")
    answer_embeddings = embedding_gen.embed_documents(answers)
    print(f"   ✓ Generated {len(answer_embeddings)} answer embeddings")
    
    # Check cache efficiency
    cache_size = embedding_gen.get_cache_size()
    print(f"\n3. Cache efficiency: {cache_size} items cached")
    
    # Calculate similarities between Q&A
    print("\n4. Calculating Q&A similarities...")
    for i, qa in enumerate(qa_pairs[:3]):  # First 3 for demo
        similarity = embedding_gen.calculate_similarity(
            question_embeddings[i],
            answer_embeddings[i]
        )
        print(f"   Q{i+1} ↔ A{i+1} similarity: {similarity:.4f}")
    
    return {
        "processed": len(qa_pairs),
        "question_embeddings": question_embeddings,
        "answer_embeddings": answer_embeddings
    }


# =============================================================================
# EXAMPLE 4: Compliance Checking
# =============================================================================

def example_4_compliance_check():
    """
    Example: Check RFP compliance with standard template
    Used by Admin in Screen 7
    """
    print("\n" + "="*60)
    print("EXAMPLE 4: RFP Compliance Check")
    print("="*60)
    
    # RFP section to check
    rfp_section = """
    3.2 Payment Terms
    Payment will be made upon completion of work.
    No advance payment will be provided.
    """
    
    # Standard template
    standard_template = """
    Standard Payment Terms:
    - Monthly payment based on work progress
    - Advance mobilization payment of 10% allowed
    - Final payment within 30 days of completion
    - Retention money: 5% until defect liability period
    """
    
    # Initialize LLM
    llm_manager = create_llm_manager(provider="openai", temperature=0.3)
    
    # Run compliance check
    print("\n1. Running compliance analysis...")
    compliance_prompt = PromptTemplateManager.format_template(
        "compliance_check",
        rfp_section=rfp_section,
        template=standard_template
    )
    
    compliance_result = llm_manager.generate_json(
        prompt=compliance_prompt + "\n\nProvide result as JSON with: issues[], missing_clauses[], recommendations[]",
        schema={
            "issues": ["string"],
            "missing_clauses": ["string"],
            "recommendations": ["string"]
        }
    )
    
    print(f"   ✓ Issues found: {len(compliance_result.get('issues', []))}")
    print(f"   ✓ Missing clauses: {len(compliance_result.get('missing_clauses', []))}")
    
    # Display issues
    print("\n2. Compliance Issues:")
    for i, issue in enumerate(compliance_result.get('issues', []), 1):
        print(f"   {i}. {issue}")
    
    print("\n3. Recommendations:")
    for i, rec in enumerate(compliance_result.get('recommendations', []), 1):
        print(f"   {i}. {rec}")
    
    return compliance_result


# =============================================================================
# EXAMPLE 5: Multi-turn Conversation
# =============================================================================

def example_5_conversation_mode():
    """
    Example: Multi-turn conversation with context
    Simulates vendor asking follow-up questions
    """
    print("\n" + "="*60)
    print("EXAMPLE 5: Multi-turn Conversation")
    print("="*60)
    
    # Initialize LLM with conversation support
    llm_manager = create_llm_manager(
        provider="openai",
        model="gpt-4o-mini",
        temperature=0.7
    )
    
    # Conversation flow
    conversations = [
        "What is EMD?",
        "How much should I pay?",
        "Can I submit it as cash?",
        "What happens if I don't submit EMD?"
    ]
    
    print("\nStarting conversation simulation...\n")
    
    for i, message in enumerate(conversations, 1):
        print(f"User: {message}")
        response = llm_manager.chat(
            message=message,
            use_history=True,
            max_history=10
        )
        print(f"Bot: {response}\n")
        print("-" * 60 + "\n")
    
    # Show conversation history
    history = llm_manager.get_history()
    print(f"Conversation history: {len(history)} messages")
    
    # Save conversation
    llm_manager.save_history("example_conversation.json")
    print("✓ Conversation saved to example_conversation.json")
    
    return history


# =============================================================================
# EXAMPLE 6: Cost Estimation
# =============================================================================

def example_6_cost_estimation():
    """
    Example: Estimate costs for API usage
    Important for production deployment
    """
    print("\n" + "="*60)
    print("EXAMPLE 6: API Cost Estimation")
    print("="*60)
    
    # Initialize managers
    embedding_gen = create_embedding_generator(provider="openai")
    llm_manager = create_llm_manager(provider="openai", model="gpt-4o-mini")
    
    # Sample data
    sample_query = "What are the technical specifications for highway construction?"
    sample_context = "Technical specifications: 8-lane highway, rigid pavement, 30-year design life"
    
    # Count tokens
    query_tokens = llm_manager.count_tokens(sample_query)
    context_tokens = llm_manager.count_tokens(sample_context)
    
    print(f"\n1. Token Counts:")
    print(f"   Query: {query_tokens} tokens")
    print(f"   Context: {context_tokens} tokens")
    print(f"   Total input: {query_tokens + context_tokens} tokens")
    
    # Estimate output tokens (typical response)
    estimated_output = 200
    
    # Calculate cost
    cost = llm_manager.estimate_cost(
        input_tokens=query_tokens + context_tokens,
        output_tokens=estimated_output
    )
    
    print(f"\n2. Cost Estimation (GPT-4o-mini):")
    print(f"   Input tokens: {query_tokens + context_tokens}")
    print(f"   Output tokens: {estimated_output}")
    print(f"   Estimated cost: ${cost:.6f}")
    
    # Monthly projection
    queries_per_day = 1000
    days_per_month = 30
    monthly_cost = cost * queries_per_day * days_per_month
    
    print(f"\n3. Monthly Projection:")
    print(f"   Queries per day: {queries_per_day}")
    print(f"   Monthly cost: ${monthly_cost:.2f}")
    
    return {
        "per_query_cost": cost,
        "monthly_cost": monthly_cost
    }


# =============================================================================
# EXAMPLE 7: Using Local Models (Ollama)
# =============================================================================

def example_7_local_models():
    """
    Example: Use local Ollama models (no API cost)
    Good for development and testing
    """
    print("\n" + "="*60)
    print("EXAMPLE 7: Using Local Ollama Models")
    print("="*60)
    
    try:
        # Initialize with Ollama
        print("\n1. Initializing local embeddings (Ollama)...")
        embedding_gen = create_embedding_generator(
            provider="ollama",
            model="nomic-embed-text"
        )
        print("   ✓ Embeddings ready (no API cost)")
        
        print("\n2. Initializing local LLM (Ollama)...")
        llm_manager = create_llm_manager(
            provider="ollama",
            model="llama3:8b"
        )
        print("   ✓ LLM ready (no API cost)")
        
        # Test embedding
        print("\n3. Testing local embedding...")
        test_text = "What is EMD in tender context?"
        embedding = embedding_gen.embed_query(test_text)
        print(f"   ✓ Embedding dimension: {len(embedding)}")
        
        # Test LLM
        print("\n4. Testing local LLM...")
        response = llm_manager.generate(
            "Explain EMD in one sentence.",
            system_message="You are a procurement expert."
        )
        print(f"   ✓ Response: {response[:100]}...")
        
        print("\n✅ Local models working! No API costs incurred.")
        
    except Exception as e:
        print(f"\n❌ Error with local models: {str(e)}")
        print("   Make sure Ollama is running: ollama serve")
        print("   Pull required models:")
        print("   - ollama pull nomic-embed-text")
        print("   - ollama pull llama3:8b")


# =============================================================================
# Main execution
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("NHAI RAG System - Shared Utilities Examples")
    print("="*60)
    
    # Set OpenAI API key (required for most examples)
    if not os.getenv("OPENAI_API_KEY"):
        print("\n⚠️  WARNING: OPENAI_API_KEY not set!")
        print("Set it with: export OPENAI_API_KEY=sk-your-key-here")
        print("\nRunning example 7 only (local models)...\n")
        example_7_local_models()
    else:
        # Run all examples
        try:
            # Example 1: Document processing
            result1 = example_1_process_historical_rfp()
            
            # Example 2: Query processing
            result2 = example_2_process_vendor_query()
            
            # Example 3: Batch processing
            result3 = example_3_batch_processing()
            
            # Example 4: Compliance check
            result4 = example_4_compliance_check()
            
            # Example 5: Conversation
            result5 = example_5_conversation_mode()
            
            # Example 6: Cost estimation
            result6 = example_6_cost_estimation()
            
            # Example 7: Local models (optional)
            print("\n\nOptional: Try local models? (requires Ollama)")
            example_7_local_models()
            
            print("\n" + "="*60)
            print("✅ All examples completed successfully!")
            print("="*60)
            
        except Exception as e:
            print(f"\n❌ Error running examples: {str(e)}")
            import traceback
            traceback.print_exc()
