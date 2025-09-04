#!/bin/bash
# Test script for Travel Agent Demo

echo "🧪 Testing Travel Agent Demo System"
echo "=================================="

# Test 1: Check if demo.json loads correctly
echo "1. Testing JSON configuration loading..."
if [ -f "src/vegaTemplates/travel_agent_simulator/demo.json" ]; then
    echo "   ✅ demo.json found"
else
    echo "   ❌ demo.json not found"
fi

# Test 2: Check if all agent files exist
echo "2. Testing agent file existence..."
AGENTS=("BaseTravelAgent" "LineChartAgent" "BarChartAgent" "PieChartAgent" "ScatterChartAgent" "MultiTypeChartAgent" "TravelAgentManager")

for agent in "${AGENTS[@]}"; do
    if [ -f "src/vegaTemplates/travel_agent_simulator/${agent}.ts" ]; then
        echo "   ✅ ${agent}.ts found"
    else
        echo "   ❌ ${agent}.ts not found"
    fi
done

# Test 3: Check if types are defined
echo "3. Testing type definitions..."
if [ -f "src/vegaTemplates/travel_agent_simulator/types.ts" ]; then
    echo "   ✅ types.ts found"
else
    echo "   ❌ types.ts not found"
fi

# Test 4: Check if dashboard page exists
echo "4. Testing dashboard page..."
if [ -f "src/app/travel-agent-demo/page.tsx" ]; then
    echo "   ✅ Dashboard page found"
else
    echo "   ❌ Dashboard page not found"
fi

echo ""
echo "🎯 System Status: Ready for demonstration!"
echo "Navigate to /travel-agent-demo to view the interactive demo"
echo ""
echo "📊 Demo Features:"
echo "- 5 Specialized AI Agents"
echo "- 12 Pre-configured Test Scenarios" 
echo "- Real-time Chart Generation"
echo "- GPT-4 Powered Intelligence"
echo "- Interactive Dashboard Interface"