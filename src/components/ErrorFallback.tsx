type ErrorFallbackProps = {
  onReset?: () => void;
};

/**
 * Shown instead of a blank white page when something crashes during render.
 * Friendly copy only: the technical details go to the logger, not the screen.
 */
export function ErrorFallback({ onReset }: ErrorFallbackProps) {
  return (
    <div className="crash" role="alert">
      <span className="status-view__icon" aria-hidden="true">
        🐛
      </span>
      <h1>Something broke on our side</h1>
      <p>We've logged the problem. You can try again, or head back to the shop.</p>
      <div className="crash__actions">
        {onReset && (
          <button type="button" className="button" onClick={onReset}>
            Try again
          </button>
        )}
        {/* A full page load resets all in-memory state, which a crash may have corrupted. */}
        <a className="button button--secondary" href={import.meta.env.BASE_URL}>
          Back to the shop
        </a>
      </div>
    </div>
  );
}
