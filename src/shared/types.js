"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_EVENTS = void 0;
// IPC 通信事件
exports.IPC_EVENTS = {
    // 任务管理
    TASK_CREATE: 'task:create',
    TASK_LIST: 'task:list',
    TASK_DELETE: 'task:delete',
    TASK_START: 'task:start',
    TASK_STATUS: 'task:status',
    // 网盘操作
    DRIVER_LOGIN: 'driver:login',
    DRIVER_CHECK_LOGIN: 'driver:checkLogin',
    DRIVER_PARSE_LINK: 'driver:parseLink',
    DRIVER_SYNC: 'driver:sync',
    DRIVER_CREATE_SHARE: 'driver:createShare',
};
