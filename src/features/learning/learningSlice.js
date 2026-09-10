import { createSlice } from '@reduxjs/toolkit';

const formatTitle = (conceptId) => {
  if (!conceptId) return 'Concept Node';
  return conceptId
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const DEFAULT_DESCRIPTIONS = {
  fundamentals: 'Core fundamentals, basic syntax, and foundational primitives.',
  core_concepts: 'Essential core concepts, component structures, and design principles.',
  state_management: 'State flow, data lifecycle, side-effects, and reactive data management.',
  advanced_patterns: 'Advanced design patterns, architectural abstractions, and async flows.',
  optimization: 'Performance optimization, memory efficiency, and enterprise scalability.',
};

const initialState = {
  pathId: null,
  currentNodeId: null,
  selectedNodeId: null,
  nodes: [],
};

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    setLearningPath: (state, action) => {
      if (!action.payload) return;
      const rawNodes = action.payload.nodes || [];
      const topic = action.payload.topic || 'learning';

      const normalizedNodes = rawNodes.map((node) => {
        const title = node.title || formatTitle(node.concept_id);
        const description = node.description || DEFAULT_DESCRIPTIONS[node.concept_id] || `Mastering ${title} in ${topic}.`;
        return {
          ...node,
          title,
          description,
          status: node.status || 'learning',
          estimated_minutes: node.estimated_minutes || 20,
          depends_on: node.depends_on || [],
        };
      });

      state.pathId = action.payload._id;
      state.currentNodeId = action.payload.current_node || (normalizedNodes[0]?.concept_id || null);
      state.selectedNodeId = state.selectedNodeId || state.currentNodeId || (normalizedNodes[0]?.concept_id || null);
      state.nodes = normalizedNodes;
    },
    setSelectedNodeId: (state, action) => {
      state.selectedNodeId = action.payload;
    },
    updateNodeStatus: (state, action) => {
      const { conceptId, status, masteryScore } = action.payload;
      const node = state.nodes.find(n => n.concept_id === conceptId);
      if (node) {
        node.status = status;
        if (masteryScore !== undefined) node.mastery_score = masteryScore;
      }
    },
  },
});

export const { setLearningPath, setSelectedNodeId, updateNodeStatus } = learningSlice.actions;
export default learningSlice.reducer;
