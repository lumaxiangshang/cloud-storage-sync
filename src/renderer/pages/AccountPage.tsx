import React, { useState } from 'react';
import { CloudStorageType } from '../../shared/types';

const storageInfo: { type: CloudStorageType; name: string; color: string; icon: string }[] = [
  { type: 'baidu', name: '百度网盘', color: 'bg-blue-500', icon: '🐼' },
  { type: 'quark', name: '夸克网盘', color: 'bg-purple-500', icon: '🚀' },
  { type: 'xunlei', name: '迅雷网盘', color: 'bg-orange-500', icon: '⚡' }
];

interface Account {
  id: string;
  name: string;
  type: CloudStorageType;
  isActive: boolean;
  spaceTotal?: number;
  spaceUsed?: number;
  lastLoginAt: Date;
}

export const AccountPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<CloudStorageType>('baidu');
  const [cookiesInput, setCookiesInput] = useState('');

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '未知';
    const GB = bytes / (1024 * 1024 * 1024);
    return `${GB.toFixed(2)} GB`;
  };

  const handleAddAccount = () => {
    if (!newAccountName.trim() || !cookiesInput.trim()) return;

    try {
      const cookies = JSON.parse(cookiesInput);
      
      const newAccount: Account = {
        id: Date.now().toString(),
        name: newAccountName,
        type: newAccountType,
        isActive: true,
        lastLoginAt: new Date()
      };

      setAccounts(prev => [...prev, newAccount]);
      setShowAddModal(false);
      setNewAccountName('');
      setCookiesInput('');
    } catch (error) {
      alert('Cookie 格式错误，请输入有效的 JSON');
    }
  };

  const toggleAccountStatus = (id: string) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, isActive: !acc.isActive } : acc
    ));
  };

  const deleteAccount = (id: string) => {
    if (confirm('确定要删除这个账号吗？')) {
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">账号管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 添加账号
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => {
          const info = storageInfo.find(s => s.type === account.type);
          const spaceUsage = account.spaceTotal && account.spaceUsed 
            ? (account.spaceUsed / account.spaceTotal * 100).toFixed(1)
            : null;

          return (
            <div key={account.id} className="bg-white rounded-lg shadow-md p-4 border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${info?.color} flex items-center justify-center text-white text-2xl`}>
                    {info?.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{account.name}</h3>
                    <p className="text-sm text-gray-500">{info?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={account.isActive ? '已启用' : '已禁用'}
                  />
                </div>
              </div>

              {spaceUsage && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>空间使用</span>
                    <span>{spaceUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${spaceUsage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>已用: {formatSize(account.spaceUsed)}</span>
                    <span>总计: {formatSize(account.spaceTotal)}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 mb-3">
                最后登录: {account.lastLoginAt.toLocaleString()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleAccountStatus(account.id)}
                  className="flex-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                >
                  {account.isActive ? '禁用' : '启用'}
                </button>
                <button
                  onClick={() => deleteAccount(account.id)}
                  className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔐</div>
          <p className="text-gray-500">还没有添加账号，点击上方按钮添加</p>
        </div>
      )}

      {/* 添加账号弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">添加账号</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账号名称</label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="例如：我的百度网盘"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">网盘类型</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as CloudStorageType)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {storageInfo.map(info => (
                    <option key={info.type} value={info.type}>
                      {info.icon} {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cookie (JSON 格式)
                </label>
                <textarea
                  value={cookiesInput}
                  onChange={(e) => setCookiesInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg h-32 font-mono text-sm"
                  placeholder='{"BDUSS": "xxx", "STOKEN": "xxx"}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  从浏览器开发者工具中复制 Cookie
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddAccount}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
