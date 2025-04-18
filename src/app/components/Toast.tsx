import React, { useState, useEffect } from 'react';
import { toast, ToastMessage } from '../utils/toast'; // 引入toast服务

// Toast容器组件 - 用于呈现Toast消息
export const ToastContainer: React.FC = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  // 订阅toast消息更新
  useEffect(() => {
    const unsubscribe = toast.subscribe(setMessages);
    return () => unsubscribe();
  }, []);

  // 根据toast类型获取对应的DaisyUI alert类名
  const getAlertClass = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'info':
      default:
        return 'alert-info';
    }
  };

  // 手动关闭toast
  const handleClose = (id: number) => {
    toast.removeToast(id);
  };

  return (
    <div className="toast toast-end toast-bottom z-50">
      {messages.map((toast) => (
        <div 
          key={toast.id} 
          className={`alert ${getAlertClass(toast.type)}`}
        >
          <div>
            {toast.type === 'info' && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            {toast.type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {toast.type === 'warning' && <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            {toast.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            <span>{toast.message}</span>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => handleClose(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
};