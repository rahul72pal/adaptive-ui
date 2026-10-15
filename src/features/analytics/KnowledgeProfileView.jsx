import React from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { progressApi } from '../../api/progressApi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Sparkles, Target, CheckCircle2, Award } from 'lucide-react';

export function KnowledgeProfileView() {
  const { userId, activeTopic } = useSelector((state) => state.user);

  const { data: progress } = useQuery({
    queryKey: ['progress', userId, activeTopic],
    queryFn: () => progressApi.getProgress({ user_id: userId, topic: activeTopic }),
  });

  const overallMastery = progress?.overall_mastery || 68;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 animate-fadeIn text-[#F4F4F5]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#111114] p-6 rounded-2xl border border-[#292932] shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
              Lumina Knowledge Intelligence
            </Badge>
            <Badge variant="primary" size="sm" className="capitalize">
              {activeTopic}
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F4F4F5] tracking-tight">Your Knowledge Profile</h2>
          <p className="text-xs text-[#A1A1AA]">
            Continuous Bayesian mastery scoring driven by deterministic test attempts.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#16161B] p-4 rounded-xl border border-[#292932]">
          <div className="w-12 h-12 rounded-xl bg-[#211C38] border border-[#49406F] text-[#8B7CFF] flex items-center justify-center font-extrabold text-lg shadow-sm">
            {overallMastery}%
          </div>
          <div>
            <div className="text-xs font-bold text-[#F4F4F5]">Overall Mastery Score</div>
            <div className="text-[11px] text-[#8B7CFF] font-medium capitalize">Level: {progress?.current_level || 'Intermediate'}</div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Strengths */}
        <Card className="space-y-4 bg-[#111114] border border-[#292932] text-[#F4F4F5]">
          <div className="flex items-center gap-2 border-b border-[#222229] pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F4F4F5]">Verified Strengths</h3>
              <p className="text-[10px] text-[#71717A]">High confidence concepts</p>
            </div>
          </div>

          <div className="space-y-2">
            {(progress?.strengths || ['Fundamentals', 'Syntax']).map((item) => (
              <div key={item} className="flex items-center justify-between p-2.5 rounded-xl bg-[#16161B] border border-[#222229] text-xs">
                <span className="font-semibold text-emerald-300">{item}</span>
                <Badge variant="success" size="sm">Mastered</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 2: Growth Areas */}
        <Card className="space-y-4 bg-[#111114] border border-[#292932] text-[#F4F4F5]">
          <div className="flex items-center gap-2 border-b border-[#222229] pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F4F4F5]">Target Focus Areas</h3>
              <p className="text-[10px] text-[#71717A]">Active re-teach priorities</p>
            </div>
          </div>

          <div className="space-y-2">
            {(progress?.growth_areas || ['Edge Cases', 'Complexity Optimization']).map((item) => (
              <div key={item} className="flex items-center justify-between p-2.5 rounded-xl bg-[#16161B] border border-[#222229] text-xs">
                <span className="font-semibold text-amber-300">{item}</span>
                <Badge variant="warning" size="sm">In Progress</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 3: Level Progression Breakdown */}
        <Card className="space-y-4 bg-[#111114] border border-[#292932] text-[#F4F4F5]">
          <div className="flex items-center gap-2 border-b border-[#222229] pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#211C38] border border-[#49406F] text-[#8B7CFF] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F4F4F5]">Tier Breakdown</h3>
              <p className="text-[10px] text-[#71717A]">Beginner to Expert unlock scale</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#A1A1AA]">Beginner Tier</span>
                <span className="text-emerald-400">100%</span>
              </div>
              <ProgressBar progress={100} height="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#A1A1AA]">Intermediate Tier</span>
                <span className="text-[#8B7CFF]">55%</span>
              </div>
              <ProgressBar progress={55} height="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#A1A1AA]">Advanced Tier</span>
                <span className="text-[#71717A]">10%</span>
              </div>
              <ProgressBar progress={10} height="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#A1A1AA]">Expert Tier</span>
                <span className="text-[#71717A]">0%</span>
              </div>
              <ProgressBar progress={0} height="h-2" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default KnowledgeProfileView;
