import { Link } from 'react-router';

type NotFoundPageProps = {
  title?: string;
  message?: string;
};

export function NotFoundPage({
  title = 'Page not found',
  message = "We couldn't find the page you were looking for.",
}: NotFoundPageProps) {
  return (
    <section className="status-view">
      <h1>{title}</h1>
      <p>{message}</p>
      <Link to="/" className="button">
        Back to the shop
      </Link>
    </section>
  );
}
