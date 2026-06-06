import React, { useContext } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '../screems/Home';
import Login from '../screems/Login';
import Project from '../screems/Project';
import Register from '../screems/Register';
import UserContext from '../context/user.context.jsx';

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] px-6">
    <div className="glass-panel flex w-full max-w-sm items-center gap-4 rounded-[28px] p-6">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border-soft)] border-t-[var(--accent)]" />
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">Syncing</p>
        <h1 className="text-lg font-semibold text-[var(--text-strong)]">Preparing your workspace</h1>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, isAuthLoading } = useContext(UserContext);

  if (isAuthLoading) {
    return <FullScreenLoader />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user, isAuthLoading } = useContext(UserContext);

  if (isAuthLoading) {
    return <FullScreenLoader />;
  }

  return user ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/project/:projectId"
        element={(
          <ProtectedRoute>
            <Project />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/login"
        element={(
          <GuestRoute>
            <Login />
          </GuestRoute>
        )}
      />
      <Route
        path="/register"
        element={(
          <GuestRoute>
            <Register />
          </GuestRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
