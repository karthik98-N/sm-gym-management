import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AnimatedHero } from '../components/ui/animated-hero';
import AnimatedButton from '../components/ui/animated-button';
import { FlipText } from '../components/ui/flip-text';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import './Login.css';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [stage, setStage]       = useState('hero');
  const [bgPhase, setBgPhase]   = useState(1);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const emailRef                = useRef(null);

  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  /* ── When user clicks "Get Started" ── */
  const handleGetStarted = () => {
    setBgPhase(2);           // trigger bg cross-fade
    setStage('form');        // slide-up form
    setTimeout(() => emailRef.current?.focus(), 650);
  };

  /* ── Email field typed → bg already swapped, nothing extra needed ── */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (bgPhase === 1 && e.target.value.length > 0) {
      setBgPhase(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'Network Error') {
        setError('Database disconnected. Ensure backend is running.');
      } else {
        setError(err.response?.data?.msg || 'Invalid email or password');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={`lp-root bg-phase-${bgPhase}`}>
      <LoadingOverlay visible={isLoggingIn} message="Signing in…" />

      {/* ── Animated Aurora Background ── */}
      <div className="lp-aurora-bg">
        <AnimatedHero
          title=""
          showThemeToggle={false}
          forceTheme="dark"
          className="lp-aurora-hero"
        />
      </div>

      {/* ── Background image layers ── */}
      <div className="lp-bg lp-bg1" />
      <div className={`lp-bg lp-bg2 ${bgPhase === 2 ? 'visible' : ''}`} />

      {/* ── Dark overlay ── */}
      <div className="lp-overlay" />

      {/* ── Content ── */}
      <div className="lp-content">

        {/* Brand badge */}
        <div className={`lp-brand ${stage === 'form' ? 'brand-small' : ''}`}>
          <span className="brand-sm">SM</span>
          <span className="brand-fit"> FITNESS</span>
          <p className="brand-studio">STUDIO</p>
        </div>

        {/* Hero CTA — shown on landing */}
        {stage === 'hero' && (
          <div className="lp-hero-cta">
            <h2 className="hero-tagline">Strength Forged.<br />Legacy Built.</h2>
            <p className="hero-sub">Admin Portal — Manage your members &amp; payments</p>
            <button className="btn-get-started" onClick={handleGetStarted}>
              <FlipText duration={2.4} delay={0} loop={true}>
                Get Started
              </FlipText>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        {/* Login form — shown after email typed */}
        {stage === 'form' && (
          <div className="lp-form-wrap">
            <h2 className="form-title">Admin Access</h2>
            {error && <div className="lp-error">{error}</div>}

            <form onSubmit={handleSubmit} className="lp-form">
              <div className="lp-field">
                <label htmlFor="lp-email">Email Address</label>
                <input
                  id="lp-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  placeholder="you@smfitness.com"
                />
              </div>

              <div className="lp-field">
                <label htmlFor="lp-password">Password</label>
                <input
                  id="lp-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <AnimatedButton
                type="submit"
                className="btn-login-animated"
              >
                LOG IN
              </AnimatedButton>
            </form>

            <button className="btn-back" onClick={() => { setStage('hero'); setBgPhase(1); }}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
