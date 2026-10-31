// Client: App root component
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/global.css';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});
function App() {
    return (<QueryClientProvider client={queryClient}>
      <RouterProvider router={router}/>
    </QueryClientProvider>);
}
export default App;
