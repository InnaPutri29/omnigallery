const rootElement = document.getElementById('root');
if (rootElement && window.ReactDOM) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<window.App />);
}
