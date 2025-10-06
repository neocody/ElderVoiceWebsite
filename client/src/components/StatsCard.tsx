import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBgColor,
  changeType = 'neutral'
}: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-secondary';
      case 'negative': return 'text-red-500';
      default: return 'text-textSecondary';
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-textSecondary text-sm font-medium">{title}</p>
          <p className="text-2xl font-semibold text-textPrimary">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`${iconColor} text-lg`} size={20} />
        </div>
      </div>
      {change && changeLabel && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${getChangeColor()}`}>{change}</span>
          <span className="text-textSecondary text-sm ml-2">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
