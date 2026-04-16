import React, { useState } from 'react';
import { CloudStorageType } from '../../shared/types';

interface TaskFormProps {
  onSubmit: (sourceUrl: string, sourceType: CloudStorageType, targetType: CloudStorageType) => void;
  isLoading: boolean;
}

const storageOptions: { value: CloudStorageType; label: string }[] = [
  { value: 'baidu', label: '百度网盘' },
  { value: 'quark', label: '夸克网盘' },
  { value: 'xunlei', label: '迅雷网盘' }
];

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, isLoading }) => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState<CloudStorageType>('baidu');
  const [targetType, setTargetType] = useState<CloudStorageType>('baidu');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) return;
    onSubmit(sourceUrl.trim(), sourceType, targetType);
    setSourceUrl('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">创建转存任务</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            分享链接
          </label>
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="请输入网盘分享链接..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              源网盘
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as CloudStorageType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              {storageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标网盘
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as CloudStorageType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              {storageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !sourceUrl.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '创建中...' : '创建任务'}
        </button>
      </form>
    </div>
  );
};
