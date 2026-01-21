
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2, BrainCircuit } from 'lucide-react';

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.includes('auth/') ? 'Error de credenciales. Verifica tus datos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="mb-8 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
          <BrainCircuit size={40} />
        </div>
        <h1 className="text-3xl font-bold">Cerebro Digital</h1>
        <p className="text-slate-400 mt-2">Tu sistema operativo vital.</p>
      </div>

      <div className="w-full max-w-sm bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="flex mb-6 bg-slate-700/50 p-1 rounded-xl">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`}>Entrar</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`}>Registrar</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
            <input 
              type="email" 
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthView;
