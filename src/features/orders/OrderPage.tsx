import { Link, useParams } from 'react-router';
import { ApiErrorView } from '../../components/ApiErrorView.tsx';
import { LoadingState } from '../../components/StatusViews.tsx';
import { ORDER_STATUSES, type OrderStatus } from '../../types/api.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';
import { useOrderStatus } from './useOrderStatus.ts';

const STATUS_LABELS: Record<OrderStatus, string> = {
  queued: 'Order received',
  processing: 'Payment and stock check',
  confirmed: 'Confirmed',
};

export function OrderPage() {
  const { id = '' } = useParams();
  const state = useOrderStatus(id);
  useDocumentTitle('Your order');

  if (state.status === 'error') {
    return <ApiErrorView error={state.error} what="your order" onRetry={() => window.location.reload()} />;
  }
  if (state.status !== 'success') return <LoadingState label="Loading your order…" variant="details" />;

  const order = state.data;
  const currentIndex = ORDER_STATUSES.indexOf(order.status);

  return (
    <section className="order">
      <h1>{order.status === 'confirmed' ? 'Thanks! Your order is confirmed 🦆' : 'Thanks! We got your order'}</h1>
      <p>
        Order number <strong>{order.id}</strong>
      </p>
      <ol className="order__steps" aria-label="Order progress">
        {ORDER_STATUSES.map((status, index) => (
          <li
            key={status}
            className={index <= currentIndex ? 'order__step order__step--done' : 'order__step'}
            aria-current={index === currentIndex ? 'step' : undefined}
          >
            {STATUS_LABELS[status]}
          </li>
        ))}
      </ol>
      <p role="status" className="visually-hidden">
        Order status: {STATUS_LABELS[order.status]}
      </p>
      <Link to="/" className="button">
        Keep shopping
      </Link>
    </section>
  );
}
