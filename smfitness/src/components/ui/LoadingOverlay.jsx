import RoseCurveLoader from './RoseCurveLoader';
import './LoadingOverlay.css';

/**
 * Full-screen frosted overlay with the Rose Curve animation.
 * Props:
 *   visible  – boolean  – whether to show
 *   message  – string   – label below the curve (optional)
 */
export default function LoadingOverlay({ visible = false, message = 'Saving…' }) {
  if (!visible) return null;

  return (
    <div className="rose-overlay" role="status" aria-live="polite">
      <div className="rose-card">
        <RoseCurveLoader size={140} color="white" />
        <p className="rose-message">{message}</p>
      </div>
    </div>
  );
}
