import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { CommonProvider } from './context/CommonContext';
import { PostProvider } from './context/PostContext';
import { RuntimeProvider } from './runtime/RuntimeContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <RuntimeProvider>
      <CommonProvider>
        <AuthProvider>
          <PostProvider>
            <App />
          </PostProvider>
        </AuthProvider>
      </CommonProvider>
    </RuntimeProvider>
  </BrowserRouter>,
);
