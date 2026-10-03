import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import CustomerPanel from './pages/CustomerPanel';

function Root() {
  const { session } = useAuth();
  return session ? <CustomerPanel /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
