import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role;

    useEffect(() => {
        if (role === 'PATIENT') {
            axiosClient.get('/patients/me')
                .then(res => { setProfile(res.data); setFormData(res.data); })
                .catch(() => setError('Lỗi tải hồ sơ bệnh nhân'))
                .finally(() => setLoading(false));
        } else if (role === 'DOCTOR') {
            axiosClient.get('/doctors/me')
                .then(res => { setProfile(res.data); setFormData(res.data); })
                .catch(() => setError('Lỗi tải hồ sơ bác sĩ'))
                .finally(() => setLoading(false));
        } else {
            setProfile(user); setFormData(user); setLoading(false);
        }
    }, [role]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (role === 'PATIENT') res = await axiosClient.put('/patients/me', formData);
            else if (role === 'DOCTOR') res = await axiosClient.put('/doctors/me', formData);

            setProfile(res.data);
            setIsEditing(false);
            alert('Cập nhật hồ sơ thành công!');
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi cập nhật hồ sơ!');
        }
    };

    const getRoleName = (r) => {
        if (r === 'DOCTOR') return 'Bác sĩ';
        if (r === 'PATIENT') return 'Bệnh nhân';
        return 'Quản trị viên';
    };

    if (loading) return <div className="text-center mt-20 text-blue-500 font-medium">Đang tải hồ sơ...</div>;
    if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto mt-10 p-4 mb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
                <p className="text-gray-500 mt-2">Quản lý thông tin tài khoản và hồ sơ của bạn trên hệ thống MediCare.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* CỘT TRÁI: THẺ THÔNG TIN CƠ BẢN & AVATAR */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

                        <div className="relative z-10 w-32 h-32 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-5xl font-bold shadow-md mt-6 mb-4">
                            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800">{profile?.fullName}</h2>
                        <span className="inline-block bg-blue-50 text-blue-700 font-semibold px-4 py-1 rounded-full text-sm mt-2">
              {getRoleName(role)}
            </span>
                        <p className="text-gray-500 mt-4 text-sm">{profile?.email}</p>
                    </div>
                </div>

                {/* CỘT PHẢI: CHI TIẾT HỒ SƠ HOẶC FORM CHỈNH SỬA */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 h-full">

                        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-800">Chi tiết thông tin</h3>
                            {!isEditing && role !== 'ADMIN' && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center space-x-2 bg-gray-50 text-blue-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors border border-gray-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    <span>Chỉnh sửa</span>
                                </button>
                            )}
                        </div>

                        {!isEditing ? (
                            /* CHẾ ĐỘ XEM */
                            <div className="space-y-8">
                                {/* Thông tin cơ bản */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin cá nhân</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <p className="text-sm text-gray-500 mb-1 flex items-center"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>Họ và tên</p>
                                            <p className="font-semibold text-gray-800 text-lg">{profile?.fullName}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <p className="text-sm text-gray-500 mb-1 flex items-center"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>Email</p>
                                            <p className="font-semibold text-gray-800 text-lg">{profile?.email}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <p className="text-sm text-gray-500 mb-1 flex items-center"><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>Số điện thoại</p>
                                            <p className="font-semibold text-gray-800 text-lg">{profile?.phone || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin đặc thù */}
                                {role === 'PATIENT' && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin y tế</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <p className="text-sm text-gray-500 mb-1">Giới tính</p>
                                                <p className="font-semibold text-gray-800 text-lg">{profile?.gender === 'MALE' ? 'Nam' : profile?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <p className="text-sm text-gray-500 mb-1">Ngày sinh</p>
                                                <p className="font-semibold text-gray-800 text-lg">{profile?.dateOfBirth || 'Chưa cập nhật'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 md:col-span-2">
                                                <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                                                <p className="font-semibold text-gray-800 text-lg">{profile?.address || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {role === 'DOCTOR' && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin chuyên môn</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <p className="text-sm text-gray-500 mb-1">Chuyên khoa</p>
                                                <p className="font-semibold text-blue-600 text-lg">{profile?.specialtyName}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                <p className="text-sm text-gray-500 mb-1">Học vị / Bằng cấp</p>
                                                <p className="font-semibold text-gray-800 text-lg">{profile?.degree || 'Chưa cập nhật'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 md:col-span-2">
                                                <p className="text-sm text-gray-500 mb-1">Giới thiệu bản thân</p>
                                                <p className="font-medium text-gray-700 leading-relaxed mt-1">{profile?.description || 'Chưa có thông tin giới thiệu.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* CHẾ ĐỘ CHỈNH SỬA (FORM) */
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">Họ và tên</label>
                                        <input type="text" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">Số điện thoại</label>
                                        <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors" />
                                    </div>

                                    {role === 'PATIENT' && (
                                        <>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Ngày sinh</label>
                                                <input type="date" value={formData.dateOfBirth || ''} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Giới tính</label>
                                                <select value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors bg-white">
                                                    <option value="MALE">Nam</option>
                                                    <option value="FEMALE">Nữ</option>
                                                    <option value="OTHER">Khác</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Địa chỉ</label>
                                                <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors" />
                                            </div>
                                        </>
                                    )}

                                    {role === 'DOCTOR' && (
                                        <>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Học vị / Bằng cấp</label>
                                                <input type="text" value={formData.degree || ''} onChange={e => setFormData({...formData, degree: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Giới thiệu bản thân</label>
                                                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors h-32 resize-none" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex space-x-4 pt-4 border-t border-gray-100 mt-8">
                                    <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all">Lưu thay đổi</button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">Hủy bỏ</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}