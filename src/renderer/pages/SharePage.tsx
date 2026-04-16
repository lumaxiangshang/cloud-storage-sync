import React, { useState } from 'react';
import { CloudStorageType } from '../../shared/types';

const storageOptions: { value: CloudStorageType; label: string; icon: string }[] = [
  { value: 'baidu', label: '百度网盘', icon: '🐼' },
  { value: 'quark', label: '夸克网盘', icon: '🚀' },
  { value: 'xunlei', label: '迅雷网盘', icon: '⚡' }
];

interface ShareTask {
  id: string;
  filePath: string;
  storageType: CloudStorageType;
  status: 'pending' | 'running' | 'success' | 'failed';
  shareUrl?: string;
  password?: string;
  expiresIn?: number;
  message: string;
}

export const SharePage: React.FC = () => {
  const [storageType, setStorageType] = useState<CloudStorageType>('baidu');
  const [filePathsInput, setFilePathsInput] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [useExpire, setUseExpire] = useState(false);
  const [expireDays, setExpireDays] = useState(7);
  const [tasks, setTasks] = useState<ShareTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parsePaths = (text: string): string[] => {
    return text.split(/\n|\r\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < 4; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateTasks = () => {
    const paths = parsePaths(filePathsInput);
    if (paths.length === 0) {
      alert('请输入文件路径');
      return;
    }

    const newTasks: ShareTask[] = paths.map(path => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      filePath: path,
      storageType,
      status: 'pending',
      password: usePassword ? (autoGeneratePassword ? generateRandomPassword() : customPassword) : undefined,
      expiresIn: useExpire ? expireDays : undefined,
      message: '等待中'
    }));

    setTasks(prev => [...newTasks, ...prev]);
    setFilePathsInput('');
  };

  const startAllTasks = () => {
    setIsProcessing(true);
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    pendingTasks.forEach((task, index) => {
      setTimeout(() => {
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'running', message: '生成分享链接中...' } : t
        ));
        
        setTimeout(() => {
          setTasks(prev => prev.map(t => 
            t.id === task.id ? { 
              ...t, 
              status: 'success', 
              message: '生成成功！',
              shareUrl: `https://pan.baidu.com/s/${Math.random().toString(36).substr(2, 12)}`
            } : t
          ));
          
          if (index === pendingTasks.length - 1) {
            setIsProcessing(false);
          }
        }, 1500);
      }, index * 500);
    });
  };

  const copyShareLink = (task: ShareTask) => {
    if (task.shareUrl) {
      let text = task.shareUrl;
      if (task.password) {
        text += ` 提取码: ${task.password}`;
      }
      navigator.clipboard.writeText(text);
      alert('已复制到剪贴板！');
    }
  };

  const exportResults = () => {
    const successTasks = tasks.filter(t => t.status === 'success');
    let text = '文件路径\t分享链接\t提取码\t有效期\n';
    
    successTasks.forEach(task => {
      text += `${task.filePath}\t${task.shareUrl || ''}\t${task.password || ''}\t${task.expiresIn ? task.expiresIn + '天' : '永久'}\n`;
    });

    const blob = new Blob([text], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '分享结果.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => t.status !== 'success' && t.status !== 'failed'));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
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
        <h1 className="text-2xl font-bold text-gray-800">批量分享</h1>
        <div className="flex gap-2">
          {tasks.some(t => t.status === 'success') && (
            <button
              onClick={exportResults}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              导出结果
            </button>
          )}
          {tasks.some(t => t.status === 'pending') && (
            <button
              onClick={startAllTasks}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? '处理中...' : '开始生成'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">网盘类型</label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value as CloudStorageType)}
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">文件路径</label>
          <textarea
            value={filePathsInput}
            onChange={(e) => setFilePathsInput(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg h-32 font-mono text-sm"
            placeholder="请输入文件或文件夹路径，每行一个&#10;例如：&#10;/我的文档&#10;/视频/教程.mp4"
          />
          <div className="text-sm text-gray-500 mt-1">
            已输入 {parsePaths(filePathsInput).length} 个路径
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="usePassword"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="usePassword" className="font-medium">设置提取码</label>
            </div>
            {usePassword && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="autoPassword"
                    name="passwordType"
                    checked={autoGeneratePassword}
                    onChange={() => setAutoGeneratePassword(true)}
                  />
                  <label htmlFor="autoPassword">自动生成（4位）</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="customPassword"
                    name="passwordType"
                    checked={!autoGeneratePassword}
                    onChange={() => setAutoGeneratePassword(false)}
                  />
                  <label htmlFor="customPassword">自定义</label>
                </div>
                {!autoGeneratePassword && (
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="请输入提取码"
                    maxLength={4}
                  />
                )}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useExpire"
                checked={useExpire}
                onChange={(e) => setUseExpire(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useExpire" className="font-medium">设置有效期</label>
            </div>
            {useExpire && (
              <div className="ml-6">
                <select
                  value={expireDays}
                  onChange={(e) => setExpireDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value={1}>1 天</option>
                  <option value={7}>7 天</option>
                  <option value={30}>30 天</option>
                  <option value={90}>90 天</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCreateTasks}
            disabled={!filePathsInput.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            添加到队列
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">任务列表</h2>
          <span className="text-sm text-gray-500">共 {tasks.length} 个任务</span>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-gray-500">暂无任务，在上方添加文件路径开始生成分享链接</p>
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
                        {storageOptions.find(s => s.value === task.storageType)?.icon} {storageOptions.find(s => s.value === task.storageType)?.label}
                      </span>
                      {task.password && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          提取码: {task.password}
                        </span>
                      )}
                      {task.expiresIn && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {task.expiresIn}天
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 font-mono text-sm break-all">{task.filePath}</p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    ✕
                  </button>
                </div>

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
                        onClick={() => copyShareLink(task)}
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
