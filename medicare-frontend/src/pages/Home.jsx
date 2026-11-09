import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function Home() {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const isPatient = !user || user?.role === 'PATIENT';
    const isDoctor = user?.role === 'DOCTOR';
    const isAdmin = user?.role === 'ADMIN';

    // --- STATE CHO PATIENT ---
    const [searchKeyword, setSearchKeyword] = useState('');
    const [specialtiesList, setSpecialtiesList] = useState([]);
    const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('');
    const [symptomInput, setSymptomInput] = useState('');
    const [symptomResult, setSymptomResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [featuredDoctors, setFeaturedDoctors] = useState([]);

    // --- STATE CHO DOCTOR DASHBOARD ---
    const [doctorData, setDoctorData] = useState({
        totalToday: 0,
        pending: 0,
        schedules: [],
        upcoming: [],
        notifications: []
    });

    useEffect(() => {
        if (isPatient) {
            // Lấy danh sách bác sĩ tiêu biểu (code cũ)
            axiosClient.get('/doctors')
                .then(res => setFeaturedDoctors(res.data.slice(0, 3)))
                .catch(err => console.error("Lỗi tải bác sĩ", err));

            // LẤY DANH SÁCH CHUYÊN KHOA CHO BỘ LỌC
            axiosClient.get('/specialties')
                .then(res => setSpecialtiesList(res.data))
                .catch(err => console.error("Lỗi tải chuyên khoa", err));
        }

        if (isDoctor) {
            const today = new Date().toISOString().split('T')[0];

            // 1. Lấy lịch hẹn hôm nay
            axiosClient.get(`/doctor/appointments?date=${today}`)
                .then(res => {
                    const appts = res.data || [];
                    setDoctorData(prev => ({
                        ...prev,
                        totalToday: appts.length,
                        pending: appts.filter(a => a.status === 'PENDING').length,
                        upcoming: appts.slice(0, 5)
                    }));
                }).catch(console.error);

            // 2. Lấy danh sách ca làm việc
            axiosClient.get('/doctor/schedules')
                .then(res => {
                    setDoctorData(prev => ({ ...prev, schedules: res.data }));
                }).catch(console.error);

            // 3. Lấy thông báo gần đây
            axiosClient.get('/notifications?page=0&size=5')
                .then(res => {
                    setDoctorData(prev => ({ ...prev, notifications: res.data.content || [] }));
                }).catch(console.error);
        }
    }, [isPatient, isDoctor]);

    // --- XỬ LÝ TÌM KIẾM & TRIỆU CHỨNG (PATIENT) ---
    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (selectedSpecialtyFilter) params.append('specialtyId', selectedSpecialtyFilter);
        if (searchKeyword.trim()) params.append('search', searchKeyword.trim());

        // Nếu có bất kỳ bộ lọc nào thì mới chuyển trang kèm params
        if (params.toString()) {
            navigate(`/patient?${params.toString()}`);
        } else {
            navigate(`/patient`); // Nếu không nhập gì thì vào trang đặt lịch mặc định
        }
    };

    const symptomDatabase = [
        { keywords: ['sốt', 'ho', 'đau họng', 'sổ mũi', 'cảm cúm'], specialty: 'Nhi', advice: 'Nghỉ ngơi, uống nhiều nước ấm. Có thể dùng Paracetamol nếu sốt cao. Hãy đeo khẩu trang và đến khám bác sĩ.' },
        { keywords: ['đau bụng', 'tiêu chảy', 'buồn nôn', 'nôn', 'dạ dày'], specialty: 'Nội tổng quát', advice: 'Uống dung dịch Oresol bù nước, ăn thức ăn lỏng. Tránh đồ dầu mỡ. Nếu đau dữ dội, hãy đến cấp cứu.' },
        { keywords: ['ngứa', 'mẩn đỏ', 'dị ứng', 'mụn', 'phát ban'], specialty: 'Da liễu', advice: 'Tránh gãi. Tắm nước mát, mặc đồ rộng. Nếu khó thở hoặc sưng môi, cần gọi cấp cứu khẩn cấp.' },
        { keywords: ['đau đầu', 'chóng mặt', 'mất ngủ', 'căng thẳng'], specialty: 'Nội tổng quát', advice: 'Thư giãn không gian yên tĩnh. Xoa bóp thái dương. Nếu đau kéo dài kèm nhìn mờ, nên đi khám sớm.' }
    ];

    const handleSymptomCheck = () => {
        if (!symptomInput.trim()) return;
        setIsAnalyzing(true);
        setSymptomResult(null);

        setTimeout(() => {
            const inputLower = symptomInput.toLowerCase();
            let matched = symptomDatabase.find(item => item.keywords.some(k => inputLower.includes(k)));

            if (!matched) {
                matched = { specialty: 'Nội tổng quát', advice: 'Triệu chứng khá chung chung. Để an toàn, bạn nên đặt lịch khám với bác sĩ Nội tổng quát để được thăm khám cụ thể.' };
            }
            setSymptomResult(matched);
            setIsAnalyzing(false);
        }, 800);
    };

    // ================= GIAO DIỆN BÁC SĨ (DASHBOARD) =================
    if (isDoctor) {
        const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] pb-20">

                {/* HEADER BACKGROUND */}
                <div className="bg-gradient-to-r from-blue-700 to-cyan-600 pb-24 pt-12 px-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Chào buổi sáng, {user.fullName}!</h1>
                            <p className="text-blue-100 mt-2 text-lg flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                Hôm nay là {todayStr}
                            </p>
                        </div>
                        <Link to="/doctor/schedules" className="mt-6 md:mt-0 bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 shadow-lg transition-all flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Quản lý ca làm việc
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 -mt-16">

                    {/* STATS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10"></div>
                            <p className="text-gray-500 font-bold mb-1 uppercase tracking-wider text-sm">Lịch hẹn hôm nay</p>
                            <div className="flex items-end space-x-3">
                                <h2 className="text-5xl font-extrabold text-blue-600">{doctorData.totalToday}</h2>
                                <span className="text-gray-400 font-medium mb-1">bệnh nhân</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-10"></div>
                            <p className="text-gray-500 font-bold mb-1 uppercase tracking-wider text-sm">Chờ xác nhận</p>
                            <div className="flex items-end space-x-3">
                                <h2 className="text-5xl font-extrabold text-orange-500">{doctorData.pending}</h2>
                                <span className="text-gray-400 font-medium mb-1">cần xử lý</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -z-10"></div>
                            <p className="text-gray-500 font-bold mb-1 uppercase tracking-wider text-sm">Ca làm việc</p>
                            <div className="flex items-end space-x-3">
                                <h2 className="text-5xl font-extrabold text-green-500">{doctorData.schedules.length}</h2>
                                <span className="text-gray-400 font-medium mb-1">trong tuần</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* CỘT TRÁI: LỊCH HẸN & CA LÀM VIỆC */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* LỊCH KHÁM SẮP TỚI */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800">Lịch khám sắp tới</h3>
                                    <Link to="/doctor" className="text-blue-600 font-semibold hover:underline">Xem tất cả</Link>
                                </div>

                                {doctorData.upcoming.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <p className="text-gray-500 font-medium text-lg">Hôm nay bạn không có lịch hẹn nào.</p>
                                        <p className="text-gray-400 text-sm mt-1">Hãy kiểm tra lại vào ngày mai nhé!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {doctorData.upcoming.map((appt) => (
                                            <div key={appt.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                                                        {appt.patientName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-lg">{appt.patientName}</p>
                                                        <p className="text-sm text-gray-500 line-clamp-1">{appt.reason}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center space-x-4">
                                                    <div>
                                                        <p className="font-extrabold text-blue-600 text-lg">{appt.startTime.substring(0,5)}</p>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                                            appt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                              {appt.status === 'PENDING' ? 'Chờ duyệt' : 'Đã duyệt'}
                            </span>
                                                    </div>
                                                    <Link to="/doctor" className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CA LÀM VIỆC SẮP TỚI */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6">Ca làm việc của bạn</h3>
                                {doctorData.schedules.length === 0 ? (
                                    <p className="text-gray-500 italic">Bạn chưa đăng ký ca làm việc nào.</p>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {doctorData.schedules.slice(0, 4).map(sch => (
                                            <div key={sch.id} className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-blue-100 p-4 rounded-2xl">
                                                <p className="text-sm text-blue-600 font-bold mb-1">
                                                    Thứ {sch.dayOfWeek === 7 ? 'CN' : sch.dayOfWeek + 1}
                                                </p>
                                                <p className="font-extrabold text-gray-800 text-lg">
                                                    {sch.startTime.substring(0, 5)} - {sch.endTime.substring(0, 5)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* CỘT PHẢI: THÔNG BÁO & LỐI TẮT */}
                        <div className="lg:col-span-1 space-y-8">

                            {/* THÔNG BÁO */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                    Thông báo mới
                                </h3>
                                <div className="space-y-4">
                                    {doctorData.notifications.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">Không có thông báo nào.</p>
                                    ) : (
                                        doctorData.notifications.map(notif => (
                                            <div key={notif.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <p className="font-bold text-gray-800 text-sm">{notif.title}</p>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* LỐI TẮT NHANH */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Lối tắt nhanh</h3>
                                <div className="space-y-3">
                                    <Link to="/doctor" className="flex items-center p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">Quản lý lịch hẹn</p>
                                            <p className="text-xs text-gray-500">Duyệt và hoàn thành khám</p>
                                        </div>
                                    </Link>
                                    <Link to="/profile" className="flex items-center p-3 rounded-xl hover:bg-green-50 transition-colors group">
                                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">Hồ sơ cá nhân</p>
                                            <p className="text-xs text-gray-500">Cập nhật thông tin bác sĩ</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ================= GIAO DIỆN ADMIN =================
    if (isAdmin) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#0B1120] text-white pt-20 pb-20">
                <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-6">
                        Hệ thống Quản trị MediCare
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                        Chào mừng trở lại, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {user.fullName}!
            </span>
                    </h1>
                    <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                        Truy cập bảng điều khiển để xem thống kê và quản lý toàn bộ hệ thống phòng khám.
                    </p>
                    <Link to="/admin" className="inline-flex items-center bg-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-purple-700 shadow-lg shadow-purple-600/30 transition-all">
                        Vào trang Quản trị
                        <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </Link>
                </div>
            </div>
        );
    }

    // ================= GIAO DIỆN BỆNH NHÂN (GIỮ NGUYÊN NHƯ CŨ) =================
    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#0B1120] text-white">
            <div className="relative overflow-hidden pt-16 pb-20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                        Hệ thống Y tế Thông minh
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
                        Chăm sóc sức khỏe <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-cyan-300">
              chủ động & dễ dàng
            </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
                        Mô tả triệu chứng để nhận lời khuyên sơ cứu và tìm bác sĩ phù hợp nhất.
                    </p>

                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl mb-12 text-left max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <svg className="w-6 h-6 text-gray-400 absolute left-5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                                <input
                                    type="text"
                                    placeholder="Nhập triệu chứng (VD: Tôi bị sốt, ho, đau họng...)"
                                    className="w-full bg-white text-gray-900 border-none rounded-2xl pl-14 pr-4 py-4 text-lg font-medium outline-none focus:ring-4 focus:ring-blue-500/50 transition-all shadow-inner"
                                    value={symptomInput}
                                    onChange={(e) => setSymptomInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSymptomCheck()}
                                />
                            </div>
                            <button
                                onClick={handleSymptomCheck}
                                disabled={isAnalyzing}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-500 shadow-lg transition-all min-w-[180px] disabled:bg-blue-400 flex items-center justify-center"
                            >
                                {isAnalyzing ? 'Đang phân tích...' : 'Phân tích ngay'}
                            </button>
                        </div>

                        {symptomResult && (
                            <div className="mt-6 bg-blue-900/40 border border-blue-500/30 rounded-2xl p-6 animate-fade-in-up">
                                <h3 className="text-2xl font-bold text-white mb-3">Gợi ý: <span className="text-cyan-400">Khoa {symptomResult.specialty}</span></h3>
                                <p className="text-blue-100 leading-relaxed mb-5"><strong className="text-white">Sơ cứu tại nhà:</strong> {symptomResult.advice}</p>
                                <button
                                    onClick={() => navigate(`/patient?specialty=${encodeURIComponent(symptomResult.specialty)}`)}
                                    className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-md flex items-center"
                                >
                                    Đặt lịch khám ngay
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-4xl mx-auto border-t border-white/10 pt-8">
                        <form onSubmit={handleSearch} className="flex-grow w-full h-14 relative flex items-center bg-white/5 border border-white/20 rounded-full pl-2 pr-2 focus-within:bg-white/10 focus-within:border-cyan-400 transition-all shadow-lg">

                            {/* Dropdown chọn chuyên khoa (Đã custom lại) */}
                            <div className="relative flex items-center h-full">
                                <select
                                    className="h-full bg-transparent text-white border-none outline-none cursor-pointer pl-4 pr-8 font-medium text-[15px] appearance-none z-10"
                                    value={selectedSpecialtyFilter}
                                    onChange={(e) => setSelectedSpecialtyFilter(e.target.value)}
                                >
                                    <option value="" className="text-gray-900 bg-white">Tất cả khoa</option>
                                    {specialtiesList.map(s => (
                                        <option key={s.id} value={s.id} className="text-gray-900 bg-white">{s.name}</option>
                                    ))}
                                </select>
                                {/* Icon mũi tên tự vẽ */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>

                            {/* Vạch ngăn cách */}
                            <div className="w-px h-6 bg-white/20 mx-2"></div>

                            {/* Icon kính lúp */}
                            <svg className="w-5 h-5 text-gray-400 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>

                            {/* Ô nhập tên bác sĩ */}
                            <input
                                type="text"
                                placeholder="Tên bác sĩ..."
                                className="w-full h-full py-0 px-3 bg-transparent outline-none text-white placeholder-gray-400 text-lg"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />

                            {/* Nút Tìm kiếm */}
                            <button type="submit" className="bg-blue-600 text-white px-7 h-10 rounded-full font-bold hover:bg-blue-500 transition-colors shadow-md text-base whitespace-nowrap flex-shrink-0">
                                Tìm kiếm
                            </button>
                        </form>

                        {user && (
                            <Link to="/patient" className="w-full md:w-auto h-14 whitespace-nowrap bg-cyan-500 text-white px-8 rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all text-lg flex items-center justify-center flex-shrink-0">
                                Đặt lịch khám mới
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-[#0F172A] py-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Quy trình khám bệnh trực tuyến</h2>
                        <p className="text-xl text-gray-400">Chỉ với 3 bước đơn giản, bạn đã có mặt trong danh sách khám của bác sĩ.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative">
                        <div className="hidden md:block absolute top-14 left-1/6 right-1/6 h-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/50 to-green-500/20"></div>

                        <div className="relative z-10">
                            <div className="w-28 h-28 mx-auto bg-[#1E293B] border-4 border-blue-500 rounded-full flex items-center justify-center text-4xl font-bold text-blue-400 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.5)]">1</div>
                            <h3 className="text-2xl font-bold mb-3">Chọn Bác sĩ</h3>
                            <p className="text-gray-400">Tìm kiếm bác sĩ theo chuyên khoa hoặc để hệ thống gợi ý dựa trên triệu chứng.</p>
                        </div>

                        <div className="relative z-10">
                            <div className="w-28 h-28 mx-auto bg-[#1E293B] border-4 border-cyan-500 rounded-full flex items-center justify-center text-4xl font-bold text-cyan-400 mb-6 shadow-[0_0_40px_rgba(6,182,212,0.5)]">2</div>
                            <h3 className="text-2xl font-bold mb-3">Đặt Lịch Hẹn</h3>
                            <p className="text-gray-400">Chọn khung giờ còn trống phù hợp với bạn và xác nhận đặt lịch trực tuyến.</p>
                        </div>

                        <div className="relative z-10">
                            <div className="w-28 h-28 mx-auto bg-[#1E293B] border-4 border-green-500 rounded-full flex items-center justify-center text-4xl font-bold text-green-400 mb-6 shadow-[0_0_40px_rgba(34,197,94,0.5)]">3</div>
                            <h3 className="text-2xl font-bold mb-3">Đến Khám</h3>
                            <p className="text-gray-400">Đến phòng khám đúng giờ, check-in và nhận kết quả khám bệnh ngay trên hệ thống.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-24 bg-[#0B1120]">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-bold mb-3">Bác sĩ tiêu biểu</h2>
                            <p className="text-gray-400 text-lg">Đội ngũ y bác sĩ giàu kinh nghiệm, tận tâm với nghề.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredDoctors.length > 0 ? featuredDoctors.map(doc => (
                            <div key={doc.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-white/10 hover:-translate-y-2 transition-all duration-300 group cursor-pointer shadow-xl">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center text-5xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-6 group-hover:scale-110 transition-transform">
                                    {doc.fullName.charAt(0)}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{doc.fullName}</h3>
                                <p className="text-cyan-400 font-semibold text-lg mb-4">{doc.specialtyName}</p>
                                <span className="bg-white/10 text-gray-300 px-4 py-1.5 rounded-full text-sm mb-8">{doc.degree || 'Bác sĩ'}</span>
                                <Link to={`/patient?doctorId=${doc.id}&specialtyId=${doc.specialtyId}`} className="w-full py-3 bg-blue-600/20 text-blue-400 font-bold text-lg rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                                    Đặt lịch hẹn
                                </Link>
                            </div>
                        )) : (
                            <p className="text-gray-500 col-span-3 text-center text-lg">Đang tải danh sách bác sĩ...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}