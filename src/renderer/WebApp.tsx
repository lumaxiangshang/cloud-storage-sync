import React, { useState } from 'react';
import { CloudStorageType } from '../shared/types';

const storageOptions: { value: CloudStorageType; label: string; icon: string; helpUrl: string }[] = [
  { value: 'baidu', label: '百度网盘', icon: '🐼', helpUrl: 'https://pan.baidu.com/' },
  { value: 'quark', label: '夸克网盘', icon: '🚀', helpUrl: 'https://pan.quark.cn/' },
  { value: 'xunlei', label: '迅雷网盘', icon: '⚡', helpUrl: 'https://pan.xunlei.com/' }
];

const WebApp: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedStorage, setSelectedStorage] = useState<CloudStorageType>('quark');
  const [cookieText, setCookieText] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveCookie = () => {
    const trimmed = cookieText.trim();
    if (!trimmed) {
      alert('请先粘贴 Cookie');
      return;
    }

    setMessage('Cookie 保存成功！');
    setTimeout(() => {
      setStep(2);
    }, 1000);
  };

  const handleTransfer = () => {
    if (!shareUrl.trim()) {
      alert('请输入分享链接');
      return;
    }
    setIsProcessing(true);
    setMessage('正在解析分享链接...');

    setTimeout(() => {
      setMessage('正在转存文件...');
    }, 1000);

    setTimeout(() => {
      setMessage('正在生成分享链接...');
    }, 2500);

    setTimeout(() => {
      setResultUrl('https://pan.quark.cn/s/' + Math.random().toString(36).substr(2, 12));
      setIsProcessing(false);
      setStep(3);
      setMessage('转存成功！');
    }, 4000);
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

  const openHelpUrl = () => {
    const info = storageOptions.find(s => s.value === selectedStorage);
    if (info) {
      window.open(info.helpUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">☁️ PanTools</h1>
          <p className="text-gray-600">网盘转存工具 - Web 演示版</p>
        </div>

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
          <span className="w-24 text-center">配置 Cookie</span>
          <span className="w-24 text-center">转存资源</span>
          <span className="w-24 text-center">生成链接</span>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-center text-gray-800">
                配置网盘 Cookie
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

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-yellow-800">📖 获取 Cookie 步骤：</span>
                  <button
                    onClick={openHelpUrl}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    打开网盘 →
                  </button>
                </div>
                <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
                  <li>点击上方按钮打开网盘并登录</li>
                  <li>按 F12 打开开发者工具</li>
                  <li>切换到 Network 面板</li>
                  <li>刷新页面，找到请求</li>
                  <li>复制 Cookie 完整字符串</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  粘贴 Cookie：
                </label>
                <textarea
                  value={cookieText}
                  onChange={(e) => setCookieText(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg h-40 font-mono text-sm"
                  placeholder="在这里粘贴从浏览器复制的 Cookie..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ 请确保 Cookie 前后没有空格或空行
                </p>
              </div>

              {message && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center">
                  {message}
                </div>
              )}

              <button
                onClick={handleSaveCookie}
                disabled={!cookieText.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                保存并下一步
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
          PanTools v2.1 - Web 演示版（UI 预览）
        </div>
      </div>
    </div>
  );
};

export default WebApp;
