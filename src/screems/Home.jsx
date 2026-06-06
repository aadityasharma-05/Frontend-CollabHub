import React, { useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import UserContext from '../context/user.context.jsx';

const Home = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('/projects/all', {
          params: deferredSearchTerm.trim()
            ? { search: deferredSearchTerm.trim() }
            : undefined,
        });
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error('Project fetch failed:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
          return;
        }

        setError(err.response?.data?.error || 'Could not load projects right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [deferredSearchTerm, navigate, setUser]);

  const stats = useMemo(() => {
    const collaboratorCount = projects.reduce((count, project) => count + (project.users?.length || 0), 0);
    return [
      { label: 'Projects', value: projects.length },
      { label: 'Collaborators', value: collaboratorCount },
      { label: 'AI-ready rooms', value: projects.length },
    ];
  }, [projects]);

  const createProject = async (event) => {
    event.preventDefault();
    setError('');

    if (!projectName.trim()) {
      setError('Project name is required.');
      return;
    }

    try {
      setIsCreating(true);
      const res = await axios.post('/projects/create', {
        name: projectName.trim(),
        description: projectDescription.trim(),
      });

      setProjects((prev) => [res.data, ...prev]);
      setProjectName('');
      setProjectDescription('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Create project failed:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create the project.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="glass-panel relative overflow-hidden rounded-[34px] p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(255,199,118,0.25)] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[rgba(31,107,82,0.15)] blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white/60 px-4 py-2 text-sm text-[var(--text-body)]">
                <i className="ri-team-line text-[var(--accent)]" />
                Shared workspace dashboard
              </div>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
                Keep your projects, people, and AI support in one calm place.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-body)] sm:text-lg">
                Create focused rooms for each project, invite collaborators, and use <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent)]">@ai</span> inside chat whenever your team needs help drafting or deciding.
              </p>
            </div>

            <div className="flex flex-col gap-4 lg:min-w-[270px]">
              <div className="rounded-[28px] border border-[var(--border-soft)] bg-white/72 p-4">
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Signed in as</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl font-bold text-white">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-strong)]">{user?.email}</p>
                    <p className="text-sm text-[var(--text-muted)]">Ready to collaborate</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setError('');
                    setIsModalOpen(true);
                  }}
                  className="flex-1 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  New project
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white/72 px-5 py-3 text-sm font-semibold text-[var(--text-strong)] transition hover:bg-white"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="mesh-card rounded-[28px] border border-[var(--border-soft)] p-6 shadow-[0_18px_40px_rgba(38,48,40,0.08)]">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">{stat.label}</p>
              <p className="mt-3 text-4xl font-bold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Project rooms</p>
              <h2 className="mt-2 text-3xl font-bold">Your active spaces</h2>
            </div>
            <div className="w-full max-w-xl">
              <div className="field-shell flex items-center gap-3 rounded-[24px] px-4 py-3">
                <i className="ri-search-line text-lg text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search chat rooms by name or description"
                  className="w-full border-none bg-transparent outline-none"
                />
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--text-body)]">
                Search helps teams find the right room quickly as the workspace grows.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-[var(--danger-soft)] bg-[rgba(248,223,219,0.55)] px-4 py-3 text-sm text-[var(--danger-strong)]">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="glass-panel rounded-[30px] p-10 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--border-soft)] border-t-[var(--accent)]" />
              <p className="mt-4 text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">Loading projects</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-panel rounded-[34px] p-10 text-center sm:p-14">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[var(--accent-soft)] text-[var(--accent)]">
                <i className="ri-layout-grid-line text-4xl" />
              </div>
              <h3 className="mt-6 text-3xl font-bold">
                {searchTerm.trim() ? 'No rooms match your search' : 'Start with your first project room'}
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-[var(--text-body)]">
                {searchTerm.trim()
                  ? 'Try another keyword or create a new room with a clear name and description.'
                  : 'Create a room for a sprint, client deliverable, or internal brainstorm. Invite people after you create it and use chat immediately.'}
              </p>
              {!searchTerm.trim() ? (
                <button
                  onClick={() => {
                    setError('');
                    setIsModalOpen(true);
                  }}
                  className="mt-7 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  Create your first room
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => navigate(`/project/${project._id}`, { state: { project } })}
                  className="mesh-card group rounded-[30px] border border-[var(--border-soft)] p-6 text-left shadow-[0_18px_40px_rgba(38,48,40,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(38,48,40,0.14)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white transition group-hover:scale-105">
                      <i className="ri-folder-chart-line text-2xl" />
                    </div>
                    <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      Live
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-bold capitalize">{project.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
                    {project.description || 'Open the room to chat with collaborators, manage members, and ask the assistant for quick help.'}
                  </p>

                  <div className="mt-6 flex items-center justify-between text-sm text-[var(--text-body)]">
                    <span>{project.users?.length || 0} collaborator{project.users?.length === 1 ? '' : 's'}</span>
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--accent)]">
                      Open room
                      <i className="ri-arrow-right-up-line" />
                    </span>
                  </div>

                  <div className="mt-5 flex -space-x-3">
                    {(project.users || []).slice(0, 4).map((member) => (
                      <div
                        key={member._id || member.email}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#d9e6df] text-sm font-semibold text-[var(--accent-strong)]"
                        title={member.email}
                      >
                        {member.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    ))}
                    {(project.users?.length || 0) > 4 ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#f0e2c7] text-xs font-semibold text-[var(--accent-strong)]">
                        +{project.users.length - 4}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    <span>Owner</span>
                    <span className="truncate pl-4">{project.createdBy?.email || 'Workspace member'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,43,35,0.28)] px-4">
          <div className="glass-panel w-full max-w-lg rounded-[30px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">New workspace room</p>
                <h3 className="mt-2 text-3xl font-bold">Create a project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/70 text-[var(--text-strong)]"
                type="button"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <form onSubmit={createProject} className="mt-8">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Project name</span>
                <div className="field-shell rounded-2xl px-4 py-3">
                  <input
                    onChange={(e) => setProjectName(e.target.value)}
                    value={projectName}
                    type="text"
                    placeholder="Spring launch planning"
                    className="w-full border-none bg-transparent outline-none"
                  />
                </div>
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Short description</span>
                <div className="field-shell rounded-2xl px-4 py-3">
                  <textarea
                    onChange={(e) => setProjectDescription(e.target.value)}
                    value={projectDescription}
                    rows="3"
                    placeholder="What is this room for?"
                    className="w-full resize-none border-none bg-transparent outline-none"
                  />
                </div>
              </label>

              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                Keep it simple. You can invite collaborators right after the room is created.
              </p>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white/70 px-5 py-3 font-semibold text-[var(--text-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Home;
