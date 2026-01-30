import React from 'react';
import {
    Compass,
    LayoutGrid,
    Layers,
    Zap,
    MessageSquare,
    Search,
    Twitter,
    Youtube,
    Linkedin,
    Github,
    Wallet
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface SidebarProps {
    currentView: 'dashboard' | 'canvas';
    onNavigate: (view: 'dashboard' | 'canvas') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
    return (
        <div className="w-64 h-full bg-dark-sidebar border-r border-dark-border flex flex-col p-4 z-50">
            {/* User Profile / Brand */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha"
                        alt="User"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary-DEFAULT">Alpha Hunter</span>
                    <span className="text-xs text-primary-muted">Pro Trader</span>
                </div>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto space-y-8">

                {/* Explore Group */}
                <div>
                    <h3 className="text-xs font-medium text-primary-muted mb-3 px-2 uppercase tracking-wider">Explore</h3>
                    <div className="space-y-1">
                        <NavItem
                            icon={<Compass size={18} />}
                            label="Dashboard"
                            active={currentView === 'dashboard'}
                            onClick={() => onNavigate('dashboard')}
                        />
                        <NavItem icon={<LayoutGrid size={18} />} label="Market" />
                        <NavItem
                            icon={<Layers size={18} />}
                            label="Strategy Canvas"
                            active={currentView === 'canvas'}
                            onClick={() => onNavigate('canvas')}
                        />
                    </div>
                </div>

                {/* Resources Group */}
                <div>
                    <h3 className="text-xs font-medium text-primary-muted mb-3 px-2 uppercase tracking-wider">Resources</h3>
                    <div className="space-y-1">
                        <NavItem icon={<Zap size={18} />} label="New Pairs" />
                        <NavItem icon={<MessageSquare size={18} />} label="Analysis" />
                        <NavItem icon={<Wallet size={18} />} label="Portfolio" />
                    </div>
                </div>

                {/* Connect Group */}
                <div>
                    <h3 className="text-xs font-medium text-primary-muted mb-3 px-2 uppercase tracking-wider">Connect</h3>
                    <div className="space-y-1">
                        <NavItem icon={<Twitter size={18} />} label="Twitter" />
                        <NavItem icon={<Linkedin size={18} />} label="LinkedIn" />
                        <NavItem icon={<Youtube size={18} />} label="YouTube" />
                    </div>
                </div>

            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-4 border-t border-dark-border">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={14} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-dark-bg border border-dark-border rounded-lg py-2 pl-9 pr-3 text-sm text-primary-DEFAULT placeholder:text-primary-muted focus:outline-none focus:border-primary-muted transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[10px] text-primary-muted border border-dark-border px-1.5 rounded">
                        S
                    </div>
                </div>
            </div>
        </div>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    count?: number;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, count, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`
      w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-all duration-200 group
      ${active
                    ? 'text-primary-DEFAULT bg-dark-hover'
                    : 'text-primary-muted hover:text-primary-DEFAULT hover:bg-dark-hover'}
    `}>
            <div className="flex items-center gap-3">
                <span className={`${active ? 'text-primary-DEFAULT' : 'text-primary-muted group-hover:text-primary-DEFAULT'}`}>
                    {icon}
                </span>
                <span>{label}</span>
            </div>
            {count && (
                <span className="text-xs text-primary-muted group-hover:text-primary-DEFAULT transition-colors">
                    {count}
                </span>
            )}
        </button>
    );
};

export default Sidebar;
