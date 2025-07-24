import React, { useState } from 'react';
import { User } from '@/models';
import connectToDatabase from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

interface UserStudyLoginProps {
  onLogin: (user: { userId: string; participantId: string; name: string }) => void;
}

export const UserStudyLogin: React.FC<UserStudyLoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    consentGiven: false,
    demographics: {
      age: '',
      gender: '',
      education: '',
      experience: '',
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login logic - for now just create a session
        const mockUser = {
          userId: 'user_' + Date.now(),
          participantId: 'P' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
          name: formData.email.split('@')[0] || 'Anonymous',
        };
        onLogin(mockUser);
      } else {
        // Signup logic
        if (!formData.consentGiven) {
          setError('Please provide consent to participate in the study');
          return;
        }

        await connectToDatabase();
        
        // Check if user exists
        const existingUser = await User.findOne({ email: formData.email });
        if (existingUser) {
          setError('User already exists');
          return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(formData.password, 12);
        
        // Generate participant ID
        const participantId = 'P' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        // Assign to study group (A/B testing)
        const studyGroup = Math.random() < 0.5 ? 'control' : 'experimental';

        // Create user
        const newUser = new User({
          email: formData.email,
          password: hashedPassword,
          name: formData.name,
          participantId,
          studyGroup,
          demographics: {
            age: parseInt(formData.demographics.age) || undefined,
            gender: formData.demographics.gender,
            education: formData.demographics.education,
            experience: formData.demographics.experience,
          },
          consentGiven: formData.consentGiven,
        });

        await newUser.save();

        onLogin({
          userId: newUser._id.toString(),
          participantId: newUser.participantId,
          name: (newUser as any).name || (newUser as any).username || formData.name,
        });
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Study Login' : 'Study Registration'}
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            {isLogin 
              ? 'Welcome back to the narrative visualization study' 
              : 'Join our narrative visualization research study'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.demographics.age}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      demographics: { ...formData.demographics, age: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="18"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.demographics.gender}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      demographics: { ...formData.demographics, gender: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Level
                </label>
                <select
                  value={formData.demographics.education}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    demographics: { ...formData.demographics, education: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="high-school">High School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="phd">PhD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Visualization Experience
                </label>
                <select
                  value={formData.demographics.experience}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    demographics: { ...formData.demographics, experience: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="none">No experience</option>
                  <option value="basic">Basic (spreadsheets, simple charts)</option>
                  <option value="intermediate">Intermediate (Tableau, Power BI)</option>
                  <option value="advanced">Advanced (D3.js, custom tools)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Study Consent</h4>
                <p className="text-sm text-blue-700 mb-3">
                  By participating in this study, you agree to allow us to collect and analyze your interaction data 
                  for research purposes. All data will be anonymized and used solely for academic research.
                </p>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-blue-800">
                    I consent to participate in this research study
                  </span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Join Study')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 text-sm hover:underline"
          >
            {isLogin ? 'New participant? Register here' : 'Already registered? Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};
