import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onLogout?: () => void;
  userName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onLogout, userName }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* 
        CONTAINER LOGIC:
        Mobile (< md): Keeps the simulated mobile app frame (max-w-md, rounded).
        Desktop (>= md): Expands to full width, removes the 'phone frame' look.
      */}
      <div className="w-full md:max-w-full md:bg-transparent min-h-screen flex flex-col md:block relative">
        
        {/* Header */}
        <header className="bg-primary-600 text-white shadow-lg z-10 
          md:flex md:items-center md:justify-between md:px-8 md:py-4 md:rounded-none
          p-4 pb-12 rounded-b-[2.5rem] max-w-md mx-auto md:max-w-full w-full relative"
        >
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg hidden md:block">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Ponto AMD!</h1>
            </div>
            
            {/* Mobile Logout (Top Right of Phone Frame) */}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="md:hidden text-primary-100 hover:text-white text-sm font-medium bg-primary-700/50 px-3 py-1 rounded-full backdrop-blur-sm"
              >
                Sair
              </button>
            )}
          </div>

          {/* Desktop User Info & Logout */}
          <div className="hidden md:flex items-center gap-6">
            {title && (
              <div className="text-right">
                 <p className="text-primary-100 text-xs uppercase tracking-wider">{title}</p>
                 <h2 className="text-lg font-bold">{userName || 'Usuário'}</h2>
              </div>
            )}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="bg-white text-primary-700 hover:bg-primary-50 px-6 py-2 rounded-lg font-bold shadow-sm transition-all"
              >
                Sair
              </button>
            )}
          </div>

          {/* Mobile User Info (Inside Green Header) */}
          <div className="md:hidden mt-4">
            {title && (
              <div>
                 <p className="text-primary-100 text-sm">Bem-vindo,</p>
                 <h2 className="text-2xl font-bold">{userName || 'Usuário'}</h2>
                 <p className="text-primary-200 text-xs mt-1 uppercase tracking-wider">{title}</p>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-5 -mt-8 md:mt-0 relative z-20 pb-8 w-full max-w-md mx-auto md:max-w-7xl md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};