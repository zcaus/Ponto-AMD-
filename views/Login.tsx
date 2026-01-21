import React, { useState } from 'react';
import { Button } from '../components/Button';
import { UserRole, User } from '../types';
import { ShieldCheck, UserPlus, CreditCard } from 'lucide-react';
import { storageService } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(''); // CPF or Username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration state
  const [regName, setRegName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPass, setRegPass] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Clean identifier just in case user typed CPF with dots/dashes
      const cleanIdentifier = identifier.includes('.') || identifier.includes('-') 
        ? identifier.replace(/\D/g, '') 
        : identifier;

      const user = await storageService.login(cleanIdentifier, password);
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regCpf || !regPass) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanCpf = regCpf.replace(/\D/g, ''); // Store numbers only for username

      const newUser = await storageService.register(
        cleanCpf,
        regPass,
        regName,
        UserRole.EMPLOYEE
      );

      onLogin(newUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  if (isRegistering) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Criar Conta</h2>
        <p className="text-gray-500 mb-6 text-sm">Cadastre-se usando seu CPF.</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="Ex: Maria Silva"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">CPF (Somente Números)</label>
            <input 
              type="tel" 
              value={regCpf}
              onChange={(e) => setRegCpf(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
            <input 
              type="password" 
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="******"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" fullWidth className="mt-2" isLoading={loading}>
            Cadastrar e Entrar
          </Button>
          
          <button 
            type="button"
            onClick={() => { setIsRegistering(false); setError(''); }}
            className="w-full text-center text-sm text-gray-500 mt-4 hover:text-primary-600"
          >
            Já tem conta? Fazer login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600">
           <ShieldCheck className="w-8 h-8" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Login</h2>
      <p className="text-gray-500 mb-8 text-sm text-center">Entre com seu CPF e senha.</p>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">CPF ou Usuário</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="Digite seu CPF"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="Digite sua senha"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}

        <Button type="submit" fullWidth className="mt-2" isLoading={loading}>
          Entrar
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400 mb-3">Não tem uma conta?</p>
        <Button variant="secondary" fullWidth onClick={() => { setIsRegistering(true); setError(''); }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Registrar-se
        </Button>
      </div>
    </div>
  );
};