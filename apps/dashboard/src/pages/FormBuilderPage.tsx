import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useForms } from '../hooks/useForms';

interface FormSettings {
    allowMultipleSubmissions: boolean;
    requireEmailNotification: boolean;
    notificationEmail?: string;
    redirectUrl?: string;
    customCss?: string;
    customJs?: string;
    spamProtection?: {
        enabled: boolean;
        honeypot: boolean;
        rateLimit: number;
    };
    fields?: Array<{
        name: string;
        type: string;
        required: boolean;
        label: string;
    }>;
    webhookUrl?: string;
    webhookSecret?: string;
}

interface FormData {
    name: string;
    description: string;
    settings: FormSettings;
}

export function FormBuilderPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const { createForm, updateForm, loading } = useForms();

    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        settings: {
            allowMultipleSubmissions: true,
            requireEmailNotification: false,
            notificationEmail: '',
            redirectUrl: '',
            customCss: '',
            customJs: '',
            spamProtection: {
                enabled: true,
                honeypot: true,
                rateLimit: 10
            },
            fields: [
                { name: 'name', type: 'text', required: true, label: 'Name' },
                { name: 'email', type: 'email', required: true, label: 'Email' },
                { name: 'message', type: 'textarea', required: false, label: 'Message' }
            ],
            webhookUrl: '',
            webhookSecret: ''
        }
    });

    const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSettingsChange = (field: keyof FormSettings, value: any) => {
        setFormData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [field]: value
            }
        }));
    };

    const handleSpamProtectionChange = (field: keyof FormSettings['spamProtection'], value: any) => {
        setFormData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                spamProtection: {
                    ...prev.settings.spamProtection!,
                    [field]: value
                }
            }
        }));
    };

    const addNotificationEmail = () => {
        if (newEmail && !notificationEmails.includes(newEmail)) {
            setNotificationEmails(prev => [...prev, newEmail]);
            setNewEmail('');
        }
    };

    const removeNotificationEmail = (email: string) => {
        setNotificationEmails(prev => prev.filter(e => e !== email));
    };

    const addCustomField = () => {
        const fieldName = prompt('Enter field name (e.g., "phone", "company"):');
        if (fieldName) {
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    fields: [
                        ...(prev.settings.fields || []),
                        {
                            name: fieldName,
                            type: 'text',
                            required: false,
                            label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
                        }
                    ]
                }
            }));
        }
    };

    const removeCustomField = (index: number) => {
        setFormData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                fields: prev.settings.fields?.filter((_, i) => i !== index) || []
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            description: formData.description.trim() || null,
            settings: {
                ...formData.settings,
                notificationEmail: notificationEmails.join(',')
            }
        };

        try {
            if (isEdit) {
                await updateForm(id!, submitData);
            } else {
                await createForm(submitData);
            }
            navigate('/forms');
        } catch (error) {
            console.error('Error saving form:', error);
        }
    };

    const generateEndpointUrl = (name: string) => {
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        return `https://api.formapi.io/f/${slug}`;
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {isEdit ? 'Edit Form' : 'Create New Form'}
                            </h1>
                            <p className="text-gray-600">
                                {isEdit ? 'Update your form settings and configuration.' : 'Build and configure your form endpoint.'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/forms')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Form Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                                    placeholder="e.g., Contact Form"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={3}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                                    placeholder="Describe what this form is for..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Endpoint URL
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={formData.name ? generateEndpointUrl(formData.name) : ''}
                                        readOnly
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                        placeholder="Will be generated from form name"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (formData.name) {
                                                navigator.clipboard.writeText(generateEndpointUrl(formData.name));
                                            }
                                        }}
                                        className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                                        title="Copy URL"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Form Fields</h2>
                        <div className="space-y-4">
                            {formData.settings.fields?.map((field, index) => (
                                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">{field.label}</div>
                                        <div className="text-sm text-gray-500">
                                            {field.name} ({field.type}) {field.required && '• Required'}
                                        </div>
                                    </div>
                                    {index >= 3 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCustomField(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addCustomField}
                                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                            >
                                + Add Custom Field
                            </button>
                        </div>
                    </div>

                    {/* Spam Protection */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Spam Protection</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Enable Spam Protection</div>
                                    <div className="text-sm text-gray-500">Protect your form from spam submissions</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.spamProtection?.enabled || false}
                                        onChange={(e) => handleSpamProtectionChange('enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                </label>
                            </div>

                            {formData.settings.spamProtection?.enabled && (
                                <div className="ml-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Honeypot Field</div>
                                            <div className="text-sm text-gray-500">Add invisible field to catch bots</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.settings.spamProtection?.honeypot || false}
                                                onChange={(e) => handleSpamProtectionChange('honeypot', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rate Limit (submissions per hour)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.settings.spamProtection?.rateLimit || 10}
                                            onChange={(e) => handleSpamProtectionChange('rateLimit', parseInt(e.target.value))}
                                            min="1"
                                            max="100"
                                            className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Email Notifications */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Enable Email Notifications</div>
                                    <div className="text-sm text-gray-500">Get notified when someone submits your form</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.requireEmailNotification}
                                        onChange={(e) => handleSettingsChange('requireEmailNotification', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                </label>
                            </div>

                            {formData.settings.requireEmailNotification && (
                                <div className="ml-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notification Emails
                                        </label>
                                        <div className="space-y-2">
                                            {notificationEmails.map((email, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                                    <span className="text-sm text-gray-900">{email}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNotificationEmail(email)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex space-x-2">
                                                <input
                                                    type="email"
                                                    value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    placeholder="Enter email address"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addNotificationEmail}
                                                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Webhook Settings */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Webhook Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    id="webhookUrl"
                                    value={formData.settings.webhookUrl || ''}
                                    onChange={(e) => handleSettingsChange('webhookUrl', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                                    placeholder="https://your-domain.com/webhook"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    We'll send form submissions to this URL as POST requests
                                </p>
                            </div>
                            <div>
                                <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700 mb-1">
                                    Webhook Secret (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="webhookSecret"
                                    value={formData.settings.webhookSecret || ''}
                                    onChange={(e) => handleSettingsChange('webhookSecret', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                                    placeholder="Your secret key for webhook verification"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Settings */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Form Settings</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Allow Multiple Submissions</div>
                                    <div className="text-sm text-gray-500">Let users submit the form multiple times</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings.allowMultipleSubmissions}
                                        onChange={(e) => handleSettingsChange('allowMultipleSubmissions', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                                </label>
                            </div>
                            <div>
                                <label htmlFor="redirectUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                    Redirect URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    id="redirectUrl"
                                    value={formData.settings.redirectUrl || ''}
                                    onChange={(e) => handleSettingsChange('redirectUrl', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                                    placeholder="https://your-domain.com/thank-you"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Where to redirect users after successful submission
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/forms')}
                            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (isEdit ? 'Update Form' : 'Create Form')}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
