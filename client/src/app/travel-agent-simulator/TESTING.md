# Travel Agent Simulator - Testing Instructions

## 🚀 How to Test the Demo

### Step 1: Access the Demo
With your Next.js dev server running (`npm run dev`), navigate to:
**http://localhost:3000/travel-agent-simulator**

### Step 2: Generate Demo Data
1. Click the **"🚀 Generate Demo Data"** button
2. Wait 12-15 minutes while the system:
   - Initializes 5 AI agents (Line, Bar, Pie, Scatter, MultiType)
   - Generates 12 different travel charts using GPT-4
   - Creates realistic travel data and insights
   - Saves results to `demo_output.json`

### Step 3: Review Generated Charts
Once generation completes, you'll see:
- **12 Interactive Charts**: Line trends, bar comparisons, pie distributions, scatter relationships, multi-type combinations
- **AI Insights**: GPT-4 generated descriptions and recommendations
- **Performance Stats**: Generation times and success rates
- **Auto-Detection Tests**: Natural language chart type suggestions

### Step 4: Test Features
- **Regenerate Button**: Click to generate fresh data
- **Chart Interactions**: Hover over charts for detailed tooltips
- **System Info**: View agent performance and statistics
- **Auto-Detection**: See how queries map to chart types

## 📁 Generated Files
- `demo_output.json`: Contains all chart data for static testing
- Console logs show real-time generation progress

## 🔧 API Endpoint
The generation process uses: `POST /api/generate-demo`
- Calls OpenAI GPT-4 with travel-specific prompts
- Generates realistic data for 135+ destinations
- Creates Vega-Lite specifications for rendering

## ⚡ Quick Testing
For faster testing, you can:
1. Generate demo data once
2. Reload the page to use cached `demo_output.json`
3. Click "Regenerate" only when you want fresh AI content

## 🎯 What to Look For
- **Chart Variety**: 5 different chart types with appropriate data
- **AI Quality**: Realistic travel data, insights, and recommendations
- **Integration**: Seamless SpecCreator and ReusableNode rendering
- **Performance**: Sub-60 second generation times per chart
- **Error Handling**: Graceful failures with retry options

The demo showcases a complete AI-powered visualization generation system ready for production use!