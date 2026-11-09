import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function DoctorDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchAppointments = () => {
        setLoading(true);
        setError('');
        axiosClient.get(`/doctor/appointments?date=${date}`)
            .then(res => setAppointments(res.data || []))
            .catch(err => {
                console.error("Lỗi tải lịch hẹn:", err);
                setError("Không thể tải dữ liệu. Vui lòng thử lại!");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAppointments();
    }, [date]);

    const handleAction = async (id, action, extraData = null) => {
        try {
            let url = `/doctor/appointments/${id}/${action}`;
            let payload = extraData ? extraData : {};

            await axiosClient.patch(url, payload);
            alert('Thao tác thành công!');
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    const formatTime = (timeStr) => timeStr ? timeStr.substring(0, 5) : '';

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>Chờ xác nhận</span>;
            case 'CONFIRMED':
                return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Đã xác nhận</span>;
            case 'ARRIVED':
                return <span className="bg-cyan-100 text-cyan-700 border border-cyan-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-cyan-500 mr-2 animate-pulse"></span>Đã đến</span>;
            case 'COMPLETED':
                return <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Hoàn thành</span>;
            case 'NO_SHOW':
                return <span className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>Vắng mặt</span>;
            case 'CANCELLED':
            case 'REJECTED':
                return <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center w-max"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Đã hủy</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold">{status}</span>;
        }
    };

    // Hàm kiểm tra xem đã quá giờ khám 15 phút chưa (để bật nút Vắng mặt)
    const canMarkNoShow = (slotDate, startTime) => {
        const slotDateTime = new Date(`${slotDate}T${startTime}`);
        const now = new Date();
        const diffInMinutes = (now - slotDateTime) / (1000 * 60);
        return diffInMinutes >= 15; // Cấu hình 15 phút giống Backend
    };

    return (
        <div className="max-w-7xl mx-auto mt-10 p-4 mb-20">

            {/* HEADER */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">Quản lý Lịch hẹn</h1>
                    <p className="text-gray-500 mt-2">Xem và xử lý danh sách bệnh nhân đặt khám của bạn.</p>
                </div>

                <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                    <label className="text-sm font-bold text-gray-600 pl-2">Ngày xem:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border-none bg-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 shadow-sm cursor-pointer"
                    />
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">{error}</div>}

            {/* TABLE DANH SÁCH */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-blue-500 font-medium">Đang tải dữ liệu...</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <h3 className="text-xl font-bold text-gray-600 mb-2">Không có lịch hẹn nào</h3>
                    <p className="text-gray-400">Bạn không có bệnh nhân nào đặt lịch trong ngày này.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm tracking-wider uppercase">
                                <th className="p-5 font-bold">Giờ khám</th>
                                <th className="p-5 font-bold">Bệnh nhân</th>
                                <th className="p-5 font-bold">Lý do khám</th>
                                <th className="p-5 font-bold">Trạng thái</th>
                                <th className="p-5 font-bold text-right">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {appointments.map((appt) => (
                                <tr key={appt.id} className="hover:bg-blue-50/50 transition-colors group">

                                    {/* Cột giờ */}
                                    <td className="p-5">
                                        <div className="font-extrabold text-blue-600 text-lg">
                                            {formatTime(appt.startTime)}
                                        </div>
                                        <div className="text-xs text-gray-400 font-medium">
                                            đến {formatTime(appt.endTime)}
                                        </div>
                                    </td>

                                    {/* Cột bệnh nhân */}
                                    <td className="p-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                                {appt.patientName ? appt.patientName.charAt(0).toUpperCase() : 'B'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{appt.patientName}</div>
                                                <div className="text-sm text-gray-500 flex items-center mt-0.5">
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                    {appt.patientPhone || 'Không có SĐT'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Cột lý do */}
                                    <td className="p-5">
                                        <p className="text-gray-700 max-w-xs truncate" title={appt.reason}>
                                            {appt.reason}
                                        </p>
                                    </td>

                                    {/* Cột trạng thái */}
                                    <td className="p-5">
                                        {getStatusBadge(appt.status)}
                                    </td>

                                    {/* Cột thao tác */}
                                    <td className="p-5 text-right">
                                        {appt.status === 'PENDING' && (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleAction(appt.id, 'confirm')}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                    Xác nhận
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Nhập lý do từ chối:');
                                                        if (reason) handleAction(appt.id, 'reject', { reason });
                                                    }}
                                                    className="bg-white text-red-500 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-all flex items-center"
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        )}

                                        {appt.status === 'CONFIRMED' && (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleAction(appt.id, 'check-in')}
                                                    className="bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-green-200 hover:bg-green-600 hover:-translate-y-0.5 transition-all flex items-center ml-auto"
                                                >
                                                    <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                                                    Đã đến
                                                </button>

                                                {/* NÚT VẮNG MẶT (Chỉ sáng lên khi quá 15 phút) */}
                                                <button
                                                    onClick={() => {
                                                        if(window.confirm('Bạn có chắc chắn bệnh nhân này vắng mặt?')) {
                                                            handleAction(appt.id, 'no-show');
                                                        }
                                                    }}
                                                    disabled={!canMarkNoShow(appt.slotDate, appt.startTime)}
                                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center ${
                                                        canMarkNoShow(appt.slotDate, appt.startTime)
                                                            ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:shadow-md'
                                                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                                    }`}
                                                    title={!canMarkNoShow(appt.slotDate, appt.startTime) ? "Chỉ được đánh dấu vắng mặt sau giờ khám 15 phút" : "Đánh dấu bệnh nhân vắng mặt"}
                                                >
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    Vắng
                                                </button>
                                            </div>
                                        )}

                                        {appt.status === 'ARRIVED' && (
                                            <button
                                                onClick={() => {
                                                    const note = prompt('Nhập kết quả khám / Ghi chú của bác sĩ:');
                                                    if (note) handleAction(appt.id, 'complete', { doctorNote: note });
                                                }}
                                                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-purple-200 hover:bg-purple-700 hover:-translate-y-0.5 transition-all flex items-center ml-auto"
                                            >
                                                <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                Hoàn thành khám
                                            </button>
                                        )}

                                        {['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(appt.status) && (
                                            <span className="text-gray-400 text-sm font-medium italic flex items-center justify-end">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Đã kết thúc
                        </span>
                                        )}
                                    </td>

                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}