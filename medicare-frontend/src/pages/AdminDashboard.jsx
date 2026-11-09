import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' hoặc 'appointments'

    // State chung
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({ totalDoctors: 0, totalAppointments: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State cho Modal thêm bác sĩ
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: '', password: '', fullName: '', phone: '', specialtyId: '', degree: '', description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError('');

        // Gọi 3 API độc lập, cái nào lỗi thì bỏ qua cái đó
        const results = await Promise.allSettled([
            axiosClient.get('/doctors'),
            axiosClient.get('/specialties'),
            axiosClient.get('/admin/appointments?page=0&size=100')
        ]);

        if (results[0].status === 'fulfilled') {
            setDoctors(results[0].value.data || []);
        }
        if (results[1].status === 'fulfilled') {
            setSpecialties(results[1].value.data || []);
        }
        if (results[2].status === 'fulfilled') {
            setAppointments(results[2].value.data?.content || []);
        } else {
            console.warn("Chưa có API lịch khám hoặc lỗi tải lịch khám");
        }

        // Cập nhật thống kê
        setStats({
            totalDoctors: results[0].status === 'fulfilled' ? results[0].value.data?.length || 0 : 0,
            totalAppointments: results[2].status === 'fulfilled' ? results[2].value.data?.totalElements || 0 : 0
        });

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleDoctor = async (id) => {
        try {
            await axiosClient.patch(`/admin/doctors/${id}/toggle`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái!');
        }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axiosClient.post('/admin/doctors', {
                ...formData,
                specialtyId: Number(formData.specialtyId)
            });
            alert('Thêm bác sĩ thành công!');
            setIsModalOpen(false);
            setFormData({ email: '', password: '', fullName: '', phone: '', specialtyId: '', degree: '', description: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi thêm bác sĩ!');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper format giờ & trạng thái
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-md text-xs font-bold">Chờ duyệt</span>;
            case 'CONFIRMED': return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-md text-xs font-bold">Đã duyệt</span>;
            case 'ARRIVED': return <span className="bg-cyan-100 text-cyan-700 border border-cyan-200 px-2 py-1 rounded-md text-xs font-bold">Đã đến</span>;
            case 'COMPLETED': return <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-md text-xs font-bold">Hoàn thành</span>;
            case 'CANCELLED': return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-md text-xs font-bold">Đã hủy</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-bold">{status}</span>;
        }
    };

    if (loading && doctors.length === 0) return (
        <div className="flex justify-center items-center h-[70vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-10 px-4">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800">Bảng điều khiển Quản trị</h1>
                        <p className="text-gray-500 mt-2 text-lg">Quản lý toàn bộ hoạt động của phòng khám MediCare.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 md:mt-0 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Thêm Bác sĩ mới
                    </button>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">{error}</div>}

                {/* STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
                        <p className="text-blue-100 font-medium mb-1">Tổng số Bác sĩ</p>
                        <h2 className="text-5xl font-extrabold">{stats.totalDoctors}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-3xl text-white shadow-xl shadow-green-200/50 relative overflow-hidden">
                        <p className="text-green-100 font-medium mb-1">Tổng Lịch hẹn</p>
                        <h2 className="text-5xl font-extrabold">{stats.totalAppointments}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-3xl text-white shadow-xl shadow-purple-200/50 relative overflow-hidden">
                        <p className="text-purple-100 font-medium mb-1">Chuyên khoa</p>
                        <h2 className="text-5xl font-extrabold">{specialties.length}</h2>
                    </div>
                </div>

                {/* TABS CHUYỂN ĐỔI */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('doctors')}
                        className={`py-3 px-6 font-bold text-lg border-b-4 transition-all ${activeTab === 'doctors' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Quản lý Bác sĩ
                    </button>
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`py-3 px-6 font-bold text-lg border-b-4 transition-all ${activeTab === 'appointments' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Quản lý Lịch khám
                    </button>
                </div>

                {/* HIỂN THỊ TAB BÁC SĨ */}
                {activeTab === 'doctors' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-gray-50 text-gray-500 text-sm tracking-wider uppercase border-b border-gray-100">
                                    <th className="p-5 font-bold">Bác sĩ</th>
                                    <th className="p-5 font-bold">Liên hệ</th>
                                    <th className="p-5 font-bold">Chuyên khoa</th>
                                    <th className="p-5 font-bold">Trạng thái</th>
                                    <th className="p-5 font-bold text-right">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {doctors.map((doc) => {
                                    const safeName = doc.fullName || 'Bác sĩ ẩn danh';
                                    return (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-5">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white ${doc.active ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gray-400'}`}>
                                                        {safeName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-800">{safeName}</div>
                                                        <div className="text-xs text-gray-500">{doc.degree || 'Bác sĩ'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-gray-700 text-sm">{doc.email || 'N/A'}</div>
                                                <div className="text-gray-500 text-xs mt-1">{doc.phone || 'Chưa có SĐT'}</div>
                                            </td>
                                            <td className="p-5">
                        <span className="bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-lg text-sm">
                          {doc.specialtyName || 'Chưa xếp khoa'}
                        </span>
                                            </td>
                                            <td className="p-5">
                                                {doc.active ? (
                                                    <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Hoạt động</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Đã khóa</span>
                                                )}
                                            </td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => handleToggleDoctor(doc.id)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-end ml-auto ${
                                                        doc.active ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                                                    }`}
                                                >
                                                    {doc.active ? 'Khóa' : 'Mở khóa'}
                                                </button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* HIỂN THỊ TAB LỊCH KHÁM */}
                {activeTab === 'appointments' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-gray-50 text-gray-500 text-sm tracking-wider uppercase border-b border-gray-100">
                                    <th className="p-5 font-bold">Bệnh nhân</th>
                                    <th className="p-5 font-bold">Bác sĩ / Khoa</th>
                                    <th className="p-5 font-bold">Thời gian</th>
                                    <th className="p-5 font-bold">Trạng thái</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {appointments.length === 0 ? (
                                    <tr><td colSpan="4" className="p-10 text-center text-gray-500">Chưa có lịch hẹn nào trên hệ thống.</td></tr>
                                ) : appointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-5">
                                            <div className="font-bold text-gray-800">{appt.patientName}</div>
                                            <div className="text-sm text-gray-500">{appt.patientPhone}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-semibold text-gray-800">{appt.doctorName}</div>
                                            <div className="text-xs text-blue-600 font-medium">{appt.specialtyName}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-gray-800">{appt.startTime.substring(0, 5)}</div>
                                            <div className="text-sm text-gray-500">Ngày {appt.slotDate.split('-').reverse().join('/')}</div>
                                        </td>
                                        <td className="p-5">
                                            {getStatusBadge(appt.status)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* MODAL THÊM BÁC SĨ (Giữ nguyên) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                        <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Thêm Bác sĩ mới</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white hover:text-purple-600 rounded-full p-2 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddDoctor} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors" placeholder="VD: Nguyễn Văn A" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors" placeholder="bacsi@gmail.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu <span className="text-red-500">*</span></label>
                                <input type="password" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors" placeholder="Tối thiểu 8 ký tự" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors" placeholder="0901234567" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Chuyên khoa <span className="text-red-500">*</span></label>
                                <select required value={formData.specialtyId} onChange={e => setFormData({...formData, specialtyId: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors bg-white">
                                    <option value="">-- Chọn chuyên khoa --</option>
                                    {specialties.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Học vị / Bằng cấp</label>
                                <input type="text" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors" placeholder="VD: ThS.BS, TS.BS..." />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Giới thiệu bản thân</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-purple-500 transition-colors h-24 resize-none" placeholder="Mô tả kinh nghiệm, chuyên môn..."></textarea>
                            </div>

                            <div className="md:col-span-2 flex justify-end space-x-4 mt-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Hủy bỏ
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors disabled:bg-gray-400 flex items-center">
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu Bác sĩ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}