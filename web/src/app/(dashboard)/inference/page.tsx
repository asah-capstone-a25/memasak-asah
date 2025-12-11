// web/src/app/(dashboard)/inference/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ArrowLeft, Sparkles, TrendingUp, RefreshCw, User, DollarSign, Phone } from 'lucide-react';
import Link from 'next/link';

const jobOptions = ['management', 'technician', 'entrepreneur', 'blue-collar', 'unknown', 'retired', 'admin', 'services', 'self-employed', 'unemployed', 'housemaid', 'student'];
const maritalOptions = ['married', 'single', 'divorced'];
const educationOptions = ['primary', 'secondary', 'tertiary', 'unknown'];
const yesNoOptions = ['yes', 'no'];
const contactOptions = ['cellular', 'telephone', 'unknown'];
const monthOptions = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const poutcomeOptions = ['success', 'failure', 'other', 'unknown'];

export default function InferencePage() {
  const [formData, setFormData] = useState({
    age: 30,
    job: 'management',
    marital: 'married',
    education: 'tertiary',
    default: 'no',
    balance: 1000,
    housing: 'yes',
    loan: 'no',
    contact: 'cellular',
    day: 15,
    month: 'may',
    campaign: 1,
    pdays: -1,
    previous: 0,
    poutcome: 'unknown',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/inference/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scoring failed');
      }

      setResult(data.data.prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score lead');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setFormData({
      age: 30,
      job: 'management',
      marital: 'married',
      education: 'tertiary',
      default: 'no',
      balance: 1000,
      housing: 'yes',
      loan: 'no',
      contact: 'cellular',
      day: 15,
      month: 'may',
      campaign: 1,
      pdays: -1,
      previous: 0,
      poutcome: 'unknown',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4 hover:bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-primary-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Quick Score</h1>
              </div>
              <p className="text-gray-600">
                Get instant AI prediction for a single lead without saving to database
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Demographics Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <User className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Demographics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Age"
                      type="number"
                      value={formData.age}
                      onChange={(v) => handleChange('age', Number(v))}
                      min={18}
                      max={100}
                      placeholder="30"
                    />
                    <FormSelect
                      label="Job"
                      value={formData.job}
                      onChange={(v) => handleChange('job', v)}
                      options={jobOptions}
                    />
                    <FormSelect
                      label="Marital Status"
                      value={formData.marital}
                      onChange={(v) => handleChange('marital', v)}
                      options={maritalOptions}
                    />
                    <FormSelect
                      label="Education"
                      value={formData.education}
                      onChange={(v) => handleChange('education', v)}
                      options={educationOptions}
                    />
                  </div>
                </div>

                {/* Financial Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <DollarSign className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Account Balance"
                      type="number"
                      value={formData.balance}
                      onChange={(v) => handleChange('balance', Number(v))}
                      placeholder="1000"
                    />
                    <FormSelect
                      label="Credit Default"
                      value={formData.default}
                      onChange={(v) => handleChange('default', v)}
                      options={yesNoOptions}
                    />
                    <FormSelect
                      label="Housing Loan"
                      value={formData.housing}
                      onChange={(v) => handleChange('housing', v)}
                      options={yesNoOptions}
                    />
                    <FormSelect
                      label="Personal Loan"
                      value={formData.loan}
                      onChange={(v) => handleChange('loan', v)}
                      options={yesNoOptions}
                    />
                  </div>
                </div>

                {/* Campaign Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <Phone className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Campaign Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormSelect
                      label="Contact Type"
                      value={formData.contact}
                      onChange={(v) => handleChange('contact', v)}
                      options={contactOptions}
                    />
                    <FormInput
                      label="Contact Day"
                      type="number"
                      value={formData.day}
                      onChange={(v) => handleChange('day', Number(v))}
                      min={1}
                      max={31}
                      placeholder="15"
                    />
                    <FormSelect
                      label="Contact Month"
                      value={formData.month}
                      onChange={(v) => handleChange('month', v)}
                      options={monthOptions}
                    />
                    <FormInput
                      label="Campaign Contacts"
                      type="number"
                      value={formData.campaign}
                      onChange={(v) => handleChange('campaign', Number(v))}
                      min={1}
                      placeholder="1"
                    />
                    <FormInput
                      label="Days Since Previous"
                      type="number"
                      value={formData.pdays}
                      onChange={(v) => handleChange('pdays', Number(v))}
                      min={-1}
                      placeholder="-1 (never contacted)"
                      helper="-1 if never contacted before"
                    />
                    <FormInput
                      label="Previous Contacts"
                      type="number"
                      value={formData.previous}
                      onChange={(v) => handleChange('previous', Number(v))}
                      min={0}
                      placeholder="0"
                    />
                    <FormSelect
                      label="Previous Outcome"
                      value={formData.poutcome}
                      onChange={(v) => handleChange('poutcome', v)}
                      options={poutcomeOptions}
                      className="md:col-span-2 lg:col-span-3"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 animate-in fade-in duration-300">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!result && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleReset}
                      disabled={loading}
                      className="sm:flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Form
                    </Button>
                    <Button 
                      type="submit" 
                      loading={loading}
                      disabled={loading}
                      className="sm:flex-1"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Scoring...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Get AI Score
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Result in Form */}
                {result && (
                  <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl p-6">
                      <div className="flex items-start space-x-3 mb-6">
                        <div className="p-2 bg-primary-500 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-primary-900 mb-1">
                            Prediction Complete!
                          </h4>
                          <p className="text-sm text-primary-700">
                            AI model has analyzed the lead profile
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4 border border-primary-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">Conversion Probability</p>
                          <p className="text-3xl font-bold text-primary-600">
                            {(result.probability * 100).toFixed(1)}%
                          </p>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${result.probability * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-primary-200">
                          <p className="text-xs font-medium text-gray-600 mb-2">Risk Level</p>
                          <span className={`inline-flex px-3 py-1.5 text-sm font-bold rounded-lg ${
                            result.risk_level === 'High' ? 'bg-green-500 text-white' :
                            result.risk_level === 'Medium' ? 'bg-yellow-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {result.risk_level}
                          </span>
                          <p className="text-xs text-gray-600 mt-2">
                            Prediction: <span className="font-bold text-gray-900">{result.prediction_label.toUpperCase()}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleReset}
                          className="flex-1 bg-white hover:bg-gray-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Score Another Lead
                        </Button>
                        <Link href="/campaigns/upload" className="flex-1">
                          <Button type="button" className="w-full">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upload Campaign
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Quick Guide */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Guide</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    1
                  </div>
                  <p className="text-gray-600">Fill in customer demographics and financial information</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    2
                  </div>
                  <p className="text-gray-600">Add campaign contact details</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    3
                  </div>
                  <p className="text-gray-600">Click "Get AI Score" for instant prediction</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    4
                  </div>
                  <p className="text-gray-600">Results are displayed instantly without saving to database</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Pro Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>High probability = Higher chance of conversion</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Focus on High risk level leads first</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use bulk upload for large campaigns</span>
                </li>
              </ul>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">Note</p>
                  <p className="text-sm text-amber-800">
                    This is for quick testing only. Results are not saved to the database. 
                    For bulk scoring, use the Campaign Upload feature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Form Components
function FormInput({ label, value, onChange, type = 'text', min, max, placeholder, helper, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:border-gray-400"
      />
      {helper && (
        <p className="text-xs text-gray-500 mt-1">{helper}</p>
      )}
    </div>
  );
}

function FormSelect({ label, value, onChange, options, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all hover:border-gray-400 capitalize"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt} className="capitalize">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}