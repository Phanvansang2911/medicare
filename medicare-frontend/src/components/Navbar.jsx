import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
            <div className="w-full px-6 lg:px-10">
                <div className="flex justify-between h-16 items-center">

                    {/* LOGO NỔI BẬT */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </div>
                        <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-500 tracking-tight">
              MediCare
            </span>
                    </Link>

                    {/* MENU BÊN PHẢI */}
                    <div className="flex items-center space-x-6">
                        <Link to="/" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
                            Trang chủ
                        </Link>

                        {/* NÚT ĐẶT LỊCH KHÁM (Hiển thị cho Bệnh nhân) */}
                        {user?.role === 'PATIENT' && (
                            <Link
                                to="/patient"
                                className="bg-cyan-50 text-cyan-600 border border-cyan-200 px-4 py-2 rounded-lg font-bold hover:bg-cyan-500 hover:text-white transition-all flex items-center shadow-sm"
                            >
                                <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Đặt lịch khám
                            </Link>
                        )}

                        {/* MENU DÀNH RIÊNG CHO TỪNG ROLE */}
                        {user?.role === 'PATIENT' && (
                            <Link to="/patient/history" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
                                Lịch sử khám
                            </Link>
                        )}

                        {user?.role === 'DOCTOR' && (
                            <>
                                <Link to="/doctor/schedules" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
                                    Ca làm việc
                                </Link>
                                <Link to="/doctor" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
                                    Quản lý lịch hẹn
                                </Link>
                            </>
                        )}

                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
                                Trang Quản trị
                            </Link>
                        )}

                        {/* KHỐI TÀI KHOẢN (Đăng nhập / Avatar / Đăng xuất) */}
                        {user ? (
                            <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                                <Link to="/profile" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-semibold text-gray-800 leading-tight">{user.fullName}</p>
                                        <p className="text-xs text-gray-500">{user.role}</p>
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                                <Link to="/login" className="text-gray-600 font-medium hover:text-blue-600">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
}