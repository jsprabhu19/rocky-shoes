import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Failed to update password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page animate-fade">
      <div className="container reset-container">
        <div className="reset-card">
          <div className="reset-icon-wrapper">
            <Lock size={32} />
          </div>

          <h2 className="reset-title">Set New Password</h2>
          <p className="reset-subtitle">Please enter your new password below. Ensure it is at least 6 characters.</p>

          {success ? (
            <div className="reset-success-box animate-fade">
              <ShieldCheck size={24} className="success-icon" />
              <div>
                <h4>Password Updated!</h4>
                <p>Redirecting to dashboard in a moment...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="reset-form">
              {errorMsg && <div className="reset-error-banner">{errorMsg}</div>}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block btn-reset-submit"
              >
                {loading ? 'Updating Password...' : 'Save Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Embedded CSS for Reset Page */}
      <style dangerouslySetInnerHTML={{ __html: `
        .reset-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5rem 0;
          min-height: 70vh;
        }

        .reset-card {
          background-color: var(--white);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 3rem;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .reset-icon-wrapper {
          color: var(--primary);
          background-color: var(--primary-light);
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .reset-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .reset-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .reset-form {
          width: 100%;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .reset-error-banner {
          background-color: hsl(0, 84%, 97%);
          color: var(--error);
          border: 1px solid hsl(0, 84%, 90%);
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
        }

        .reset-success-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          background-color: hsl(142, 70%, 95%);
          color: var(--success);
          border: 1px solid hsl(142, 70%, 90%);
          border-radius: 12px;
          padding: 1.25rem;
          width: 100%;
          text-align: left;
        }

        .reset-success-box h4 {
          font-weight: 700;
          font-size: 0.95rem;
          margin: 0;
        }

        .reset-success-box p {
          font-size: 0.85rem;
          margin: 0;
          color: hsl(142, 70%, 30%);
        }

        .btn-reset-submit {
          padding: 0.9rem !important;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          margin-top: 0.5rem;
        }
      `}} />
    </div>
  );
}
