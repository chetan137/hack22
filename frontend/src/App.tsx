import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppProviders } from './providers';
import { useSettingsStore } from './store/settingsStore';
import AmbientBackground from './components/ui/AmbientBackground';

function App() {
  const theme = useSettingsStore(state => state.theme);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  return (
    <AppProviders>
      <AmbientBackground />
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
