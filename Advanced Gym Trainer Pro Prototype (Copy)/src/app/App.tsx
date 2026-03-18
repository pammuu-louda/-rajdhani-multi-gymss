import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="min-h-screen bg-background text-foreground">
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors />
      </div>
    </ThemeProvider>
  );
}

export default App;
