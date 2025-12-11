// web/src/components/layout/header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Home, Upload, Zap, Menu, X, BarChart3 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  // Navigation items with badges
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, badge: null },
    { href: '/campaigns/upload', label: 'Upload', icon: Upload, badge: null },
    { href: '/inference', label: 'Quick Score', icon: Zap, badge: 'AI' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  return (
    <header 
      className={`bg-white border-b sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-gray-300 shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left side - Logo & Navigation */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="h-9 w-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              <BarChart3 className="text-white" size={20} />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                LeadScore
              </span>
              <p className="text-[10px] text-gray-500 -mt-0.5">AI-Powered</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={active ? 'animate-pulse' : ''} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <button className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-all hover:scale-105 hidden sm:block">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
            >
              <div className="h-9 w-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center ring-2 ring-white">
                <User size={18} className="text-primary-600" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'user'}
                </p>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 hidden lg:block transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                    {user?.role}
                  </span>
                </div>
                
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors group">
                    <Settings size={16} className="mr-3 text-gray-400 group-hover:text-primary-500 transition-colors" />
                    <span>Account Settings</span>
                  </button>
                </div>
                
                <div className="border-t border-gray-100 my-1" />
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors group"
                >
                  <LogOut size={16} className="mr-3 group-hover:translate-x-0.5 transition-transform" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white animate-in slide-in-from-top duration-200">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}