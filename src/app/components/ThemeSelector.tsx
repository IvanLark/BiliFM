import React, { useEffect, useState, useRef } from 'react';

interface Theme {
  id: string;
  name: string;
}

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  inSettingsModal?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  inSettingsModal = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 预设主题列表
  const themes: Theme[] = [
    { id: 'light', name: '明亮' },
    { id: 'dark', name: '暗黑' },
    { id: 'cupcake', name: '蛋糕' },
    { id: 'bumblebee', name: '蜜蜂' },
    { id: 'emerald', name: '祖母绿' },
    { id: 'corporate', name: '企业' },
    { id: 'synthwave', name: '合成波' },
    { id: 'retro', name: '复古' },
    { id: 'cyberpunk', name: '赛博朋克' },
    { id: 'valentine', name: '情人节' },
    { id: 'halloween', name: '万圣节' },
    { id: 'garden', name: '花园' },
    { id: 'forest', name: '森林' },
    { id: 'aqua', name: '水色' },
    { id: 'lofi', name: '低保真' },
    { id: 'pastel', name: '柔和' },
    { id: 'fantasy', name: '梦幻' },
    { id: 'dracula', name: '德古拉' },
    { id: 'cmyk', name: '印刷色' },
    { id: 'autumn', name: '秋天' },
    { id: 'business', name: '商务' },
    { id: 'acid', name: '酸性' },
    { id: 'lemonade', name: '柠檬水' },
    { id: 'night', name: '夜晚' },
    { id: 'coffee', name: '咖啡' },
    { id: 'winter', name: '冬天' }
  ];

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    // 如果在设置模态框内，不需要点击外部关闭逻辑
    if (inSettingsModal) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inSettingsModal]);

  // 切换主题
  const handleThemeChange = (themeId: string) => {
    onThemeChange(themeId);
    setIsOpen(false);
  };

  // 获取当前主题名称
  const getCurrentThemeName = (): string => {
    const theme = themes.find(t => t.id === currentTheme);
    return theme ? theme.name : '默认主题';
  };

  // 如果在设置模态框中，显示完整主题选择器
  if (inSettingsModal) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`btn btn-sm ${currentTheme === theme.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleThemeChange(theme.id)}
          >
            {theme.name}
          </button>
        ))}
      </div>
    );
  }

  // 默认显示下拉菜单形式
  return (
    <div className="theme-selector dropdown dropdown-end" ref={menuRef}>
      <button 
        className="btn btn-sm btn-ghost"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="切换主题"
        title="切换主题"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
        </svg>
        <span className="hidden md:inline">{getCurrentThemeName()}</span>
      </button>
      
      {isOpen && (
        <ul className="dropdown-content z-[999] menu menu-sm p-2 shadow bg-base-200 rounded-box max-h-80 overflow-y-auto mt-4 w-52">
          {themes.map(theme => (
            <li key={theme.id}>
              <button
                className={`${currentTheme === theme.id ? 'active bg-primary text-primary-content' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
              >
                {theme.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThemeSelector;