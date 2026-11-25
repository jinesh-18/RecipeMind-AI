import React, { useState } from 'react';
import {
  ChefHat, LayoutDashboard, Database, MessageSquare, Sparkles,
  ShoppingCart, Heart, Settings, Menu, X, ChevronRight
} from 'lucide-react';
import type { NavSection } from '../../types';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

const navItems: { section: NavSection; label: string; icon: React.ReactNode; badge?: string }[] = [
  { section: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { section: 'knowledge-base', label: 'Knowledge Base', icon: <Database size={18} /> },
  { section: 'assistant', label: 'AI Assistant', icon: <MessageSquare size={18} /> },
  { section: 'generator', label: 'Recipe Generator', icon: <Sparkles size={18} /> },
  { section: 'shopping-list', label: 'Shopping List', icon: <ShoppingCart size={18} /> },
  { section: 'favorites', label: 'Favorites & History', icon: <Heart size={18} /> },
  { section: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

function NavItem({
  item,
  active,
  onClick,
  collapsed,
}: {
  item: (typeof navItems)[0];
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
        active
          ? 'bg-green-700 text-white shadow-sm'
          : 'text-green-100 hover:bg-green-700/60 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{item.label}</span>
          {active && <ChevronRight size={14} />}
        </>
      )}
    </button>
  );
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-green-700/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
          <ChefHat size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-base leading-tight">RecipeMind</div>
            <div className="text-green-300 text-xs">AI Cooking Assistant</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem
            key={item.section}
            item={item}
            active={activeSection === item.section}
            onClick={() => { onNavigate(item.section); setMobileOpen(false); }}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* IBM Badge */}
      {!collapsed && (
        <div className="px-3 pb-4">
          <div className="bg-green-900/50 rounded-lg p-3 text-xs text-green-300">
            <div className="font-semibold text-green-200 mb-1">IBM Integration Ready</div>
            <div>Granite · watsonx · Cloud</div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-green-300 hover:bg-green-700/60 hover:text-white transition-colors text-xs cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <><Menu size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#1f5020] transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} shrink-0 h-screen sticky top-0`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#1f5020] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base">RecipeMind AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-white hover:bg-green-700/60 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-40 bg-[#1f5020]">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
