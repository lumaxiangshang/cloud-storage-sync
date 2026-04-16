import React, { useEffect, useState } from 'react';
import { CloudStorageType } from '../../shared/types';

interface LoginPanelProps {
  onLogin: (type: CloudStorageType) => Promise<boolean>;
  onCheckLogin: (type: CloudStorageType) => Promise<boolean>;
}

const storageInfo: { type: CloudStorageType; name: string; color: string; icon: string }[] = [
  { type: 'baidu', name: '百度网盘', color: 'bg-blue-500', icon: '🐼' },
  { type: 'quark', name: '夸克网盘', color: 'bg-purple-500', icon: '🚀' },
  { type: 'xunlei', name: '迅雷网盘', color: 'bg-orange-500', icon: '⚡' }
];

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin, onCheckLogin }) => {
  const [loginStatus, setLoginStatus] = useState<Record<CloudStorageType, boolean>>({
    baidu: false,
    quark: false,
    xunlei: false
  });

  const [isLoggingIn, setIsLoggingIn] = useState<Record<CloudStorageType, boolean>>({
    baidu: false,
    quark: false,
    xunlei: false
  });

  useEffect(() => {
    // 检查登录状态
    const checkAllLogins = async () => {
      for (const info of storageInfo) {
        const status = await onCheckLogin(info.type);
        setLoginStatus(prev => ({ ...prev, [info.type]: status }));
      }
    };
    checkAllLogins();
  }, [onCheckLogin]);

  const handleLogin = async (type: CloudStorageType) => {
    setIsLoggingIn(prev => ({ ...prev, [type]: true }));
    try {
      const success = await onLogin(type);
      if (success) {
        setLoginStatus(prev => ({ ...prev, [type]: true }));
      }
    } finally {
      setIsLoggingIn(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">网盘登录状态</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {storageInfo.map((info) => (
          <div key={info.type} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{info.icon}</span>
                <span className="font-medium text-gray-800">{info.name}</span>
              </div>
              <div className={`flex items-center gap-1`}>
                <div
                  className={`w-3 h-3 rounded-full ${
                    loginStatus[info.type] ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {loginStatus[info.type] ? '已登录' : '未登录'}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleLogin(info.type)}
              disabled={isLoggingIn[info.type] || loginStatus[info.type]}
              className={`w-full px-4 py-2 rounded-lg text-white transition-colors ${
                loginStatus[info.type]
                  ? 'bg-gray-400 cursor-not-allowed'
                  : `${info.color} hover:opacity-90`
              }`}
            >
              {isLoggingIn[info.type] ? '登录中...' : loginStatus[info.type] ? '已登录' : '登录'}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-700">
          💡 提示：点击登录按钮后，会在新窗口中打开网盘页面，请在浏览器中完成登录。
        </p>
      </div>
    </div>
  );
};
