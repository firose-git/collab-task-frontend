
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/image.png';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                        <img src={logo} alt="TaskFlow Logo" className="w-8 h-8 rounded-lg" />
                        TaskFlow
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">Hello, {user?.name}</span>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>
            <ToastContainer position="bottom-right" />
        </div>
    );
};

export default Layout;
