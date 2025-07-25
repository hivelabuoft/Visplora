# Manual Interaction Logger Usage Guide

## Overview
The new `interactionLogger` allows you to manually track specific user interactions instead of automatically tracking everything. This gives you precise control over what gets logged.

## Setup

### 1. Import the logger
```typescript
import { interactionLogger } from '../../lib/interactionLogger';
```

### 2. Initialize the logger (already done in narrative page)
```typescript
interactionLogger.initialize({
  userId: userSession.userId,
  participantId: userSession.participantId,
  sessionId: userSession.sessionId
}, isStudyMode);
```

## Usage Examples

### 1. Log Button Clicks
```typescript
// Simple button click
await interactionLogger.logButtonClick('submit_button', 'Submit Form');

// Button click with additional data
await interactionLogger.logButtonClick('filter_button', 'Apply Filter', {
  filterType: 'date',
  filterValue: '2024-01-01'
});
```

### 2. Log Dashboard Generation (already implemented)
```typescript
await interactionLogger.logDashboardGeneration(prompt);
```

### 3. Log View Changes
```typescript
await interactionLogger.logViewChange('dataset_explorer', 'narrative_layer');
```

### 4. Log Form Submissions
```typescript
await interactionLogger.logFormSubmission('user_preferences', {
  theme: 'dark',
  language: 'en',
  notifications: true
});
```

### 5. Log Custom Events
```typescript
await interactionLogger.logCustomEvent('user_scroll', {
  scrollPosition: window.scrollY,
  elementId: 'main_content',
  direction: 'down'
});
```

### 6. Advanced Custom Logging
```typescript
await interactionLogger.logInteraction({
  eventType: 'click',
  action: 'chart_interaction',
  target: {
    type: 'chart',
    id: 'bar_chart_1',
    name: 'Population Chart',
    position: { x: 100, y: 200 }
  },
  context: {
    currentView: 'dashboard',
    nodeCount: 5,
    connectionCount: 3
  },
  timing: {
    responseTime: Date.now(),
    duration: 1500
  },
  metadata: {
    chartType: 'bar',
    dataPoints: 10,
    selectedBars: [1, 3, 5]
  }
});
```

## Real-World Examples

### Example 1: Track Dataset Selection
```typescript
const handleDatasetSelect = async (datasetId: string, datasetName: string) => {
  // Your existing logic here
  setSelectedDataset(datasetId);
  
  // Log the interaction
  await interactionLogger.logButtonClick(`dataset_${datasetId}`, `Select Dataset: ${datasetName}`, {
    datasetId,
    datasetName,
    category: getDatasetCategory(datasetId)
  });
};
```

### Example 2: Track Prompt Input
```typescript
const handlePromptSubmit = async (prompt: string) => {
  // Your existing logic here
  await processPrompt(prompt);
  
  // Log the interaction
  await interactionLogger.logCustomEvent('prompt_submitted', {
    prompt,
    promptLength: prompt.length,
    wordCount: prompt.split(' ').length,
    containsQuestion: prompt.includes('?')
  });
};
```

### Example 3: Track Chart Interactions
```typescript
const handleChartClick = async (chartElement: any, chartData: any) => {
  // Your existing logic here
  highlightChartElement(chartElement);
  
  // Log the interaction
  await interactionLogger.logInteraction({
    eventType: 'click',
    action: 'chart_element_clicked',
    target: {
      type: 'chart',
      id: chartElement.id,
      name: chartElement.name,
      position: { x: chartElement.x, y: chartElement.y }
    },
    metadata: {
      chartType: chartData.type,
      elementValue: chartElement.value,
      elementIndex: chartElement.index
    }
  });
};
```

## Utility Functions

### Check if logging is enabled
```typescript
if (interactionLogger.isLoggingEnabled()) {
  // Only log if study mode is active
  await interactionLogger.logButtonClick('optional_button', 'Optional Action');
}
```

### Get current user context
```typescript
const userContext = interactionLogger.getUserContext();
if (userContext) {
  console.log(`Logging for participant: ${userContext.participantId}`);
}
```

## Key Benefits

1. **Selective Tracking**: Only track what matters for your study
2. **Clean Data**: No noise from unimportant interactions
3. **Custom Metadata**: Add specific context for each interaction
4. **Performance**: Reduced overhead compared to tracking everything
5. **Control**: Easy to enable/disable logging for specific actions

## Best Practices

1. **Be Consistent**: Use similar naming conventions for similar actions
2. **Add Context**: Include relevant metadata that helps analysis
3. **Use Convenience Methods**: Use `logButtonClick()` for simple cases
4. **Handle Errors**: The logger handles errors gracefully, but check console for warnings
5. **Test in Dev**: Logging works in both dev and production, but only saves in study mode

## Migration from userStudyTracker

The old `userStudyTracker` was automatic and tracked everything. The new `interactionLogger` is manual and selective:

**Old way (automatic):**
```typescript
// This tracked ALL interactions automatically
userStudyTracker.initializeSession(context);
```

**New way (manual):**
```typescript
// Initialize once
interactionLogger.initialize(userContext, isStudyMode);

// Log specific events manually
await interactionLogger.logButtonClick('my_button', 'My Button');
```

## Data Storage

All logged interactions are still stored in the same MongoDB collection (`interactionlogs`) with the same structure, so your existing analysis tools will continue to work.
