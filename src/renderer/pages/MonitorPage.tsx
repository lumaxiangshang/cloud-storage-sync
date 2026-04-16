import React, { useState, useEffect } from 'react';
import { CloudStorageType } from '../../shared/types';

const storageOptions: { value: CloudStorageType; label: string; icon: string }[] = [
  { value: 'baidu', label: '百度网盘', icon: '🐼' },
  { value: 'quark', label: '夸克网盘', icon: '🚀' },
  { value: 'xunlei', label: '迅雷网盘', icon: '⚡' }
];

interface WatchRule {
  id: string;
  name: string;
  storageType: CloudStorageType;
  folderPath: string;
  enabled: boolean;
  checkInterval: number;
  lastCheckedAt?: Date;
  syncTo?: any[];
  autoShare?: boolean;
}

interface WatchEvent {
  id: string;
  type: 'new' | 'modified' | 'deleted';
  fileName: string;
  ruleName: string;
  timestamp: Date;
}

export const MonitorPage: React.FC = () => {
  const [rules, setRules] = useState<WatchRule[]>([]);
  const [events, setEvents] = useState<WatchEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [newRule, setNewRule] = useState<Partial<WatchRule>>({
    name: '',
    storageType: 'baidu',
    folderPath: '/',
    enabled: true,
    checkInterval: 30000,
    autoShare: false
  });

  useEffect(() => {
    // 模拟数据
    const mockRules: WatchRule[] = [
      {
        id: '1',
        name: '追剧监控',
        storageType: 'baidu',
        folderPath: '/我的资源',
        enabled: true,
        checkInterval: 30000
      }
    ];

    const mockEvents: WatchEvent[] = [
      {
        id: '1',
        type: 'new',
        fileName: '新剧集.mp4',
        ruleName: '追剧监控',
        timestamp: new Date(Date.now() - 60000)
      }
    ];

    setRules(mockRules);
    setEvents(mockEvents);
  }, []);

  const formatInterval = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} 秒';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    return `${hours} 小时`;
  };

  const toggleRuleStatus = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const deleteRule = (id: string) => {
    if (confirm('确定要删除这个监控规则吗？')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.folderPath) {
      alert('请填写完整信息');
      return;
    }

    const rule: WatchRule = {
      id: Date.now().toString(),
      name: newRule.name!,
      storageType: newRule.storageType as CloudStorageType,
      folderPath: newRule.folderPath!,
      enabled: newRule.enabled!,
      checkInterval: newRule.checkInterval!,
      autoShare: newRule.autoShare
    };

    setRules(prev => [...prev, rule]);
    setShowAddModal(false);
    setNewRule({
      name: '',
      storageType: 'baidu',
      folderPath: '/',
      enabled: true,
      checkInterval: 30000,
      autoShare: false
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'new': return '✨';
      case 'modified': return '✏️';
      case 'deleted': return '🗑️';
      default: return '📋';
    }
  };

  const getEventText = (type: string) => {
    switch (type) {
      case 'new': return '新增';
      case 'modified': return '修改';
      case 'deleted': return '删除';
      default: return '未知';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">资源监控</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-lg ${isRunning ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
          >
            {isRunning ? '⏸️ 停止监控' : '▶️ 开始监控'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 添加规则
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 监控规则 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">监控规则</h2>
          
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👁️</div>
              <p className="text-gray-500">还没有监控规则，点击上方按钮添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                      <div
                          className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                        <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>
                          {storageOptions.find(s => s.value === rule.storageType)?.icon} {' '}
                          {storageOptions.find(s => s.value === rule.storageType)?.label}
                        </p>
                        <p className="font-mono">{rule.folderPath}</p>
                        <p>检查间隔: {formatInterval(rule.checkInterval)}</p>
                      {rule.lastCheckedAt && (
                        <p className="text-xs text-gray-400">
                          最后检查: {rule.lastCheckedAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleRuleStatus(rule.id)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        {rule.enabled ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 事件日志 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">事件日志</h2>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500">暂无事件</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {getEventText(event.type)}
                      </span>
                      <span className="text-sm text-gray-500">{event.ruleName}</span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{event.fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加规则弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">添加监控规则</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="例如：追剧监控"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">网盘类型</label>
                <select
                  value={newRule.storageType}
                  onChange={(e) => setNewRule({ ...newRule, storageType: e.target.value as CloudStorageType })}
                  className="w-full px-3 py-2 border rounded"
                >
                  {storageOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">监控文件夹</label>
                <input
                  type="text"
                  value={newRule.folderPath}
                  onChange={(e) => setNewRule({ ...newRule, folderPath: e.target.value })}
                  className="w-full px-3 py-2 border rounded font-mono"
                  placeholder="/我的资源"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">检查间隔</label>
                <select
                  value={newRule.checkInterval}
                  onChange={(e) => setNewRule({ ...newRule, checkInterval: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value={10000}>10 秒</option>
                  <option value={30000}>30 秒</option>
                  <option value={60000}>1 分钟</option>
                  <option value={300000}>5 分钟</option>
                  <option value={600000}>10 分钟</option>
                </select>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="enableSync"
                    checked={!!newRule.syncTo?.length}
                    onChange={(e) => setNewRule({ ...newRule, syncTo: e.target.checked ? [] : undefined })}
                    className="rounded"
                  />
                  <label htmlFor="enableSync" className="font-medium">同步到其他网盘</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableAutoShare"
                    checked={newRule.autoShare}
                    onChange={(e) => setNewRule({ ...newRule, autoShare: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="enableAutoShare" className="font-medium">自动生成分享链接</label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddRule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
