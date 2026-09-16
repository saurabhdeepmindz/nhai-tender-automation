#!/bin/bash
# NHAI Demo Quick Start - Bash version for WSL/Linux

echo "====================================================================="
echo "NHAI Tender Automation - DEMO STARTUP (WSL/Linux)"
echo "====================================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the NHAI-TENDER-AUTOMATION folder"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Start Backend
echo -e "${CYAN}[1/2] Starting NestJS Backend on port 3001...${NC}"
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 5

# Start Screen 8 (Python)
echo ""
echo -e "${CYAN}[2/2] Starting Python Screen 8 (Chief Engineer) on port 8001...${NC}"
cd python-rag/screen08-chief-engineer
python main.py &
SCREEN8_PID=$!
cd ../..

sleep 3

echo ""
echo -e "${GREEN}====================================================================="
echo "Services Started!"
echo "=====================================================================${NC}"
echo ""
echo -e "${CYAN}Backend PID: ${BACKEND_PID}${NC}"
echo -e "${CYAN}Screen 8 PID: ${SCREEN8_PID}${NC}"
echo ""
echo -e "${GREEN}URLs:${NC}"
echo -e "  ${YELLOW}Frontend: http://localhost:3000${NC}"
echo -e "  ${YELLOW}Backend API: http://localhost:3001${NC}"
echo -e "  ${YELLOW}Screen 8: http://localhost:8001${NC}"
echo ""
echo -e "${GREEN}Demo Page:${NC}"
echo -e "  ${YELLOW}http://localhost:3000/admin/prebid-queries${NC}"
echo ""
echo -e "${CYAN}To stop services, kill the processes:${NC}"
echo -e "  ${YELLOW}kill $BACKEND_PID${NC}"
echo -e "  ${YELLOW}kill $SCREEN8_PID${NC}"
echo ""

# Keep running
wait
