import React, { useState } from 'react';
import { CloudStorageType } from '../shared/types';

// 安全获取 API
const electronAPI = (window as any).electronAPI || {
  login: async () => ({ success: true }),
  checkLogin: async () => true,
  parseLink: async () => ({ success: true, data: { title: '测试文件' } }),
  saveToDisk: async () => ({ success: true }),
  createShare: async () => ({ success: true, data: 'https://example.com/share' })
};

const storageOptions: { value: CloudStorageType; label: string; icon: string }[] = [
  { value: 'baidu', label: '百度网盘', icon: '🐼' },
  { value: 'quark', label: '夸克网盘', icon: '🚀' },
  { value: 'xunlei', label: '迅雷网盘', icon: '⚡' }
];

const SimpleApp: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedStorage, setSelectedStorage] = useState<CloudStorageType>('baidu');
  const [shareUrl, setShareUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    setMessage('正在打开浏览器...');
    
    const result = await electronAPI.login(selectedStorage);
    
    if (result.success) {
      setMessage('登录成功！');
      setStep(2);
    } else {
      setMessage('登录失败：' + result.error);
    }
  };

  const handleTransfer = async () => {
    if (!shareUrl.trim()) {
      alert('请输入分享链接');
      return;
    }
    setIsProcessing(true);
    setMessage('正在解析分享链接...');

    try {
      // 1. 解析链接
      setMessage('正在解析分享链接...');
      const parseResult = await electronAPI.parseLink(selectedStorage, shareUrl);
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      // 2. 转存文件
      setMessage('正在转存文件...');
      const saveResult = await electronAPI.saveToDisk(selectedStorage, shareUrl);
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      // 3. 提示用户手动生成分享链接（当前简化版）
      setMessage('转存成功！请在浏览器中手动生成分享链接');
      
      setTimeout(() => {
        setResultUrl('（请在浏览器中手动复制分享链接）');
        setIsProcessing(false);
        setStep(3);
      }, 2000);

    } catch (error) {
      setIsProcessing(false);
      setMessage('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(resultUrl);
    alert('链接已复制到剪贴板！');
  };

  const reset = () => {
    setStep(1);
    setShareUrl('');
    setResultUrl('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">☁️ PanTools</h1>
          <p className="text-gray-600">网盘转存工具 - 简单版</p>
        </div>

        {/* 进度指示器 */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-500'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mb-8 text-sm text-gray-500">
          <span className="w-24 text-center">登录网盘</span>
          <span className="w-24 text-center">转存资源</span>
          <span className="w-24 text-center">生成链接</span>
        </div>

        {/* 步骤内容 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-center text-gray-800">
                选择并登录网盘
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                {storageOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedStorage(opt.value)}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedStorage === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.icon}</div>
                    <div className="font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>

              {message && (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center">
                  {message}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                打开浏览器登录
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-center text-gray-800">
                输入分享链接
              </h2>

              <div className="text-center text-sm text-gray-500">
                当前网盘：{storageOptions.find(s => s.value === selectedStorage)?.icon}{' '}
                {storageOptions.find(s => s.value === selectedStorage)?.label}
              </div>

              <textarea
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg h-32 font-mono text-sm"
                placeholder="请输入网盘分享链接..."
              />

              {message && (
                <div className={`p-4 rounded-lg text-center ${
                  isProcessing ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
                >
                  上一步
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={isProcessing || !shareUrl.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isProcessing ? '处理中...' : '开始转存'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-xl font-semibold text-gray-800">转存成功！</h2>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的分享链接：
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resultUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded bg-white font-mono text-sm"
                  />
                  <button
                    onClick={copyResult}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    复制
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
                >
                  继续转存
                </button>
                <button
                  onClick={reset}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  重新开始
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-gray-400">
          PanTools v2.0 - 简化版 MVP
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;
