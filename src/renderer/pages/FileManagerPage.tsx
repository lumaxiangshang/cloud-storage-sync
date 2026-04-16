import React, { useState, useEffect } from 'react';
import { CloudStorageType } from '../../shared/types';

const storageOptions: { value: CloudStorageType; label: string; icon: string }[] = [
  { value: 'baidu', label: '百度网盘', icon: '🐼' },
  { value: 'quark', label: '夸克网盘', icon: '🚀' },
  { value: 'xunlei', label: '迅雷网盘', icon: '⚡' }
];

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedAt?: Date;
  isSelected?: boolean;
}

export const FileManagerPage: React.FC = () => {
  const [storageType, setStorageType] = useState<CloudStorageType>('baidu');
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameRule, setRenameRule] = useState<'prefix' | 'suffix' | 'replace' | 'sequence'>('prefix');
  const [renameValue, setRenameValue] = useState('');
  const [renameOldValue, setRenameOldValue] = useState('');
  const [showDeleteAdModal, setShowDeleteAdModal] = useState(false);
  const [adKeywords, setAdKeywords] = useState('广告,AD,推广,营销');

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const loadFiles = async () => {
    setLoading(true);
    // 模拟加载
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockFiles: FileItem[] = [
      {
        id: '1',
        name: '我的文档',
        path: '/我的文档',
        type: 'folder',
        modifiedAt: new Date()
      },
      {
        id: '2',
        name: '视频教程',
        path: '/视频教程',
        type: 'folder',
        modifiedAt: new Date()
      },
      {
        id: '3',
        name: '重要资料.pdf',
        path: '/重要资料.pdf',
        type: 'file',
        size: 1024 * 1024 * 5,
        modifiedAt: new Date()
      },
      {
        id: '4',
        name: '广告-推广文件.docx',
        path: '/广告-推广文件.docx',
        type: 'file',
        size: 1024 * 100,
        modifiedAt: new Date()
      },
      {
        id: '5',
        name: '备份文件.zip',
        path: '/备份文件.zip',
        type: 'file',
        size: 1024 * 1024 * 100,
        modifiedAt: new Date()
      }
    ];

    setFiles(mockFiles);
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [storageType, currentPath]);

  const toggleSelect = (id: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, isSelected: !f.isSelected } : f
    ));
  };

  const selectAll = () => {
    const allSelected = files.every(f => f.isSelected);
    setFiles(prev => prev.map(f => ({ ...f, isSelected: !allSelected })));
  };

  const getSelectedFiles = () => files.filter(f => f.isSelected);

  const handleDelete = () => {
    const selected = getSelectedFiles();
    if (selected.length === 0) {
      alert('请先选择文件');
      return;
    }
    if (confirm(`确定要删除选中的 ${selected.length} 个文件吗？`)) {
      setFiles(prev => prev.filter(f => !f.isSelected));
    }
  };

  const handleBatchRename = () => {
    if (getSelectedFiles().length === 0) {
      alert('请先选择文件');
      return;
    }
    setShowRenameModal(true);
  };

  const confirmRename = () => {
    if (!renameValue) {
      alert('请输入值');
      return;
    }
    // 模拟重命名
    alert(`已批量重命名 ${getSelectedFiles().length} 个文件`);
    setShowRenameModal(false);
  };

  const handleFindAdFiles = () => {
    setShowDeleteAdModal(true);
  };

  const confirmDeleteAd = () => {
    const keywords = adKeywords.split(',').map(k => k.trim());
    const adFiles = files.filter(f => 
      keywords.some(k => f.name.includes(k))
    );
    if (adFiles.length === 0) {
      alert('没有找到广告文件');
      setShowDeleteAdModal(false);
      return;
    }
    if (confirm(`找到 ${adFiles.length} 个广告文件，确定删除吗？`)) {
      setFiles(prev => prev.filter(f => 
        !keywords.some(k => f.name.includes(k))
      ));
      setShowDeleteAdModal(false);
    }
  };

  const navigateToFolder = (path: string) => {
    setCurrentPath(path);
  };

  const goBack = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length ? '/' + parts.join('/') : '/');
  };

  const selectedCount = getSelectedFiles().length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">文件管理</h1>
        <div className="flex items-center gap-2">
          <select
            value={storageType}
            onChange={(e) => setStorageType(e.target.value as CloudStorageType)}
            className="px-3 py-2 border rounded-lg"
          >
            {storageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={loadFiles}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            刷新
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* 工具栏 */}
        <div className="p-4 border-b flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {currentPath !== '/' && (
              <button
                onClick={goBack}
                className="px-3 py-1.5 border rounded hover:bg-gray-50"
              >
                ← 返回
              </button>
            )}
            <span className="text-gray-600 font-mono">{currentPath}</span>
          </div>

          <div className="flex-1" />

          {selectedCount > 0 && (
            <>
              <button
                onClick={handleBatchRename}
                className="px-3 py-1.5 border rounded hover:bg-gray-50 text-blue-600"
              >
                批量重命名 ({selectedCount})
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 border rounded hover:bg-red-50 text-red-600"
              >
                删除 ({selectedCount})
              </button>
            </>
          )}

          <button
            onClick={handleFindAdFiles}
            className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
          >
            清理广告文件
          </button>
        </div>

        {/* 文件列表 */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">
                      <input
                        type="checkbox"
                        checked={files.length > 0 && files.every(f => f.isSelected)}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-2 px-2">名称</th>
                    <th className="text-left py-2 px-2">类型</th>
                    <th className="text-left py-2 px-2">大小</th>
                    <th className="text-left py-2 px-2">修改时间</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => (
                    <tr
                      key={file.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => file.type === 'folder' && navigateToFolder(file.path)}
                    >
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={file.isSelected}
                          onChange={() => toggleSelect(file.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{file.type === 'folder' ? '📁' : '📄'}</span>
                          <span>{file.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-500">
                        {file.type === 'folder' ? '文件夹' : '文件'}
                      </td>
                      <td className="py-2 px-2 text-gray-500">
                        {formatSize(file.size)}
                      </td>
                      <td className="py-2 px-2 text-gray-500 text-sm">
                        {file.modifiedAt?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {files.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📂</div>
                  <p className="text-gray-500">文件夹为空</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 批量重命名弹窗 */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">批量重命名</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">重命名规则</label>
                <select
                  value={renameRule}
                  onChange={(e) => setRenameRule(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="prefix">添加前缀</option>
                  <option value="suffix">添加后缀</option>
                  <option value="replace">替换文本</option>
                  <option value="sequence">序号命名</option>
                </select>
              </div>

              {renameRule === 'replace' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">原文本</label>
                  <input
                    type="text"
                    value={renameOldValue}
                    onChange={(e) => setRenameOldValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="要替换的文本"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {renameRule === 'sequence' ? '文件名前缀' : '值'}
                </label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder={renameRule === 'sequence' ? '例如：文件_' : '请输入'}
                />
                {renameRule === 'sequence' && (
                  <p className="text-xs text-gray-500 mt-1">
                    结果示例：{renameValue || '文件_'}1, {renameValue || '文件_'}2...
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRenameModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmRename}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清理广告文件弹窗 */}
      {showDeleteAdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">清理广告文件</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关键词（逗号分隔）</label>
              <textarea
                value={adKeywords}
                onChange={(e) => setAdKeywords(e.target.value)}
                className="w-full px-3 py-2 border rounded h-24"
              />
              <p className="text-xs text-gray-500 mt-1">
                文件名包含这些关键词的文件将被识别为广告文件
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteAdModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteAd}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                查找并删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
