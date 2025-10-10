import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Container } from '../components/Container'

export const AuthCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { setTokenFromCallback } = useAuth()
    const [isProcessing, setIsProcessing] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const token = searchParams.get('token')

                if (!token) {
                    setError('No authentication token received')
                    setIsProcessing(false)
                    return
                }

                // Set the token and redirect to dashboard
                await setTokenFromCallback(token)
                navigate('/dashboard', { replace: true })
            } catch (err) {
                console.error('OAuth callback error:', err)
                setError('Authentication failed. Please try again.')
                setIsProcessing(false)
            }
        }

        handleCallback()
    }, [searchParams, navigate, setTokenFromCallback])

    if (error) {
        return (
            <Container>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-red-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Authentication Error
                                    </h3>
                                    <p className="mt-1 text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900">
                            Completing authentication...
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Please wait while we sign you in.
                        </p>
                    </div>
                </div>
            </div>
        </Container>
    )
}




