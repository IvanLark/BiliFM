// Toast消息类型
export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number; // 显示时长，毫秒
}

// 使用简单的事件发布/订阅模式
type Listener = (messages: ToastMessage[]) => void;
let listeners: Listener[] = [];
let toastMessages: ToastMessage[] = [];
let nextId = 0;

// 默认显示时长
const defaultDuration = 1500;

// Toast服务对象，用于在应用中的任何地方触发Toast
export const toast = {
  // 订阅消息更新
  subscribe: (listener: Listener): (() => void) => {
    listeners.push(listener);
    // 立即提供当前消息状态
    listener(toastMessages);
    // 返回取消订阅函数
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  
  // 添加新Toast
  addToast: (message: string, type: ToastMessage['type'], duration: number = defaultDuration) => {
    const id = nextId++;
    const newToast: ToastMessage = { id, message, type, duration };
    
    // 使用栈结构 - 新消息添加到数组末尾
    toastMessages = [...toastMessages, newToast];
    
    // 通知所有监听者
    listeners.forEach(listener => listener(toastMessages));

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        toast.removeToast(id);
      }, duration);
    }
  },
  
  // 移除Toast
  removeToast: (id: number) => {
    toastMessages = toastMessages.filter(toast => toast.id !== id);
    listeners.forEach(listener => listener(toastMessages));
  },
  
  // 便捷方法 - 显示不同类型的Toast
  info: (message: string, duration?: number) => {
    toast.addToast(message, 'info', duration);
  },
  
  success: (message: string, duration?: number) => {
    toast.addToast(message, 'success', duration);
  },
  
  error: (message: string, duration?: number) => {
    toast.addToast(message, 'error', duration ?? 5000); // 错误消息默认显示更长时间
  },
  
  warning: (message: string, duration?: number) => {
    toast.addToast(message, 'warning', duration);
  },
};

// 阻止修改toast对象
Object.freeze(toast);