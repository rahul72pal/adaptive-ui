import React from 'react';

import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { progressApi } from '../../api/progressApi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Sparkles, Trophy, Target, TrendingUp, ShieldCheck, CheckCircle2, AlertCircle, Award, BarChart3 } from 'lucide-react';

export function KnowledgeProfileView() {
  const { userId, activeTopic, targetLevel } = useSelector((state) => state.user);

  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress', userId, activeTopic],
    queryFn: () => progressApi.getProgress({ user_id: userId, topic: activeTopic }),
  });

  const overallMastery = progress?.overall_mastery || 68;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-surface-variant shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Lumina Knowledge Intelligence
            </Badge>
            <Badge variant="primary" size="sm" className="capitalize">
              {activeTopic}
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-ink-primary tracking-tight">Your Knowledge Profile</h2>
          <p className="text-xs text-ink-muted">
            Continuous Bayesian mastery scoring driven by deterministic test attempts.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-brand-50/60 p-4 rounded-xl border border-brand-200">
          <div className="w-12 h-12 rounded-xl gradient-btn text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
            {overallMastery}%
          </div>
          <div>
            <div className="text-xs font-bold text-ink-primary">Overall Mastery Score</div>
            <div className="text-[11px] text-brand-700 font-medium capitalize">Level: {progress?.current_level || 'Intermediate'}</div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Strengths */}
        <Card className="space-y-4 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-primary">Verified Strengths</h3>
              <p className="text-[10px] text-ink-muted">High confidence concepts</p>
            </div>
          </div>

          <div className="space-y-2">
            {progress?.strengths?.map((item) => (
              <div key={item} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-100 text-xs">
                <span className="font-semibold text-emerald-950">{item}</span>
                <Badge variant="success" size="sm">Mastered</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 2: Growth Areas */}
        <Card className="space-y-4 border-amber-200 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-primary">Target Focus Areas</h3>
              <p className="text-[10px] text-ink-muted">Active re-teach priorities</p>
            </div>
          </div>

          <div className="space-y-2">
            {progress?.growth_areas?.map((item) => (
              <div key={item} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-100 text-xs">
                <span className="font-semibold text-amber-950">{item}</span>
                <Badge variant="warning" size="sm">In Progress</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 3: Level Progression Breakdown */}
        <Card className="space-y-4 border-brand-200">
          <div className="flex items-center gap-2 border-b border-surface-variant pb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-primary">Tier Breakdown</h3>
              <p className="text-[10px] text-ink-muted">Beginner to Expert unlock scale</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Beginner Tier</span>
                <span className="text-emerald-700">100%</span>
              </div>
              <ProgressBar progress={100} height="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Intermediate Tier</span>
                <span className="text-brand-700">55%</span>
              </div>
              <ProgressBar progress={55} height="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Advanced Tier</span>
                <span className="text-ink-muted">10%</span>
              </div>
              <ProgressBar progress={10} height="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Expert Tier</span>
                <span className="text-ink-muted">0%</span>
              </div>
              <ProgressBar progress={0} height="h-2" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
