# Sentence Tree Infrastructure Changes

## Overview

The narrative writing system has been upgraded from a simple array-based sentence tracking to a sophisticated tree-based structure that supports branched narratives, revision tracking, and temporal metadata.

## Data Structure Changes

### Before (Simple Array)
```typescript
const [completedSentences, setCompletedSentences] = useState<string[]>([]);
```

### After (Tree Structure)
```typescript
interface SentenceNode {
  id: string;                    // unique identifier
  content: string;               // the actual sentence text
  domOrder: number;              // position in current DOM
  parent: string | null;         // parent sentence id
  children: string[];            // array of child sentence ids
  prevSiblings: string[];        // previous sibling sentence ids
  nextSiblings: string[];        // next sibling sentence ids
  createdTime: number;           // system timestamp when first created
  revisedTime: number;           // system timestamp when last modified
  editCount: number;             // number of times edited
  isCompleted: boolean;          // completion status
  metadata?: {                   // extensible metadata
    confidence?: number;
    analysisResult?: any;
    [key: string]: any;
  };
}

const [sentenceNodes, setSentenceNodes] = useState<Map<string, SentenceNode>>(new Map());
const [activePath, setActivePath] = useState<string[]>([]);
```

## Key Benefits

### 1. Branching Support
- **Parent-Child Relationships**: Track when a sentence spawns alternative versions
- **Sibling Management**: Maintain order relationships between alternative sentences
- **Path Tracking**: Know which "branch" of the narrative is currently active

### 2. Temporal Tracking
- **Creation Time**: When was this sentence first written?
- **Revision Time**: When was it last modified?
- **Edit Count**: How many times has it been edited?

### 3. Revision History
- **Content Preservation**: Keep old versions as separate nodes
- **Relationship Tracking**: Understand how sentences evolved
- **Edit Analysis**: Analyze writing patterns and revision behavior

## Infrastructure Impact

### ✅ Minimal Breaking Changes
The changes are designed to be **backward compatible**:

1. **Legacy Support**: `completedSentences` is computed from the tree structure
2. **Same API**: Existing components continue to work
3. **Gradual Migration**: Can add branching features incrementally

### 🔄 Enhanced Capabilities
New functions added without breaking existing code:

```typescript
// Tree Management
createSentenceNode(content, parent, domOrder)
updateSentenceContent(nodeId, newContent)
markSentenceCompleted(nodeId, completed, metadata)
addSentenceRelationship(parentId, childId)

// Analysis Tools
getSentenceTreeStats()
exportSentenceTree()
findSentencePath(targetId)
getSentenceChildren(nodeId, deep)
```

## Use Cases Enabled

### 1. Alternative Phrasings
```
"The data shows an upward trend." 
├── "The data demonstrates a clear upward trend."
├── "The results indicate an increasing pattern."
└── "We observe a positive trajectory in the data."
```

### 2. Narrative Branching
```
"Based on this analysis..."
├── "...we recommend increasing the budget."
└── "...we suggest further investigation."
```

### 3. Iterative Refinement
```
Original: "The chart shows something interesting."
Rev 1:    "The chart shows a significant pattern."
Rev 2:    "The chart reveals a significant correlation."
Rev 3:    "The visualization reveals a strong correlation between variables."
```

## Implementation Strategy

### Phase 1: ✅ Core Infrastructure
- [x] SentenceNode interface definition
- [x] Tree management functions
- [x] DOM-based sentence extraction
- [x] Backward compatibility layer

### Phase 2: 🔄 Enhanced Detection
- [ ] Detect sentence modifications vs. new sentences
- [ ] Automatic parent-child relationship detection
- [ ] Branch point identification

### Phase 3: 🔮 Advanced Features
- [ ] Visual tree representation
- [ ] Branch comparison tools
- [ ] Revision history UI
- [ ] Analytics dashboard

## Migration Notes

### For Developers
- Existing code using `completedSentences` continues to work
- Access to new tree features through `sentenceNodes` and helper functions
- Debug information available via `exportSentenceTree()`

### For Users
- No change in writing experience
- Future features will leverage the branching capabilities
- Enhanced analytics and insights possible

## Example Usage

```typescript
// Access traditional sentence list (backward compatible)
console.log('Completed sentences:', completedSentences);

// Access full tree structure (new capabilities)
console.log('Tree stats:', getSentenceTreeStats());
console.log('Full tree:', exportSentenceTree());

// Find relationships
const nodeId = activePath[0];
const children = getSentenceChildren(nodeId);
const path = findSentencePath(nodeId);
```

This infrastructure change enables sophisticated narrative analysis while maintaining compatibility with existing functionality.
