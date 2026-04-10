import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  TrendingUp, 
  Trophy, 
  ChevronRight,
  Target,
  Lock,
  Globe
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface RegionalRankCardProps {
  isOwner?: boolean;
}

const RegionalRankCard = ({ isOwner = false }: RegionalRankCardProps) => {
  const [visibility, setVisibility] = useState('public');

  const rankData = {
    region: 'Biên Hòa',
    rank: 36,
    total: 1240,
    percentile: 12,
    tier: 'B',
    monthlyChange: 4,
    nextTier: 'A',
    progressToNext: 80,
  };

  const improvements = [
    'Complete 1 more verified milestone',
    'Maintain weekly consistency for 2 more weeks',
  ];

  const tierColors: Record<string, string> = {
    S: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white',
    A: 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white',
    B: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
    C: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
  };

  return (
    <Card className="p-4">
      {/* Header with Privacy Control */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Regional Ranking</span>
        </div>
        {isOwner && (
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Public
                </div>
              </SelectItem>
              <SelectItem value="followers">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Followers
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Region & Rank */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{rankData.region}</span>
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Badge className={`${tierColors[rankData.tier]} text-lg px-3 py-1`}>
            Tier {rankData.tier}
          </Badge>
          <span className="text-2xl font-bold">Top {rankData.percentile}%</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Rank #{rankData.rank} of {rankData.total.toLocaleString()}
        </p>
      </div>

      {/* Monthly Change */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Badge variant="secondary" className="gap-1 text-emerald-600">
          <TrendingUp className="h-3 w-3" />
          +{rankData.monthlyChange} positions this month
        </Badge>
      </div>

      {/* Progress to Next Tier */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progress to Tier {rankData.nextTier}</span>
          <span className="font-medium">{rankData.progressToNext}%</span>
        </div>
        <Progress value={rankData.progressToNext} className="h-2" />
      </div>

      {/* Improvement Suggestions */}
      {isOwner && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>To reach Tier {rankData.nextTier}:</span>
          </div>
          {improvements.map((improvement, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs"
            >
              <ChevronRight className="h-3 w-3 text-primary" />
              <span>{improvement}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RegionalRankCard;
