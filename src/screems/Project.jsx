import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from '../config/axios.js';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket.js';
import UserContext from '../context/user.context.jsx';

const formatTime = (value) => {
  if (!value) {
    return 'Now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Now';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Project = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { user, setUser } = useContext(UserContext);
  const [projectData, setProjectData] = useState(location.state?.project || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isSubmittingUsers, setIsSubmittingUsers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsProjectLoading(true);
        const res = await axios.get(`/projects/get-project/${projectId}`);
        setProjectData(res.data.project);
      } catch (err) {
        console.error('Error fetching project:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
          return;
        }

        setError(err.response?.data?.error || 'Unable to load this project.');
      } finally {
        setIsProjectLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [navigate, projectId, setUser]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsUsersLoading(true);
        const res = await axios.get('/users/all');
        setAllUsers(res.data.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (!projectId || !user) {
      return undefined;
    }

    const socket = initializeSocket(projectId);
    const removeListener = receiveMessage('project-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      removeListener();
      socket.disconnect();
    };
  }, [projectId, user]);

  const availableUsers = useMemo(() => {
    const currentIds = new Set((projectData?.users || []).map((member) => String(member._id)));
    return allUsers.filter((member) => !currentIds.has(String(member._id)));
  }, [allUsers, projectData?.users]);

  const filteredAvailableUsers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    if (!query) {
      return availableUsers;
    }

    return availableUsers.filter((member) =>
      member.email?.toLowerCase().includes(query)
    );
  }, [availableUsers, memberSearch]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    const trimmedMessage = input.trim();

    if (!trimmedMessage || !user) {
      return;
    }

    const messageData = {
      message: trimmedMessage,
      sender: user,
      timestamp: new Date().toISOString()
    };

    sendMessage('project-message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput('');
  };

  const addUsersToProject = async (event) => {
    event.preventDefault();
    if (!projectData?._id || selectedUsers.length === 0) {
      return;
    }

    try {
      setIsSubmittingUsers(true);
      const res = await axios.put('/projects/add-user', {
        projectId: projectData._id,
        users: selectedUsers
      });

      setProjectData(res.data.project);
      setSelectedUsers([]);
      setMemberSearch('');
      setShowAddUsers(false);
    } catch (err) {
      console.error('Error adding users:', err);
      setError(err.response?.data?.error || 'Unable to add collaborators right now.');
    } finally {
      setIsSubmittingUsers(false);
    }
  };

  const removeUserFromProject = async (userId) => {
    if (!projectData?._id || !userId) {
      return;
    }

    try {
      setRemovingUserId(userId);
      const res = await axios.put('/projects/remove-user', {
        projectId: projectData._id,
        userId,
      });

      setProjectData(res.data.project);

      if (String(userId) === String(user?._id)) {
        navigate('/');
      }
    } catch (err) {
      console.error('Error removing user:', err);
      setError(err.response?.data?.error || 'Unable to update collaborators.');
    } finally {
      setRemovingUserId(null);
    }
  };

  if (isProjectLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel rounded-[28px] p-8 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--border-soft)] border-t-[var(--accent)]" />
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">Loading room</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel max-w-md rounded-[30px] p-8 text-center">
          <h1 className="text-3xl font-bold">Project not found</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
            This room may have been removed or you may no longer have access to it.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="glass-panel rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--text-body)]"
              >
                <i className="ri-arrow-left-line" />
                Back to dashboard
              </button>
              <p className="mt-5 text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Project room</p>
              <h1 className="mt-2 text-4xl font-bold capitalize sm:text-5xl">{projectData.name}</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-body)]">
                Use this space to coordinate work in real time. Mention <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent)]">@ai</span> in any message to bring the assistant into the room.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
              <div className="rounded-[26px] border border-[var(--border-soft)] bg-white/72 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-muted)]">Collaborators</p>
                <p className="mt-3 text-3xl font-bold">{projectData.users?.length || 0}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Owner: {projectData.createdBy?.email || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => {
                  setError('');
                  setShowAddUsers(true);
                }}
                className="rounded-[26px] bg-[var(--accent)] p-4 text-left text-white transition hover:bg-[var(--accent-strong)]"
              >
                <p className="text-sm uppercase tracking-[0.24em] text-white/70">Invite</p>
                <p className="mt-3 text-xl font-semibold">Add collaborators</p>
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[var(--danger-soft)] bg-[rgba(248,223,219,0.55)] px-4 py-3 text-sm text-[var(--danger-strong)]">
            {error}
          </div>
        ) : null}

        <main className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <section className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Live chat</p>
                <h2 className="mt-2 text-2xl font-bold">Room conversation</h2>
              </div>
              <div className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Real time
              </div>
            </div>

            <div className="soft-scrollbar mt-5 h-[480px] overflow-y-auto rounded-[24px] bg-white/60 p-4 sm:p-5">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <i className="ri-chat-3-line text-4xl" />
                  </div>
                  <h3 className="mt-5 text-2xl font-bold">No messages yet</h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-body)]">
                    Start the conversation with a quick update, or type <span className="font-semibold text-[var(--accent)]">@ai summarize our launch plan</span> to ask the assistant for help.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isMine = String(msg.sender?._id) === String(user?._id);
                    const isAi = String(msg.sender?._id) === 'ai' || msg.sender?.email === 'AI';

                    return (
                      <div
                        key={`${msg.timestamp || 'msg'}-${index}`}
                        className={`flex ${isAi ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ${
                            isAi
                              ? 'border border-[rgba(31,107,82,0.18)] bg-[var(--accent-soft)]'
                              : isMine
                                ? 'bg-[var(--accent)] text-white'
                                : 'border border-[var(--border-soft)] bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-[var(--text-strong)]'}`}>
                              {isAi ? 'AI Assistant' : msg.sender?.email || 'Teammate'}
                            </p>
                            <span className={`text-xs ${isMine ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-7 ${isMine ? 'text-white' : 'text-[var(--text-body)]'}`}>
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="field-shell flex-1 rounded-[24px] px-4 py-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Share an update or use @ai to ask for help"
                  className="w-full border-none bg-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-[24px] bg-[var(--accent)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Send message
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="mesh-card rounded-[32px] border border-[var(--border-soft)] p-6 shadow-[0_18px_40px_rgba(38,48,40,0.08)]">
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Assistant prompts</p>
              <h2 className="mt-2 text-2xl font-bold">Quick ideas</h2>
              <div className="mt-5 space-y-3">
                {[
                  '@ai summarize the discussion so far',
                  '@ai draft a status update for stakeholders',
                  '@ai turn these notes into next steps',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="w-full rounded-2xl border border-[var(--border-soft)] bg-white/72 px-4 py-3 text-left text-sm leading-7 text-[var(--text-body)] transition hover:bg-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Members</p>
                  <h2 className="mt-2 text-2xl font-bold">Collaborators</h2>
                </div>
                <span className="rounded-full bg-white/72 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  {projectData.users?.length || 0} total
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {(projectData.users || []).map((member) => {
                  const isSelf = String(member._id) === String(user?._id);
                  const isRemoving = String(removingUserId) === String(member._id);
                  const isOwner = String(member._id) === String(projectData.createdBy?._id);

                  return (
                    <div key={member._id} className="flex items-center gap-3 rounded-[24px] border border-[var(--border-soft)] bg-white/68 p-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]">
                        {member.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--text-strong)]">{member.email}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {isSelf ? 'You' : isOwner ? 'Project owner' : 'Collaborator'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUserFromProject(member._id)}
                        disabled={isRemoving}
                        className="rounded-2xl border border-[rgba(141,59,44,0.18)] bg-[rgba(248,223,219,0.42)] px-4 py-2 text-sm font-semibold text-[var(--danger-strong)] disabled:opacity-60"
                      >
                        {isRemoving ? 'Updating...' : isSelf ? 'Leave' : 'Remove'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </main>
      </div>

      {showAddUsers ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,43,35,0.28)] px-4">
          <div className="glass-panel w-full max-w-xl rounded-[30px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)]">Invite teammates</p>
                <h3 className="mt-2 text-3xl font-bold">Add collaborators</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUsers(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white/70"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <form onSubmit={addUsersToProject} className="mt-8">
              <div className="field-shell mb-4 flex items-center gap-3 rounded-[24px] px-4 py-3">
                <i className="ri-search-line text-lg text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search teammates by email"
                  className="w-full border-none bg-transparent outline-none"
                />
              </div>

              {selectedUsers.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedUsers.map((selectedUserId) => {
                    const member = allUsers.find((userEntry) => userEntry._id === selectedUserId);
                    return (
                      <button
                        key={selectedUserId}
                        type="button"
                        onClick={() => setSelectedUsers((prev) => prev.filter((id) => id !== selectedUserId))}
                        className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-medium text-[var(--accent)]"
                      >
                        {member?.email || 'Selected'} <span className="ml-1">x</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="soft-scrollbar max-h-80 space-y-3 overflow-y-auto pr-1">
                {isUsersLoading ? (
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                    Loading workspace users...
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                    Everyone in the workspace is already in this project.
                  </div>
                ) : filteredAvailableUsers.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                    No teammate matches that search yet.
                  </div>
                ) : filteredAvailableUsers.map((member) => (
                  <label
                    key={member._id}
                    className="flex cursor-pointer items-center gap-4 rounded-[24px] border border-[var(--border-soft)] bg-white/72 p-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(member._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers((prev) => [...prev, member._id]);
                        } else {
                          setSelectedUsers((prev) => prev.filter((id) => id !== member._id));
                        }
                      }}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] font-semibold text-[var(--accent)]">
                      {member.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-strong)]">{member.email}</p>
                      <p className="text-sm text-[var(--text-muted)]">Workspace member</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUsers(false)}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white/70 px-5 py-3 font-semibold text-[var(--text-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUsers || selectedUsers.length === 0}
                  className="rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingUsers ? 'Adding collaborators...' : 'Add selected users'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Project;
