import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../../api/auth';
import { setCredentials, selectIsAuthenticated } from '../../store/authSlice';
import { User, Lock, Eye, EyeOff, Grid3X3, ShieldCheck, TrendingUp, Headphones, Box } from 'lucide-react';

import bg from '../../assets/bg.jpg';
import logo from '../../assets/logo.png';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [login, { isLoading }] = useLoginMutation();

  const from = location.state?.from?.pathname || '/';

  // Load saved username and remember status on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login({ username, password, rememberMe }).unwrap();

      // Handle local state persistence for username
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      dispatch(setCredentials({ user: result.user }));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-row overflow-hidden">
      {/* Left Column: Visuals & Welcome */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 overflow-hidden bg-blue-600/5">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">

          <div className="absolute inset-0 bg-[#f38820] mix-blend-multiply"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-start gap-6 max-w-full">
          <img
            alt="Office Background"
            className="h-full w-full object-cover"
            src={bg}
          />
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center bg-white p-6 sm:p-12 relative">
        <div className="w-full max-w-[480px] flex flex-col gap-8">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-600/30">
              <Box className="w-8 h-8" />
            </div>
            <h2 className="text-slate-900 tracking-tight text-[28px] font-bold leading-tight">
              Đăng nhập hệ thống
            </h2>
            <p className="text-slate-500 text-sm">
              Nhập thông tin tài khoản doanh nghiệp của bạn
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Username Field */}
            <label className="flex flex-col gap-1.5">
              <span className="text-slate-900 text-sm font-medium leading-normal">Tên tài khoản</span>
              <div className="relative flex w-full items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all overflow-hidden">
                <div className="flex items-center justify-center pl-4 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  className="w-full flex-1 border-none bg-transparent h-12 px-3 text-slate-900 placeholder:text-slate-400 text-base font-normal focus:ring-0 focus:outline-none"
                  placeholder="Nhập tên tài khoản"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </label>

            {/* Password Field */}
            <label className="flex flex-col gap-1.5">
              <span className="text-slate-900 text-sm font-medium leading-normal">Mật khẩu</span>
              <div className="relative flex w-full items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all overflow-hidden">
                <div className="flex items-center justify-center pl-4 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  className="w-full flex-1 border-none bg-transparent h-12 px-3 text-slate-900 placeholder:text-slate-400 text-base font-normal focus:ring-0 focus:outline-none"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="flex items-center justify-center pr-4 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

            {/* Checkbox & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <a className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline" href="#">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg bg-blue-600 h-12 px-5 text-white text-base font-bold leading-normal tracking-wide hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

        </div>

        {/* Bottom decorative fade (mobile only) */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent lg:hidden"></div>
      </div>
    </div>
  );
};

export default LoginPage;
