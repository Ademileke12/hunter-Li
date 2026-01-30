import React, { ReactNode } from 'react';
import Sidebar from '../Sidebar/Sidebar';

interface DashboardLayoutProps {
    children: ReactNode;
    currentView: 'dashboard' | 'canvas';
    onNavigate: (view: 'dashboard' | 'canvas') => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentView, onNavigate }) => {
    return (
        <div className="flex h-screen w-full bg-dark-bg text-primary-DEFAULT overflow-hidden">
            <Sidebar currentView={currentView} onNavigate={onNavigate} />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
                <div className="max-w-7xl mx-auto p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
