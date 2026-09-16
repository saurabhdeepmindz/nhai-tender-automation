#!/bin/bash
# ============================================================================
# NHAI Tender Query Automation System
# Python RAG Services - Automated Installation Script (Linux/macOS)
# ============================================================================
# 
# This script automates the installation of Python dependencies
# for both Screen 7 and Screen 8
#
# Usage: ./install-python-deps.sh
# Make executable: chmod +x install-python-deps.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}NHAI Python RAG Services - Automated Installation${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Python is installed
echo "[1/7] Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    PIP_CMD=pip3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
    PIP_CMD=pip
else
    print_error "Python is not installed"
    echo "Please install Python 3.10 or higher:"
    echo "  Ubuntu/Debian: sudo apt install python3.11"
    echo "  macOS: brew install python@3.11"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version | awk '{print $2}')
print_success "Python version: $PYTHON_VERSION"

# Check Python version (should be 3.10+)
MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$MAJOR" -lt 3 ] || ([ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 10 ]); then
    print_error "Python version must be 3.10 or higher"
    echo "Current version: $PYTHON_VERSION"
    exit 1
fi

echo ""
echo "[2/7] Setting up virtual environment..."
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

echo ""
echo "[3/7] Upgrading pip..."
$PYTHON_CMD -m pip install --upgrade pip
print_success "pip upgraded"

echo ""
echo "[4/7] Installing Python dependencies..."
print_info "This may take 5-10 minutes depending on your internet connection..."
echo ""

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    print_error "requirements.txt not found in current directory"
    echo "Please run this script from the python-rag folder"
    exit 1
fi

# Install dependencies
print_info "Installing packages from requirements.txt..."
if $PYTHON_CMD -m pip install -r requirements.txt; then
    print_success "All dependencies installed successfully"
else
    echo ""
    print_warning "Failed to install dependencies"
    print_info "Trying minimal installation instead..."
    
    if [ -f "requirements-minimal.txt" ]; then
        if $PYTHON_CMD -m pip install -r requirements-minimal.txt; then
            print_success "Minimal installation completed successfully"
        else
            print_error "Minimal installation also failed"
            echo "Please check the error messages above"
            exit 1
        fi
    else
        print_error "requirements-minimal.txt not found"
        exit 1
    fi
fi

echo ""
echo "[5/7] Verifying installation..."

# Test critical imports
IMPORT_FAILED=0

echo -n "Testing FastAPI... "
if $PYTHON_CMD -c "import fastapi" 2>/dev/null; then
    print_success "FastAPI"
else
    print_error "FastAPI import failed"
    IMPORT_FAILED=1
fi

echo -n "Testing LangChain... "
if $PYTHON_CMD -c "import langchain" 2>/dev/null; then
    print_success "LangChain"
else
    print_error "LangChain import failed"
    IMPORT_FAILED=1
fi

echo -n "Testing ChromaDB... "
if $PYTHON_CMD -c "import chromadb" 2>/dev/null; then
    print_success "ChromaDB"
else
    print_error "ChromaDB import failed"
    IMPORT_FAILED=1
fi

echo -n "Testing OpenAI... "
if $PYTHON_CMD -c "import openai" 2>/dev/null; then
    print_success "OpenAI"
else
    print_error "OpenAI import failed"
    IMPORT_FAILED=1
fi

echo -n "Testing Ollama... "
if $PYTHON_CMD -c "import ollama" 2>/dev/null; then
    print_success "Ollama"
else
    print_error "Ollama import failed"
    IMPORT_FAILED=1
fi

if [ $IMPORT_FAILED -eq 1 ]; then
    echo ""
    print_warning "Some imports failed. Please check the errors above."
    echo "You may need to reinstall specific packages."
else
    echo ""
    print_success "All critical packages verified successfully!"
fi

echo ""
echo "[6/7] Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    print_success "Ollama is installed"
    
    # Check if models are downloaded
    print_info "Checking Ollama models..."
    
    if ollama list | grep -q "nomic-embed-text"; then
        print_success "nomic-embed-text model available"
    else
        print_info "Downloading nomic-embed-text model..."
        ollama pull nomic-embed-text
        print_success "nomic-embed-text model downloaded"
    fi
    
    if ollama list | grep -q "llama3"; then
        print_success "llama3 model available"
    else
        print_info "Downloading llama3 model (this may take a few minutes)..."
        ollama pull llama3
        print_success "llama3 model downloaded"
    fi
else
    print_warning "Ollama is not installed"
    echo ""
    echo "To use local LLM inference, install Ollama:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  macOS: brew install ollama"
    else
        echo "  Linux: curl -fsSL https://ollama.ai/install.sh | sh"
    fi
    echo ""
    echo "Then run:"
    echo "  ollama pull nomic-embed-text"
    echo "  ollama pull llama3"
    echo ""
fi

echo ""
echo "[7/7] Creating .env files if they don't exist..."

# Screen 7
if [ -d "screen07-history-retriever" ]; then
    if [ ! -f "screen07-history-retriever/.env" ]; then
        if [ -f "screen07-history-retriever/.env.example" ]; then
            cp "screen07-history-retriever/.env.example" "screen07-history-retriever/.env"
            print_success "Created screen07-history-retriever/.env"
        fi
    else
        print_info "screen07-history-retriever/.env already exists"
    fi
else
    print_warning "screen07-history-retriever folder not found"
fi

# Screen 8
if [ -d "screen08-chief-engineer" ]; then
    if [ ! -f "screen08-chief-engineer/.env" ]; then
        if [ -f "screen08-chief-engineer/.env.example" ]; then
            cp "screen08-chief-engineer/.env.example" "screen08-chief-engineer/.env"
            print_success "Created screen08-chief-engineer/.env"
        fi
    else
        print_info "screen08-chief-engineer/.env already exists"
    fi
else
    print_warning "screen08-chief-engineer folder not found"
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "Installed packages:"
$PYTHON_CMD -m pip list | grep -E "fastapi|langchain|chromadb|openai|ollama"

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Configure .env files:"
echo "   - screen07-history-retriever/.env"
echo "   - screen08-chief-engineer/.env"
echo ""
echo "3. Start Screen 7:"
echo "   cd screen07-history-retriever"
echo "   python main.py"
echo ""
echo "4. Start Screen 8 (in new terminal):"
echo "   cd screen08-chief-engineer"
echo "   python main.py"
echo ""
echo "5. Test services:"
echo "   curl http://localhost:8000/api/health"
echo "   curl http://localhost:8001/api/health"
echo ""
echo "For detailed instructions, see PYTHON_SETUP_GUIDE.md"
echo ""
echo -e "${BLUE}============================================================================${NC}"
