import React, { useState } from 'react';
import { AccountPage } from './pages/AccountPage';
import { TransferPage } from './pages/TransferPage';

type PageType = 'account' | 'transfer' | 'share' | 'file' | 'monitor';

const pages: { type: PageType; label: string; icon: string }[] = [
  { type: 'account', label: '账号管理', icon: '🔐' },
  { type: 'transfer', label: '批量转存', icon: '📤' },
  { type: 'share', label: '批量分享', icon: '🔗' },
  { type: 'file', label: '文件管理', icon: '📁' },
  { type: 'monitor', label: '资源监控', icon: '👁️' }
];

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('transfer');

  const renderPage = () => {
    switch (currentPage) {
      case 'account':
        return <AccountPage />;
      case 'transfer':
        return <TransferPage />;
      case 'share':
      case 'file':
      case 'monitor':
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <p className="text-gray-500">该功能正在开发中...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="text-3xl">☁️</div>
            <div>
              <h1 className="font-bold text-gray-800">PanTools</h1>
              <p className="text-xs text-gray-500">v2.0.0</p>
            </div>
          </div>
        </div>

        <nav className="p-2">
          {pages.map(page => (
            <button
              key={page.type}
              onClick={() => setCurrentPage(page.type)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                currentPage === page.type
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{page.icon}</span>
              <span className="font-medium">{page.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="text-xs text-gray-400 text-center">
            © 2026 PanTools
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
