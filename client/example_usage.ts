// Example usage of getActivePathBeforeNode function
import { getActivePathBeforeNode } from './src/app/components/ReactFlowTimeline';

// Example data structure
const exampleNodes = [
  { sentence_id: 'node1', sentence_content: 'The stock market showed strong performance in Q1.' },
  { sentence_id: 'node2', sentence_content: 'Tech stocks led the gains with Apple rising 15%.' },
  { sentence_id: 'node3', sentence_content: 'Healthcare sector also performed well this quarter.' },
  { sentence_id: 'node4', sentence_content: 'Microsoft announced new AI features for Office.' },
  { sentence_id: 'node5', sentence_content: 'The earnings reports exceeded analyst expectations.' },
];

// Example active path (sequence of visited nodes)
const exampleActivePath = ['node1', 'node2', 'node4', 'node5'];

// Example 1: Get path before node4 (Microsoft announcement)
const pathBeforeNode4 = getActivePathBeforeNode('node4', exampleActivePath, exampleNodes);
console.log('Path before node4:', pathBeforeNode4);
// Output: [
//   'The stock market showed strong performance in Q1.',
//   'Tech stocks led the gains with Apple rising 15%.'
// ]

// Example 2: Get path before node1 (first node)
const pathBeforeNode1 = getActivePathBeforeNode('node1', exampleActivePath, exampleNodes);
console.log('Path before node1:', pathBeforeNode1);
// Output: [] (empty array since it's the first node)

// Example 3: Get path before node3 (not in active path)
const pathBeforeNode3 = getActivePathBeforeNode('node3', exampleActivePath, exampleNodes);
console.log('Path before node3 (not in active path):', pathBeforeNode3);
// Output: [
//   'The stock market showed strong performance in Q1.',
//   'Tech stocks led the gains with Apple rising 15%.',
//   'Microsoft announced new AI features for Office.',
//   'The earnings reports exceeded analyst expectations.'
// ] (returns entire active path since node3 is not in the active path)

// Example 4: Get path before last node
const pathBeforeNode5 = getActivePathBeforeNode('node5', exampleActivePath, exampleNodes);
console.log('Path before node5 (last node):', pathBeforeNode5);
// Output: [
//   'The stock market showed strong performance in Q1.',
//   'Tech stocks led the gains with Apple rising 15%.',
//   'Microsoft announced new AI features for Office.'
// ]

export { exampleNodes, exampleActivePath };
