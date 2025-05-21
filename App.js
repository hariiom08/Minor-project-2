import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import QuizPage from './pages/quiz-page.jsx';
import QuizResultsPage from './pages/quiz-results-page.jsx';
import HistoryPage from './pages/history-page.jsx';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/quiz/:quizId" element={
            <PrivateRoute>
              <QuizPage />
            </PrivateRoute>
          } />
          <Route path="/quiz-results" element={
            <PrivateRoute>
              <QuizResultsPage />
            </PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute>
              <HistoryPage />
            </PrivateRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;