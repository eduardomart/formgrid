import { Link } from 'react-router-dom'
import { Container } from '../components/Container'

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Container>
                <div className="flex-center min-h-screen text-center">
                    <div className="max-w-4xl">
                        <h1 className="heading-1 mb-6">
                            Form Endpoint API{' '}
                            <span className="text-gray-900">Generator</span>
                        </h1>
                        <p className="text-xl text-muted mb-8 leading-relaxed">
                            Transform any HTML form into a powerful API endpoint. Generate secure,
                            spam-protected form endpoints that work with any website or application.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Easy Integration</h3>
                                <p className="text-gray-600">Simply point your HTML form action to our generated endpoint URL</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Spam Protection</h3>
                                <p className="text-gray-600">Built-in honeypot fields and rate limiting to prevent spam</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Email Notifications</h3>
                                <p className="text-gray-600">Get instant email notifications when forms are submitted</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signup" className="btn hover:bg-gray-700 bg-gray-900 text-white btn-lg">
                                Get Started
                            </Link>
                            <Link to="/login" className="btn btn-outline border-2 border-gray-900 text-gray-900 btn-lg">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    )
}
