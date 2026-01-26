import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export function Auth() {
  const { isAuthModalOpen, toggleAuthModal } = useUIStore();
  const { signIn, signUp, loading, error } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
    // On successful login/signup, the onAuthStateChanged listener will handle the state,
    // and we might want to close the modal. For now, we'll leave it open to show errors.
    // A successful action could trigger a state change that closes this modal.
  };

  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-sm m-4">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Login' : 'Sign Up'}</h2>
            <button onClick={toggleAuthModal} className="text-gray-400 hover:text-white transition-colors">&times;</button>
          </div>
          <p className="text-gray-400 mb-6">
            {isLogin ? 'Access your saved designs.' : 'Create an account to save your designs.'}
          </p>

          <div className="flex border-b border-gray-600 mb-6">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-medium ${isLogin ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-medium ${!isLogin ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
