import React from 'react';
import { SyncTask } from '../../shared/types';

interface TaskCardProps {
  task: SyncTask;
  onStart: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onCopyLink: (url: string) => void;
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  failed: 'bg-red-100 text-red-600'
};

const statusText = {
  pending: '等待中',
  running: '处理中',
  success: '成功',
  failed: '失败'
};

const storageNames = {
  baidu: '百度网盘',
  quark: '夸克网盘',
  xunlei: '迅雷网盘'
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStart,
  onDelete,
  onCopyLink
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
              {statusText[task.status]}
            </span>
            <span className="text-sm text-gray-500">
              {storageNames[task.sourceType]} → {storageNames[task.targetType]}
            </span>
          </div>
          <a
            href={task.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm break-all"
          >
            {task.sourceUrl}
          </a>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-400 hover:text-red-500 ml-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* 进度条 */}
      {task.status === 'running' && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{task.message}</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 状态消息 */}
      {task.status === 'success' && task.shareUrl && (
        <div className="mb-3 p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-green-700 mb-2">转存成功！</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={task.shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded text-sm bg-white"
            />
            <button
              onClick={() => onCopyLink(task.shareUrl!)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              复制链接
            </button>
          </div>
        </div>
      )}

      {task.status === 'failed' && (
        <div className="mb-3 p-3 bg-red-50 rounded-lg">
          <div className="text-sm text-red-700">{task.message}</div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          创建时间: {new Date(task.createdAt).toLocaleString()}
        </span>
        {task.status === 'pending' && (
          <button
            onClick={() => onStart(task.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            开始转存
          </button>
        )}
      </div>
    </div>
  );
};
