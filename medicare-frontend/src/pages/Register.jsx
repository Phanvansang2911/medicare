import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '', password: '', fullName: '', phone: '',
        dateOfBirth: '', gender: 'MALE', address: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axiosClient.post('/auth/register', formData);
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-10 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-2">Tạo tài khoản mới</h2>
                <p className="text-center text-gray-500 mb-8">Tham gia MediCare để chăm sóc sức khỏe tốt hơn</p>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">{error}</div>}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-1">Họ và tên <span className="text-red-500">*</span></label>
                            <input type="text" onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-1">Email <span className="text-red-500">*</span></label>
                            <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                            <input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" required minLength={8} />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-1">Số điện thoại</label>
                            <input type="text" onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-1">Ngày sinh</label>
                            <input type="date" onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-semibold mb-1">Giới tính</label>
                            <select onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-semibold mb-1">Địa chỉ</label>
                            <input type="text" onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:bg-gray-400 mt-4">
                        {loading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                    Đã có tài khoản? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}