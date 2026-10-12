import { Component, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';

type Props = { children: ReactNode };
type State = { message: string | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message || 'The dashboard failed to render.' };
  }

  render() {
    if (this.state.message) {
      return (
        <ErrorState message={this.state.message} onRetry={() => window.location.reload()} />
      );
    }

    return this.props.children;
  }
}
