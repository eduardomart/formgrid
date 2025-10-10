import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: '📊' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
]

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth()
    const sidebarRef = useRef<HTMLDivElement>(null)

    // Focus trap for mobile menu
    useEffect(() => {
        if (isOpen && sidebarRef.current) {
            const focusableElements = sidebarRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

            const handleTabKey = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement?.focus()
                            e.preventDefault()
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement?.focus()
                            e.preventDefault()
                        }
                    }
                }
                if (e.key === 'Escape') {
                    onClose()
                }
            }

            document.addEventListener('keydown', handleTabKey)
            firstElement?.focus()

            return () => {
                document.removeEventListener('keydown', handleTabKey)
            }
        }
    }, [isOpen, onClose])

    const handleLogout = () => {
        logout()
        onClose()
    }

    const getUserInitials = (email: string) => {
        return email.charAt(0).toUpperCase()
    }

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm border-r border-gray-200">
                    <div className="flex h-16 shrink-0 items-center">
                        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                    </div>

                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <NavLink
                                                to={item.href}
                                                className={({ isActive }) =>
                                                    `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${isActive
                                                        ? 'bg-gray-50 text-gray-700'
                                                        : 'text-gray-700 hover:text-gray-700 hover:bg-gray-50'
                                                    }`
                                                }
                                            >
                                                <span className="text-lg">{item.icon}</span>
                                                {item.name}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </li>

                            {/* User section */}
                            <li className="mt-auto">
                                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium">
                                        {user ? getUserInitials(user.email) : 'U'}
                                    </div>
                                    <span className="sr-only">Your profile</span>
                                    <span className="truncate">{user?.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    <span className="text-lg">🚪</span>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Mobile sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                        <button
                            onClick={onClose}
                            className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            aria-label="Close menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <NavLink
                                                to={item.href}
                                                onClick={onClose}
                                                className={({ isActive }) =>
                                                    `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${isActive
                                                        ? 'bg-gray-50 text-gray-700'
                                                        : 'text-gray-700 hover:text-gray-700 hover:bg-gray-50'
                                                    }`
                                                }
                                            >
                                                <span className="text-lg">{item.icon}</span>
                                                {item.name}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </li>

                            {/* User section */}
                            <li className="mt-auto">
                                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium">
                                        {user ? getUserInitials(user.email) : 'U'}
                                    </div>
                                    <span className="sr-only">Your profile</span>
                                    <span className="truncate">{user?.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    <span className="text-lg">🚪</span>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    )
}
