'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatisticsCard as StatisticsCardType } from '@/types/historical-data.types';

interface StatisticsCardProps {
  data: StatisticsCardType;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const colorClasses = {
  blue: {
    border: 'border-l-blue-600',
    gradient: 'from-blue-500/10',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  green: {
    border: 'border-l-green-600',
    gradient: 'from-green-500/10',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  orange: {
    border: 'border-l-orange-600',
    gradient: 'from-orange-500/10',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  purple: {
    border: 'border-l-purple-600',
    gradient: 'from-purple-500/10',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
};

export function StatisticsCard({ data, icon: Icon, color }: StatisticsCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`
        relative overflow-hidden bg-white rounded-lg shadow-md 
        border-l-4 ${colors.border} p-6 
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
      `}
    >
      {/* Gradient Background Effect */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${colors.gradient} rounded-full blur-3xl -mr-16 -mt-16`}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{data.title}</h3>
        <div className={`p-2 rounded-lg ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
      </div>

      {/* Main Count */}
      <div className="relative mb-4">
        <p className="text-4xl font-bold text-gray-900">{data.count.toLocaleString()}</p>
      </div>

      {/* Breakdown or Additional Info */}
      {data.breakdown && (
        <div className="relative space-y-2 mt-4 pt-4 border-t border-gray-200">
          {Object.entries(data.breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{key}</span>
              <span className="font-semibold text-gray-900">{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Accuracy Percentage */}
      {data.accuracyPercentage !== undefined && (
        <div className="relative mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Accuracy</span>
            <span className="text-lg font-bold text-green-600">
              {data.accuracyPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Monthly References */}
      {data.monthlyReferences !== undefined && (
        <div className="relative mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">This Month</span>
            <span className="font-semibold text-gray-900">
              {data.monthlyReferences.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
