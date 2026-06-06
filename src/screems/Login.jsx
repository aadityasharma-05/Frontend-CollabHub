import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import UserContext from '../context/user.context.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,107,82,0.2),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,199,118,0.34),transparent_24%),radial-gradient(circle_at_60%_70%,rgba(30,43,35,0.08),transparent_30%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/40 bg-white/35 shadow-[0_32px_120px_rgba(38,48,40,0.16)] backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden min-h-[760px] flex-col justify-between bg-[linear-gradient(160deg,#1c3d31_0%,#214c3c_45%,#d4a75d_150%)] p-10 text-white lg:flex">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                <i className="ri-bubble-chart-line text-2xl" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Collab Hub</p>
                <h1 className="text-3xl font-bold text-white">Build together without the mess.</h1>
              </div>
            </div>

            <div className="max-w-xl space-y-5">
              <p className="text-5xl font-bold leading-tight text-white">
                Real-time project rooms with teammates and an on-demand AI copilot.
              </p>
              <p className="text-lg leading-8 text-white/78">
                Keep tasks, people, and fast decisions in one shared workspace. Mention <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">@ai</span> in chat whenever the team needs a quick draft or answer.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Live rooms', 'Project chat stays synced across collaborators.'],
              ['Simple invites', 'Add teammates from the workspace in seconds.'],
              ['AI support', 'Use the latest Responses API flow on the backend.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-white/14 bg-white/10 p-5">
                <p className="text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/72">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mesh-card flex min-h-[760px] items-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Welcome back</p>
              <h2 className="mt-3 text-4xl font-bold">Sign in to your workspace</h2>
              <p className="mt-3 text-base leading-7 text-[var(--text-body)]">
                Pick up where the team left off and jump straight into your active projects.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel rounded-[30px] p-7 sm:p-8">
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Email</span>
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@team.com"
                      className="w-full border-none bg-transparent outline-none"
                      disabled={loading}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Password</span>
                  <div className="field-shell rounded-2xl px-4 py-3">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full border-none bg-transparent outline-none"
                      disabled={loading}
                    />
                  </div>
                </label>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-[var(--danger-soft)] bg-[rgba(248,223,219,0.55)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Enter workspace'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
              New here? <Link to="/register" className="font-semibold text-[var(--accent)]">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
