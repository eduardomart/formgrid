import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { Container } from '../components/Container'

// Zod validation schema
const signupSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters long'),
})

type SignupFormData = z.infer<typeof signupSchema>

export const SignupPage: React.FC = () => {
    const { signup } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    })

    const onSubmit = async (data: SignupFormData) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await signup({ email: data.email, password: data.password })
            setIsSuccess(true)
            reset()
        } catch (error: any) {
            setSubmitError(
                error?.response?.data?.message ||
                error?.message ||
                'Signup failed. Please try again.'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <Container>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="max-w-md w-full space-y-8">
                        <div className="text-center">
                            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                                <svg
                                    className="h-6 w-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 className="mt-6 text-3xl font-bold text-gray-900">
                                Check your email
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                We've sent a verification link to your email address.
                                Please check your inbox and click the link to verify your account.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setIsSuccess(false)}
                                    className="text-gray-600 hover:text-gray-500 font-medium"
                                >
                                    Try signing up again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <div className="min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                            Create your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <a href="/login" className="font-medium text-gray-600 hover:text-gray-500">
                                Sign in
                            </a>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    autoComplete="email"
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter your email"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    {...register('password')}
                                    type="password"
                                    autoComplete="new-password"
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter your password"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        {submitError && (
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
                                        <p className="text-sm text-red-800">{submitError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Creating account...
                                    </div>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Container>
    )
}