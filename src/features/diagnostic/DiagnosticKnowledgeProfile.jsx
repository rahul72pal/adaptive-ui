import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import {
  Sparkles,
  Target,
  CheckCircle2,
  Brain,
  Zap,
  TrendingUp,
  AlertCircle,
  Activity,
  Layers
} from 'lucide-react';

export function DiagnosticKnowledgeProfile({
  activeTopic = '',
  turn = 1,
  totalTurns = 15,
  knowledgeProfile = null,
  currentConcept = null,
  lastFeedback = null,
  lastEvaluatedConcept = null,
  isStreaming = false,
  streamingStatus = 'idle',
}) {
  // Normalize concepts list from knowledgeProfile object
  const profileEntries = knowledgeProfile && typeof knowledgeProfile === 'object'
    ? Object.entries(knowledgeProfile).filter(([k]) => !k.startsWith('_'))
    : [];

  // Calculate assessed concepts and overall average confidence
  const assessedEntries = profileEntries.filter(
    ([_, data]) => data && (data.confidence > 0 || data.status === 'known' || data.status === 'learning')
  );

  const averageConfidence = assessedEntries.length > 0
    ? Math.round(
        (assessedEntries.reduce((acc, [_, d]) => acc + (d.confidence || 0), 0) / assessedEntries.length) * 100
      )
    : 0;

  const masteredCount = profileEntries.filter(
    ([_, d]) => d && ((d.confidence || 0) >= 0.8 || d.status === 'known')
  ).length;

  const focusCount = profileEntries.filter(
    ([_, d]) => d && (d.confidence || 0) > 0 && (d.confidence || 0) < 0.8
  ).length;

  const formatConceptName = (rawName) => {
    if (!rawName) return 'Core Concept';
    return rawName
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusBadge = (confidence = 0, status = 'unassessed') => {
    if (confidence >= 0.8 || status === 'known') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-600/40 text-emerald-400">
          Mastered
        </span>
      );
    }
    if (confidence >= 0.45) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/70 border border-[#8B7CFF]/40 text-[#8B7CFF]">
          Developing
        </span>
      );
    }
    if (confidence > 0 || status === 'learning') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-600/40 text-amber-400">
          Needs Focus
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1A22] border border-[#292932] text-[#71717A]">
        Unassessed
      </span>
    );
  };

  const getBarColor = (confidence = 0) => {
    if (confidence >= 0.8) return 'bg-emerald-500';
    if (confidence >= 0.45) return 'bg-[#8B7CFF]';
    if (confidence > 0) return 'bg-amber-500';
    return 'bg-[#292932]';
  };

  // Clean feedback text and handle literal unescaped newlines
  const formatFeedback = (raw) => {
    if (!raw) return '';
    let text = raw.replace(/\\n/g, '\n').trim();
    return text;
  };

  return (
    <div className="space-y-3.5 text-[#F4F4F5]">
      {/* 1. Header Card: Live Knowledge Score & Progress */}
      <div className="bg-[#111114] border border-[#292932] rounded-2xl p-4 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#211C38] border border-[#49406F] text-[#8B7CFF] flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-[#F4F4F5] flex items-center gap-1.5">
                Knowledge Profile
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-[#A1A1AA] capitalize">
                {activeTopic ? `${activeTopic} Assessment` : 'Active Assessment'}
              </p>
            </div>
          </div>

          <Badge variant="ai" size="sm" className="font-semibold text-[10px]">
            Turn {turn} / {totalTurns}
          </Badge>
        </div>

        {/* Overall Topic Confidence Meter */}
        <div className="bg-[#16161B] p-3 rounded-xl border border-[#222229] flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold text-[#A1A1AA] flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#8B7CFF]" />
              Topic Confidence
            </div>
            <div className="text-lg font-extrabold text-[#F4F4F5]">
              {averageConfidence}%
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-[9px] text-[#71717A]">Assessed</div>
              <div className="text-xs font-bold text-emerald-400">
                {assessedEntries.length} of {profileEntries.length || 5}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full border-2 border-[#49406F] bg-[#211C38] flex items-center justify-center font-bold text-xs text-[#8B7CFF] shadow-xs">
              {averageConfidence}%
            </div>
          </div>
        </div>

        {/* Stream Status Pill (Shows when AI is scoring or streaming) */}
        {isStreaming && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#211C38]/80 border border-[#49406F] text-[11px] text-[#8B7CFF] animate-fadeIn">
            {streamingStatus === 'evaluating' ? (
              <>
                <Activity className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="font-medium text-amber-300">Evaluating response...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-[#8B7CFF] animate-pulse" />
                <span className="font-medium">Streaming next question...</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Real-Time AI Feedback Card (Latest Turn Assessment) */}
      <div className={`rounded-2xl border p-3.5 shadow-subtle transition-all duration-300 ${
        lastFeedback
          ? 'bg-[#111114] border-[#8B7CFF]/40 shadow-[0_0_12px_rgba(139,124,255,0.1)]'
          : 'bg-[#111114] border-[#292932]'
      }`}>
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222229]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-3 h-3" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#F4F4F5] block">
                Latest Evaluation
              </span>
              {lastEvaluatedConcept && (
                <span className="text-[10px] text-[#8B7CFF] font-medium block">
                  {formatConceptName(lastEvaluatedConcept)}
                </span>
              )}
            </div>
          </div>
          <Badge variant="primary" size="sm" className="text-[9px]">
            Live Feedback
          </Badge>
        </div>

        {lastFeedback ? (
          <div className="text-xs text-[#D4D4D8] leading-relaxed bg-[#16161B] p-2.5 rounded-xl border border-[#292932] max-h-[140px] overflow-y-auto">
            <MarkdownRenderer content={formatFeedback(lastFeedback)} />
          </div>
        ) : (
          <div className="text-[11px] text-[#71717A] italic py-2 text-center bg-[#16161B]/50 rounded-xl border border-[#222229]/60">
            Submit your answer to see Lumina's instant evaluation.
          </div>
        )}
      </div>

      {/* 3. Current Probed Concept Card */}
      {currentConcept && (
        <div className="bg-[#111114] border border-[#292932] rounded-2xl p-4 shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B7CFF]">
              <Target className="w-3.5 h-3.5" />
              <span>Current Target Concept</span>
            </div>
            <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold">Active Probe</span>
          </div>

          <div className="bg-[#16161B] p-3 rounded-xl border border-[#292932] flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-[#F4F4F5]">
                {formatConceptName(currentConcept)}
              </div>
              <div className="text-[10px] text-[#A1A1AA] mt-0.5">
                AI is testing understanding and nuance on this topic
              </div>
            </div>
            <Badge variant="ai" size="sm" className="text-[10px] shrink-0">
              In Focus
            </Badge>
          </div>
        </div>
      )}

      {/* 4. Live Concept Mastery Matrix */}
      <div className="bg-[#111114] border border-[#292932] rounded-2xl p-4 sm:p-5 shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8B7CFF]" />
            <h4 className="font-bold text-xs text-[#F4F4F5] uppercase tracking-wider">
              Concept Breakdown
            </h4>
          </div>
          <span className="text-[10px] text-[#71717A]">
            {profileEntries.length} Concepts Tracked
          </span>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {profileEntries.length > 0 ? (
            profileEntries.map(([conceptId, data]) => {
              const conf = typeof data === 'object' ? (data.confidence || 0) : 0;
              const status = typeof data === 'object' ? (data.status || 'unassessed') : 'unassessed';
              const confPercent = Math.round(conf * 100);
              const isCurrent = currentConcept === conceptId;

              return (
                <div
                  key={conceptId}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#211C38]/40 border-[#8B7CFF]/50 ring-1 ring-[#8B7CFF]/30'
                      : 'bg-[#16161B] border-[#222229] hover:border-[#292932]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#F4F4F5] truncate">
                      {formatConceptName(conceptId)}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(conf, status)}
                      <span className="text-[11px] font-bold text-[#A1A1AA] w-8 text-right">
                        {confPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#111114] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getBarColor(conf)}`}
                      style={{ width: `${Math.max(confPercent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-[#71717A] bg-[#16161B]/60 rounded-xl border border-[#222229]">
              <Sparkles className="w-5 h-5 text-[#8B7CFF] mx-auto mb-1.5 opacity-60" />
              Initializing diagnostic concept graph...
            </div>
          )}
        </div>

        {/* Quick Concept Summary Pills */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222229]">
          <div className="bg-[#16161B] p-2.5 rounded-xl border border-emerald-950/70 text-center">
            <div className="text-[10px] text-[#A1A1AA] flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Mastered
            </div>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
              {masteredCount}
            </div>
          </div>

          <div className="bg-[#16161B] p-2.5 rounded-xl border border-amber-950/70 text-center">
            <div className="text-[10px] text-[#A1A1AA] flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              In Focus
            </div>
            <div className="text-sm font-extrabold text-amber-400 mt-0.5">
              {focusCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticKnowledgeProfile;
