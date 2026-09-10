import { Component } from 'react';

export class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-bold">
          {this.props.fallbackMessage || 'Có lỗi xảy ra ở phần này, các phần khác vẫn hoạt động bình thường'}
        </div>
      );
    }
    return this.props.children;
  }
}
