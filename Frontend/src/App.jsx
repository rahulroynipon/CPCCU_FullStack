import { QueryClient, QueryClientProvider } from "react-query";
import Dashboard from "./dashboard/Dashboard";
import Modal from "./components/Modal";
import { AuthProvider } from "./dashboard/Auth";

export const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Dashboard />
        <Modal />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
