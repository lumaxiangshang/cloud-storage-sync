import React, { useState } from 'react';
import { CloudStorageType } from '../../shared/types';

const storageOptions: { value: CloudStorageType; label: string; icon: string }[] = [
  { value: 'baidu', label: '百度网盘', icon: '🐼' },
  { value: 'quark', label: '夸克网盘', icon: '🚀' },
  { value: 'xunlei', label: '迅雷网盘', icon: '⚡' }
];

interface TransferTask {
  id: string;
  sourceUrl: string;
  sourceType: CloudStorageType;
  targetType: CloudStorageType;
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
  message: string;
  shareUrl?: string;
}

export const TransferPage: React.FC = () => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [sourceType, setSourceType] = useState<CloudStorageType>('baidu');
  const [targetType, setTargetType] = useState<CloudStorageType>('baidu');
  const [tasks, setTasks] = useState<TransferTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseUrls = (text: string): string[] => {
    return text.split(/\n|\r\n/)
      .map(line => line.trim())
      .filter(line => line.startsWith('http'));
  };

  const handleCreateTasks = () => {
    const urls = parseUrls(textInput);
    if (urls.length === 0) {
      alert('请输入有效的链接');
      return;
    }

    const newTasks: TransferTask[] = urls.map(url => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      sourceUrl: url,
      sourceType,
      targetType,
      status: 'pending',
      progress: 0,
      message: '等待中'
    }));

    setTasks(prev => [...newTasks, ...prev]);
    setTextInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: 解析 Excel/CSV 文件
      alert('文件上传功能开发中...');
    }
  };

  const startAllTasks = () => {
    setIsProcessing(true);
    // 模拟任务执行
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    pendingTasks.forEach((task, index) => {
      setTimeout(() => {
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'running', progress: 30, message: '解析链接...' } : t
        ));
        
        setTimeout(() => {
          setTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, progress: 60, message: '转存中...' } : t
          ));
          
          setTimeout(() => {
            setTasks(prev => prev.map(t => 
              t.id === task.id ? { 
                ...t, 
                status: 'success', 
                progress: 100, 
                message: '转存成功！',
                shareUrl: 'https://pan.baidu.com/s/xxx'
              } : t
            ));
            
            if (index === pendingTasks.length - 1) {
              setIsProcessing(false);
            }
          }, 2000);
        }, 1500);
      }, index * 1000);
    });
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => t.status !== 'success' && t.status !== 'failed'));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const copyShareUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('链接已复制！');
  };

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">批量转存</h1>
        <div className="flex gap-2">
          {tasks.some(t => t.status === 'pending') && (
            <button
              onClick={startAllTasks}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? '处理中...' : '开始转存'}
            </button>
          )}
          {tasks.some(t => t.status === 'success' || t.status === 'failed') && (
            <button
              onClick={clearCompleted}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              清除已完成
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setInputMode('text')}
            className={`px-4 py-2 rounded-lg ${inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            文本输入
          </button>
          <button
            onClick={() => setInputMode('file')}
            className={`px-4 py-2 rounded-lg ${inputMode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            文件导入
          </button>
        </div>

        {inputMode === 'text' ? (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg h-40 font-mono text-sm"
              placeholder="请输入网盘分享链接，每行一个&#10;例如：&#10;https://pan.baidu.com/s/xxx&#10;https://pan.quark.cn/s/xxx"
            />
            <div className="text-sm text-gray-500">
              已输入 {parseUrls(textInput).length} 个链接
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-600">点击或拖拽文件到这里</p>
              <p className="text-sm text-gray-400 mt-1">支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">源网盘</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as CloudStorageType)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {storageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标网盘</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as CloudStorageType)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {storageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleCreateTasks}
            disabled={!textInput.trim() && inputMode === 'text'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            添加到队列
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">任务列表</h2>
          <span className="text-sm text-gray-500">
            共 {tasks.length} 个任务
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">暂无任务，在上方添加链接开始转存</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                        {statusText[task.status]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {storageOptions.find(s => s.value === task.sourceType)?.icon} → {storageOptions.find(s => s.value === task.targetType)?.icon}
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
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    ✕
                  </button>
                </div>

                {task.status === 'running' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{task.message}</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {task.status === 'success' && task.shareUrl && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={task.shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded text-sm bg-white"
                      />
                      <button
                        onClick={() => copyShareUrl(task.shareUrl!)}
                        className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                )}

                {task.status === 'failed' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">{task.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
