import type { ReactNode } from 'react';

/**
 * The three non-success UI states, shared by every page so they look and
 * behave the same everywhere (D2-3). Success is whatever the page renders.
 */

type LoadingStateProps = {
  label: string;
  variant?: 'grid' | 'details';
};

/** Skeleton placeholders shaped like the content that's coming, so the page doesn't jump. */
export function LoadingState({ label, variant = 'grid' }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="loading-state">
      <span className="visually-hidden">{label}</span>
      {variant === 'grid' ? (
        <ul className="product-grid" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <li key={index} className="skeleton skeleton--card" />
          ))}
        </ul>
      ) : (
        <div className="details" aria-hidden="true">
          <div className="skeleton skeleton--image" />
          <div className="details__info">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
          </div>
        </div>
      )}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <section className="status-view">
      <span className="status-view__icon" aria-hidden="true">
        🦆
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </section>
  );
}

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

/** role="alert" makes screen readers announce the error as soon as it appears. */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <section className="status-view status-view--error" role="alert">
      <span className="status-view__icon" aria-hidden="true">
        🐛
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </section>
  );
}
