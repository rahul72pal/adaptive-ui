import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useLearningPath } from '../../hooks/useLearningPath';
import { setSelectedNodeId } from './learningSlice';
import { setActiveTab } from '../user/userSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Zap,
  Trophy,
  ChevronRight,
  ListOrdered
} from 'lucide-react';

export function LearningPathView() {
  const dispatch = useDispatch();
  const { pathId, nodes = [], selectedNodeId, currentNodeId, currentLevel } = useSelector((state) => state.learning);
  const { activeTopic } = useSelector((state) => state.user);
  const { generatePath, completeLevel, isGenerating, isCompletingLevel, isLoading } = useLearningPath();

  const selectedNode = nodes.find((n) => n.concept_id === selectedNodeId) || nodes[0];

  const handleStartNode = (conceptId) => {
    dispatch(setSelectedNodeId(conceptId));
    dispatch(setActiveTab('workspace'));
  };

  const masteredCount = nodes.filter((n) => n.status === 'mastered' || n.status === 'known').length;
  const progressPercent = nodes.length > 0 ? Math.round((masteredCount / nodes.length) * 100) : 0;

  // Check level completion
  const currentLevelName = (currentLevel || 'beginner').toLowerCase();
  const allNodesCompleted = nodes.length > 0 && nodes.every((n) => ['mastered', 'known', 'skipped'].includes(n.status));
  const currentLevelNodes = nodes.filter((n) => (n.level || 'beginner').toLowerCase() === currentLevelName);
  const isCurrentLevelCompleted = currentLevelNodes.length > 0 && currentLevelNodes.every((n) => ['mastered', 'known', 'skipped'].includes(n.status));
  const canProgressToNextLevel = (allNodesCompleted || isCurrentLevelCompleted) && currentLevelName !== 'expert';
  const nextLevelTitle = currentLevelName === 'beginner' ? 'Intermediate' : currentLevelName === 'intermediate' ? 'Advanced' : 'Expert';

  return (
    <div className="max-w-[1440px] w-full mx-auto py-4 px-2 space-y-6 animate-fadeIn text-[#F4F4F5]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#111114] p-6 rounded-2xl border border-[#292932] shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" className="capitalize">
              {activeTopic} Roadmap
            </Badge>
            <Badge variant="ai" size="sm" className="uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
              Level: {currentLevel}
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F4F4F5] tracking-tight">Adaptive Learning Roadmap</h2>
          <p className="text-xs text-[#A1A1AA]">
            Complete or skip concepts in order to unlock downstream topics. Skipped concepts do not add mastery.
          </p>
        </div>

        <div className="w-full md:w-72 space-y-2">
          <ProgressBar progress={progressPercent} showLabel />
          <div className="text-[11px] text-[#71717A] text-right font-medium">
            {masteredCount} of {nodes.length} Concepts Mastered
          </div>
        </div>
      </div>

      {/* Level Complete / Progression Banner */}
      {canProgressToNextLevel && (
        <div className="p-6 rounded-2xl bg-[#16161B] border border-[#49406F] text-[#F4F4F5] shadow-elevated flex flex-col md:flex-row items-center justify-between gap-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#211C38] border border-[#49406F] flex items-center justify-center shrink-0">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#F4F4F5]">Congratulations! {(currentLevel || 'beginner').toUpperCase()} Level Completed</h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                This level is complete. Skipped concepts remain unmastered. Generate the {nextLevelTitle} level sequence below.
              </p>
            </div>
          </div>

          <Button
            onClick={() => pathId && completeLevel(pathId)}
            isLoading={isCompletingLevel}
            size="lg"
            className="w-full md:w-auto font-bold shadow-sm shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Generate Next Level ({nextLevelTitle.toUpperCase()})
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#211C38] text-[#8B7CFF] border border-[#49406F] text-xs font-semibold">
            <ListOrdered className="w-3.5 h-3.5" />
            Sequential Learning Path
          </div>
          <span className="text-xs text-[#71717A]">({nodes.length} concepts)</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => generatePath()}
            isLoading={isGenerating}
            size="sm"
            variant="secondary"
            className="text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Re-Generate Path
          </Button>
        </div>
      </div>

      {/* Main Roadmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sequence List */}
        <div className="lg:col-span-2">
          {isLoading || isGenerating ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-full h-20 rounded-2xl" />
              ))}
            </div>
          ) : nodes.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[#292932] bg-[#111114] text-center text-[#71717A] text-xs">
              No concepts generated yet. Click &quot;Re-Generate Path&quot; above to build your curriculum sequence.
            </div>
          ) : (
            <div className="space-y-3">
              {nodes.map((node, index) => {
                const isSelected = node.concept_id === selectedNodeId;
                const isCurrent = node.concept_id === currentNodeId;
                const isMastered = node.status === 'mastered' || node.status === 'known';
                const isSkipped = node.status === 'skipped';
                const isLocked = node.status === 'locked';

                return (
                  <div
                    key={node.concept_id}
                    onClick={() => !isLocked && dispatch(setSelectedNodeId(node.concept_id))}
                    className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isLocked ? 'opacity-40 grayscale bg-[#111114] border-[#1C1C23] cursor-not-allowed' : ''
                    } ${
                      isSelected
                        ? 'bg-[#211C38] border-[#8B7CFF] ring-2 ring-[#8B7CFF]/20 shadow-md'
                        : 'bg-[#111114] border-[#222229] hover:border-[#292932] hover:bg-[#16161B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isMastered
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : isCurrent
                              ? 'bg-[#6558F5] text-white border border-[#8B7CFF]/40'
                              : isLocked
                              ? 'bg-[#16161B] text-[#52525B] border border-[#222229]'
                              : 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]'
                          }`}
                        >
                          {isMastered || isSkipped ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#F4F4F5] group-hover:text-[#8B7CFF] transition-colors">
                              {node.title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              node.node_type === 'learning' ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]' : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            }`}>
                              {node.node_type || 'learning'}
                            </span>
                            {isMastered && <Badge variant="success" size="sm">Mastered</Badge>}
                            {isSkipped && <Badge variant="default" size="sm">Skipped</Badge>}
                            {isCurrent && <Badge variant="ai" size="sm">Active Node</Badge>}
                          </div>
                          <p className="text-xs text-[#A1A1AA] line-clamp-1 mt-0.5">{node.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex text-xs text-[#71717A] font-medium items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {node.estimated_minutes} min
                        </span>
                        {!isLocked && (
                          <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#8B7CFF] translate-x-0.5' : 'text-[#71717A]'}`} />
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
            <Card className="sticky top-24 space-y-5 bg-[#111114] border-[#292932] shadow-subtle text-[#F4F4F5]">
              <div className="flex items-center justify-between border-b border-[#222229] pb-3">
                <Badge variant={selectedNode.status === 'mastered' ? 'success' : 'primary'} size="sm" className="uppercase">
                  {selectedNode.level || 'BEGINNER'} • {selectedNode.node_type || 'LEARNING'}
                </Badge>
                <span className="text-xs text-[#71717A] flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#8B7CFF]" />
                  ~{selectedNode.estimated_minutes} minutes
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#F4F4F5] mb-2">{selectedNode.title}</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{selectedNode.description}</p>
              </div>

              {/* Node Prerequisite dependencies */}
              {selectedNode.depends_on && selectedNode.depends_on.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#8B7CFF]" /> Prerequisites Needed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.depends_on.map((dep) => (
                      <span key={dep} className="text-xs bg-[#16161B] text-[#A1A1AA] px-2.5 py-1 rounded-lg border border-[#292932] font-medium">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {selectedNode.status === 'locked' ? (
                <div className="p-3.5 rounded-xl bg-[#16161B] border border-[#292932] text-xs text-[#71717A] flex items-center gap-2 font-medium">
                  <Lock className="w-4 h-4 text-[#71717A] shrink-0" />
                  <span>This concept is locked. Complete preceding nodes first to unlock.</span>
                </div>
              ) : (
                <Button
                  onClick={() => handleStartNode(selectedNode.concept_id)}
                  size="lg"
                  className="w-full shadow-md font-bold cursor-pointer"
                >
                  {selectedNode.node_type === 'learning' ? <BookOpen className="w-4 h-4 mr-1.5" /> : <Zap className="w-4 h-4 mr-1.5" />}
                  Open {selectedNode.node_type === 'learning' ? 'Lesson Workspace' : 'Practice Workspace'}
                </Button>
              )}
            </Card>
          ) : (
            <Card className="text-center py-12 text-[#71717A] text-sm bg-[#111114] border-[#292932]">
              Select a concept to view details
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningPathView;
