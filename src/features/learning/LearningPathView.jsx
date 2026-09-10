import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useLearningPath } from '../../hooks/useLearningPath';
import { setSelectedNodeId } from './learningSlice';
import { setActiveTab } from '../user/userSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
  ListFilter
} from 'lucide-react';

// Custom React Flow Concept Node Component
function CustomConceptNode({ data }) {
  const { node, isSelected, isCurrent, onClick } = data;
  const isMastered = node.status === 'mastered';
  const isKnown = node.status === 'known';
  const isLocked = node.status === 'locked';

  return (
    <div
      onClick={() => !isLocked && onClick(node.concept_id)}
      className={`p-4 rounded-2xl border transition-all duration-200 min-w-[220px] shadow-sm ${
        isLocked ? 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isSelected
          ? 'bg-brand-50/90 border-brand-500 ring-2 ring-brand-500/30 shadow-md scale-[1.02]'
          : 'bg-white border-surface-variant hover:border-brand-300 hover:shadow-md'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-brand-600 !w-3 !h-3" />
      
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
            isMastered
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : isKnown
              ? 'bg-teal-100 text-teal-700 border border-teal-300'
              : isCurrent
              ? 'gradient-btn text-white shadow-glow animate-pulse'
              : isLocked
              ? 'bg-gray-100 text-gray-400 border border-gray-200'
              : 'bg-brand-100 text-brand-700 border border-brand-200'
          }`}
        >
          {isMastered || isKnown ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : isLocked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="min-w-0">
          <div className="font-bold text-xs text-ink-primary truncate">{node.title}</div>
          <div className="text-[10px] text-ink-muted capitalize">{node.level} • {node.estimated_minutes}m</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-surface-variant/60">
        <span className={`px-2 py-0.5 rounded-md font-semibold ${
          isMastered || isKnown ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-brand-700'
        }`}>
          {node.status.toUpperCase()}
        </span>
        {isCurrent && <span className="text-brand-600 font-bold flex items-center gap-0.5">● Active Node</span>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-brand-600 !w-3 !h-3" />
    </div>
  );
}

export function LearningPathView() {
  const dispatch = useDispatch();
  const { nodes = [], selectedNodeId, currentNodeId } = useSelector((state) => state.learning);
  const { activeTopic } = useSelector((state) => state.user);
  const { refetch, generatePath, isGenerating } = useLearningPath();
  const [viewMode, setViewMode] = useState('flow'); // 'flow' | 'list'

  const selectedNode = nodes.find((n) => n.concept_id === selectedNodeId) || nodes[0];

  const handleStartNode = (conceptId) => {
    dispatch(setSelectedNodeId(conceptId));
    dispatch(setActiveTab('workspace'));
  };

  const masteredCount = nodes.filter((n) => n.status === 'mastered' || n.status === 'known').length;
  const progressPercent = nodes.length > 0 ? Math.round((masteredCount / nodes.length) * 100) : 0;

  // React Flow Nodes & Edges construction
  const nodeTypes = useMemo(() => ({ conceptNode: CustomConceptNode }), []);

  const flowNodes = useMemo(() => {
    return nodes.map((node, idx) => ({
      id: node.concept_id,
      type: 'conceptNode',
      position: { x: 220 + (idx % 2 === 0 ? 0 : 60), y: idx * 150 + 30 },
      data: {
        node,
        isSelected: node.concept_id === selectedNodeId,
        isCurrent: node.concept_id === currentNodeId,
        onClick: (id) => dispatch(setSelectedNodeId(id)),
      },
    }));
  }, [nodes, selectedNodeId, currentNodeId, dispatch]);

  const flowEdges = useMemo(() => {
    const edges = [];
    nodes.forEach((node) => {
      if (node.depends_on && node.depends_on.length > 0) {
        node.depends_on.forEach((parentConceptId) => {
          edges.push({
            id: `e-${parentConceptId}-${node.concept_id}`,
            source: parentConceptId,
            target: node.concept_id,
            animated: true,
            type: 'smoothstep',
            style: { stroke: '#6750a4', strokeWidth: 2.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#6750a4',
            },
          });
        });
      }
    });
    return edges;
  }, [nodes]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-surface-variant shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" className="capitalize">
              {activeTopic} Roadmap
            </Badge>
            <Badge variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              React Flow DAG Layout
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-ink-primary tracking-tight">Your Adaptive Learning Path</h2>
          <p className="text-xs text-ink-muted">
            Interactive React Flow dependency graph. Select any concept node to enter the learning workspace.
          </p>
        </div>

        <div className="w-full md:w-72 space-y-2">
          <ProgressBar progress={progressPercent} showLabel />
          <div className="text-[11px] text-ink-muted text-right">
            {masteredCount} of {nodes.length} Concepts Mastered
          </div>
        </div>
      </div>

      {/* View Switcher & Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-surface-container/70 p-1 rounded-xl border border-surface-variant">
          <button
            onClick={() => setViewMode('flow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'flow' ? 'bg-white text-brand-700 shadow-sm border border-brand-200' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            React Flow Graph
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-brand-700 shadow-sm border border-brand-200' : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Sequence List
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => generatePath()}
            isLoading={isGenerating}
            size="sm"
            className="text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-Generate Path
          </Button>
        </div>
      </div>

      {/* Main Roadmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: React Flow Graph Canvas or Sequence List */}
        <div className="lg:col-span-2">
          {viewMode === 'flow' ? (
            <div className="w-full h-[540px] bg-white rounded-2xl border border-surface-variant shadow-subtle overflow-hidden relative">
              {flowNodes.length > 0 ? (
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  attributionPosition="bottom-left"
                >
                  <Background color="#e2d9f3" gap={20} size={1} />
                  <Controls className="!bg-white !border-surface-variant !shadow-sm !rounded-xl" />
                </ReactFlow>
              ) : (
                <div className="flex items-center justify-center h-full text-ink-muted text-xs">
                  Loading React Flow Canvas...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {nodes.map((node, index) => {
                const isSelected = node.concept_id === selectedNodeId;
                const isCurrent = node.concept_id === currentNodeId;
                const isMastered = node.status === 'mastered';
                const isKnown = node.status === 'known';
                const isLocked = node.status === 'locked';

                return (
                  <div
                    key={node.concept_id}
                    onClick={() => !isLocked && dispatch(setSelectedNodeId(node.concept_id))}
                    className={`group relative p-5 rounded-2xl border transition-all duration-200 ${
                      isLocked ? 'opacity-60 bg-gray-50/70 border-gray-200 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? 'bg-brand-50/50 border-brand-400 ring-2 ring-brand-500/20 shadow-md'
                        : 'bg-white border-surface-variant hover:border-brand-300 hover:shadow-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isMastered
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : isKnown
                              ? 'bg-teal-100 text-teal-700 border border-teal-300'
                              : isCurrent
                              ? 'gradient-btn text-white shadow-glow animate-pulse'
                              : isLocked
                              ? 'bg-gray-100 text-gray-400 border border-gray-200'
                              : 'bg-brand-100 text-brand-700 border border-brand-200'
                          }`}
                        >
                          {isMastered || isKnown ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-ink-primary group-hover:text-brand-700 transition-colors">
                              {node.title}
                            </h4>
                            {isKnown && <Badge variant="success" size="sm">Skipped (Known)</Badge>}
                            {isCurrent && <Badge variant="ai" size="sm">Active Node</Badge>}
                          </div>
                          <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{node.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex text-xs text-ink-muted font-medium items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {node.estimated_minutes} min
                        </span>
                        {!isLocked && (
                          <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-brand-600 translate-x-0.5' : 'text-ink-muted'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Node Details Card */}
        <div>
          {selectedNode ? (
            <Card className="sticky top-24 space-y-5 border-brand-200 shadow-md">
              <div className="flex items-center justify-between border-b border-surface-variant pb-3">
                <Badge variant={selectedNode.status === 'mastered' ? 'success' : 'primary'} size="sm">
                  {selectedNode.level?.toUpperCase() || 'BEGINNER'} CONCEPT
                </Badge>
                <span className="text-xs text-ink-muted flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  ~{selectedNode.estimated_minutes} minutes
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-ink-primary mb-2">{selectedNode.title}</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">{selectedNode.description}</p>
              </div>

              {/* Node Prerequisite dependencies */}
              {selectedNode.depends_on && selectedNode.depends_on.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-brand-600" /> Prerequisites Needed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.depends_on.map((dep) => (
                      <span key={dep} className="text-xs bg-surface-container text-ink-primary px-2.5 py-1 rounded-lg border border-surface-variant font-medium">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={() => handleStartNode(selectedNode.concept_id)}
                size="lg"
                className="w-full shadow-md font-bold"
              >
                <Play className="w-4 h-4 fill-white" />
                Enter Learning Workspace
              </Button>
            </Card>
          ) : (
            <Card className="text-center py-12 text-ink-muted text-sm">Select a concept node to view details</Card>
          )}
        </div>
      </div>
    </div>
  );
}
