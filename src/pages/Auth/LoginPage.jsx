import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../api/auth';
import { setCredentials } from '../../store/authSlice';
import { User, Lock, Eye, EyeOff, Grid3X3, ShieldCheck, TrendingUp, Headphones, Box } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await login({ username, password }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.token }));
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
          <img
            alt="Office Background"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
          />
          <div className="absolute inset-0 bg-blue-600/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-start gap-6 max-w-lg">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm text-white mb-4">
            <Grid3X3 className="w-8 h-8" />
          </div>
          <h1 className="text-white text-5xl font-black leading-tight tracking-tight">
            Chào mừng trở lại!
          </h1>
          <p className="text-white/90 text-xl font-normal leading-relaxed">
            Quản lý dự án, tài chính và vận hành doanh nghiệp hiệu quả hơn bao giờ hết với hệ thống ERP toàn diện.
          </p>

          {/* Ornamental UI elements */}
          <div className="mt-8 flex gap-4">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">An toàn & Bảo mật</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md border border-white/10">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Tối ưu hiệu suất</span>
            </div>
          </div>
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

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider">Hoặc</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* SSO Button */}
          <button className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white h-12 px-5 text-slate-900 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <img
              alt="Google"
              className="w-5 h-5"
              src="https://www.google.com/favicon.ico"
            />
            <span>Đăng nhập với Google</span>
          </button>

          {/* Footer Support */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Headphones className="w-4 h-4" />
              Hỗ trợ kỹ thuật: <span className="font-medium text-slate-600">1900 8888</span>
            </p>
          </div>
        </div>

        {/* Bottom decorative fade (mobile only) */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent lg:hidden"></div>
      </div>
    </div>
  );
};

export default LoginPage;
