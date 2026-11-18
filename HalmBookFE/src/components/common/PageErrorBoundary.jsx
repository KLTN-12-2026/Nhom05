import { Component } from 'react';

export default class PageErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main role="alert" className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-bold">Không thể hiển thị trang này</h1>
        <p>Vui lòng tải lại trang hoặc trở về trang chủ.</p>
        <div className="flex gap-4">
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-wine px-4 py-2 text-white">Tải lại</button>
          <a href="/" className="rounded-xl border px-4 py-2">Về trang chủ</a>
        </div>
      </main>
    );
  }
}
