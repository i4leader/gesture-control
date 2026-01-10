import { App } from './app';
import "./styles/main.css";

const container = document.getElementById('app');
if (container) {
  const app = new App(container);

  // Start app
  app.start().catch(console.error);
}
