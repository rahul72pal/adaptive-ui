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
  currentLevel: 'beginner',
  targetLevel: 'expert',
  completedLevels: [],
  availableNodes: [],
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
      const rawNodes = action.payload.nodes;
      const topic = action.payload.topic || 'learning';

      if (rawNodes && Array.isArray(rawNodes) && rawNodes.length > 0) {
        const normalizedNodes = rawNodes.map((node) => {
          const cid = node.concept_id || node.id;
          const title = node.title || formatTitle(cid);
          const description = node.description || DEFAULT_DESCRIPTIONS[cid] || `Mastering ${title} in ${topic}.`;
          return {
            ...node,
            concept_id: cid,
            title,
            description,
            level: node.level || action.payload.current_level || 'beginner',
            node_type: node.node_type || (node.type === 'practice' ? 'practice' : 'learning'),
            status: node.status || 'learning',
            estimated_minutes: node.estimated_minutes || 15,
            target_question_count: node.target_question_count || 5,
            depends_on: node.depends_on || [],
          };
        });
        state.nodes = normalizedNodes;
      }

      if (action.payload._id) state.pathId = action.payload._id;
      if (action.payload.current_level) state.currentLevel = action.payload.current_level;
      if (action.payload.target_level) state.targetLevel = action.payload.target_level;
      if (action.payload.completed_levels) state.completedLevels = action.payload.completed_levels;
      if (action.payload.available_nodes) state.availableNodes = action.payload.available_nodes;
      if (action.payload.current_node) state.currentNodeId = action.payload.current_node;

      if (!state.selectedNodeId && state.currentNodeId) {
        state.selectedNodeId = state.currentNodeId;
      }
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

      // Automatically unlock downstream nodes whose dependencies are satisfied
      const completedSet = new Set(
        state.nodes.filter(n => n.status === 'known' || n.status === 'mastered' || n.status === 'skipped').map(n => n.concept_id)
      );

      state.nodes.forEach(n => {
        if (n.status === 'locked') {
          const deps = n.depends_on || [];
          if (deps.length === 0 || deps.every(depId => completedSet.has(depId))) {
            n.status = 'learning';
          }
        }
      });

      // Recalculate available nodes
      state.availableNodes = state.nodes
        .filter(n => n.status === 'learning' || n.status === 'partial')
        .map(n => n.concept_id);
    },
    resetLearningPath: (state) => {
      state.pathId = null;
      state.currentLevel = 'beginner';
      state.targetLevel = 'expert';
      state.completedLevels = [];
      state.availableNodes = [];
      state.currentNodeId = null;
      state.selectedNodeId = null;
      state.nodes = [];
    }
  },
});

export const { setLearningPath, setSelectedNodeId, updateNodeStatus, resetLearningPath } = learningSlice.actions;
export default learningSlice.reducer;

