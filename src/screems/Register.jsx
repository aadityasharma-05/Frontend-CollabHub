import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import UserContext from '../context/user.context.jsx';

const Register = () => {
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/users/register', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      navigate('/');
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(31,107,82,0.18),transparent_22%),radial-gradient(circle_at_85%_18%,rgba(212,167,93,0.34),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(30,43,35,0.06),transparent_28%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/40 bg-white/35 shadow-[0_32px_120px_rgba(38,48,40,0.16)] backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="mesh-card flex min-h-[760px] items-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Start fresh</p>
              <h2 className="mt-3 text-4xl font-bold">Create your collaboration space</h2>
              <p className="mt-3 text-base leading-7 text-[var(--text-body)]">
                Set up your account and you will land directly in a workspace ready for project rooms, invites, and AI-assisted team chat.
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
                      placeholder="name@company.com"
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
                      placeholder="At least 8 characters"
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
                {loading ? 'Creating account...' : 'Create workspace account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
              Already registered? <Link to="/login" className="font-semibold text-[var(--accent)]">Sign in</Link>
            </p>
          </div>
        </section>

        <section className="hidden min-h-[760px] flex-col justify-between bg-[linear-gradient(180deg,#fcfbf6_0%,#f3ebd8_48%,#dfece5_100%)] p-10 lg:flex">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white/75 px-4 py-2 text-sm text-[var(--text-body)]">
              <i className="ri-sparkling-2-line text-[var(--accent)]" />
              Space for teams who like clarity more than clutter
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl font-bold leading-tight">
                Shape ideas quickly, then turn them into shared momentum.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-[var(--text-body)]">
                Collab Hub keeps projects light, visual, and collaborative. Invite teammates, open a project room, and use the built-in assistant whenever the team needs a draft, summary, or fast unblock.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              ['Organized dashboard', 'Your projects are grouped into one calm, visual workspace.'],
              ['Focused collaboration', 'Each room gives chat, members, and AI prompts a clear home.'],
              ['Fast onboarding', 'Register, create a project, and start collaborating right away.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-[28px] border border-[var(--border-soft)] bg-white/72 p-6 shadow-[0_16px_40px_rgba(38,48,40,0.08)]">
                <p className="text-xl font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-body)]">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
