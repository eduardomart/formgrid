import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface TopNavProps {
    onMenuClick: () => void
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside or pressing Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscapeKey)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscapeKey)
        }
    }, [])

    const handleLogout = () => {
        logout()
        setIsDropdownOpen(false)
    }

    const getUserInitials = (email: string) => {
        return email.charAt(0).toUpperCase()
    }

    const getUserName = (email: string) => {
        // Extract name from email (before @) and capitalize
        const name = email.split('@')[0]
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={onMenuClick}
                aria-label="Open sidebar"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                {/* Search bar placeholder */}
                <div className="relative flex flex-1 items-center">
                    <div className="hidden sm:block">
                        <div className="flex items-center gap-x-4">
                            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Right side - User menu */}
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    {/* Notifications button */}
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                        aria-label="View notifications"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </button>

                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                    {/* Profile dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            className="flex items-center p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="menu"
                            aria-label="User menu"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium">
                                {user ? getUserInitials(user.email) : 'U'}
                            </div>
                        </button>

                        {/* Dropdown menu */}
                        {isDropdownOpen && (
                            <div
                                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="user-menu-button"
                            >
                                <div className="py-1" role="none">
                                    {/* User info section */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user ? getUserName(user.email) : 'User'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {user?.email}
                                        </p>
                                    </div>

                                    {/* Navigation links */}
                                    <Link
                                        to="/dashboard/profile"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        role="menuitem"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Profile
                                    </Link>

                                    <Link
                                        to="/dashboard/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        role="menuitem"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        Settings
                                    </Link>

                                    {/* Logout button */}
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        role="menuitem"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
