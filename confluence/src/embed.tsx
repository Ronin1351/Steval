import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import styles from './index.css?inline';

export function mountConfluence(host: HTMLElement) {
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = styles;
  const container = document.createElement('div');
  shadow.append(style, container);
  const root = createRoot(container);
  root.render(<StrictMode><App embedded historyRequestTarget={host}/></StrictMode>);
  return () => root.unmount();
}
