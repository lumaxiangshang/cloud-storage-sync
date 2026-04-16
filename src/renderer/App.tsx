import React, { useEffect, useCallback } from 'react';
import { useAppStore } from './store';
import { LoginPanel } from './components/LoginPanel';
import { TaskForm } from './components/TaskForm';
import { TaskCard } from './components/TaskCard';

function App() {
  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    startTask,
    deleteTask,
    loginDriver,
    checkLogin,
    clearError
  } = useAppStore();

  useEffect(() => {
    fetchTasks();
    // 定期刷新任务列表
    const interval = setInterval(() => {
      fetchTasks();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleCreateTask = useCallback(
    (sourceUrl: string, sourceType: any, targetType: any) => {
      createTask(sourceUrl, sourceType, targetType);
    },
    [createTask]
  );

  const handleStartTask = useCallback(
    (taskId: string) => {
      startTask(taskId);
    },
    [startTask]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      deleteTask(taskId);
    },
    [deleteTask]
  );

  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('链接已复制到剪贴板！');
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">☁️</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">网盘转存工具</h1>
                <p className="text-sm text-gray-500">支持百度网盘、夸克网盘、迅雷网盘</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              v1.0.0
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Login Panel */}
        <LoginPanel onLogin={loginDriver} onCheckLogin={checkLogin} />

        {/* Task Form */}
        <TaskForm onSubmit={handleCreateTask} isLoading={isLoading} />

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">任务列表</h2>
            <span className="text-sm text-gray-500">
              共 {tasks.length} 个任务
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500">暂无任务，请在上方创建转存任务</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onDelete={handleDeleteTask}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 网盘转存工具 | 仅供学习使用</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
