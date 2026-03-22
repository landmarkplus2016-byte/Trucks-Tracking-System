import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import './styles/global.css';

/**
 * Root component.
 * Wraps the entire app in BrowserRouter and renders the role-based router.
 */
export function App() {
  return (
    <BrowserRouter basename="/trucks-tracking-system">
      <AppRouter />
    </BrowserRouter>
  );
}
