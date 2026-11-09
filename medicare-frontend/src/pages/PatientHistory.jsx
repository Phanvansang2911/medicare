import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function PatientHistory() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // State cho Modal đổi lịch
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAppt, setCurrentAppt] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [newSlots, setNewSlots] = useState([]);
    const [selectedNewSlot, setSelectedNewSlot] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const fetchHistory = () => {
        setLoading(true);
        axiosClient.get('/appointments/me?page=0&size=50')
            .then(res => setAppointments(res.data.content || []))
            .catch(err => setError('Không thể tải lịch sử. Vui lòng thử lại sau.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Hàm kiểm tra xem có được phép Hủy/Đổi không (còn > 2 tiếng)
    const canModify = (appt) => {
        if (!['PENDING', 'CONFIRMED'].includes(appt.status)) return false;
        const slotDateTime = new Date(`${appt.slotDate}T${appt.startTime}`);
        const now = new Date();
        const diffInHours = (slotDateTime - now) / (1000 * 60 * 60);
        return diffInHours >= 2; // Trả về true nếu còn >= 2 tiếng
    };

    const handleCancel = async (id) => {
        const reason = prompt('Nhập lý do hủy lịch:');
        if (!reason) return;
        try {
            await axiosClient.patch(`/appointments/${id}/cancel`, { reason });
            alert('Đã hủy lịch thành công!');
            fetchHistory();
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể hủy lịch này!');
        }
    };

    // Mở Modal đổi lịch
    const openRescheduleModal = (appt) => {
        setCurrentAppt(appt);
        setNewDate(new Date().toISOString().split('T')[0]);
        setNewSlots([]);
        setSelectedNewSlot(null);
        setIsModalOpen(true);
    };

    // Tải slot mới khi chọn ngày trong Modal
    useEffect(() => {
        if (isModalOpen && currentAppt && newDate) {
            setModalLoading(true);
            axiosClient.get(`/doctors/${currentAppt.doctorId}/slots?date=${newDate}`)
                .then(res => setNewSlots(res.data))
                .catch(err => console.error(err))
                .finally(() => setModalLoading(false));
        }
    }, [isModalOpen, currentAppt, newDate]);

    // Xác nhận đổi lịch
    const handleReschedule = async () => {
        if (!selectedNewSlot) return alert('Vui lòng chọn khung giờ mới!');
        try {
            await axiosClient.patch(`/appointments/${currentAppt.id}/reschedule`, {
                newSlotId: selectedNewSlot.id
            });
            alert('Đổi lịch thành công! Vui lòng chờ bác sĩ xác nhận lại.');
            setIsModalOpen(false);
            fetchHistory();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi đổi lịch!');
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING': return { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', border: 'border-l-yellow-400' };
            case 'CONFIRMED': return { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-300', border: 'border-l-blue-500' };
            case 'ARRIVED': return { label: 'Đã đến', color: 'bg-cyan-100 text-cyan-700 border-cyan-300', border: 'border-l-cyan-500' };
            case 'COMPLETED': return { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-300', border: 'border-l-green-500' };
            case 'CANCELLED': return { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-300', border: 'border-l-red-500' };
            case 'REJECTED': return { label: 'Bị từ chối', color: 'bg-red-100 text-red-700 border-red-300', border: 'border-l-red-500' };
            case 'EXPIRED': return { label: 'Hết hạn', color: 'bg-gray-100 text-gray-700 border-gray-300', border: 'border-l-gray-400' };
            default: return { label: status, color: 'bg-gray-100 text-gray-700', border: 'border-l-gray-400' };
        }
    };

    if (loading) return <div className="text-center mt-20 text-blue-500 font-medium">Đang tải lịch sử...</div>;
    if (error) return <div className="text-center mt-20 text-red-500 font-bold">{error}</div>;

    return (
        <div className="max-w-5xl mx-auto mt-10 p-4 mb-20">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Lịch sử khám bệnh</h1>
                    <p className="text-gray-500 mt-1">Quản lý các lịch hẹn và kết quả khám của bạn.</p>
                </div>
                <button onClick={() => navigate('/patient')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5">
                    + Đặt lịch mới
                </button>
            </div>

            {/* DANH SÁCH LỊCH HẸN */}
            {appointments.length === 0 ? (
                <div className="bg-white p-16 text-center rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 font-medium text-lg">Bạn chưa có lịch hẹn nào.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {appointments.map((appt) => {
                        const statusInfo = getStatusInfo(appt.status);
                        const allowAction = canModify(appt);

                        return (
                            <div key={appt.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-8 ${statusInfo.border} p-6 flex flex-col md:flex-row justify-between items-start md:items-center transition-all hover:shadow-md`}>

                                <div className="mb-4 md:mb-0">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <h3 className="text-xl font-bold text-gray-800">Bs. {appt.doctorName}</h3>
                                        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{appt.specialtyName}</span>
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                                    </div>

                                    <div className="flex items-center text-gray-600 font-medium mt-3">
                                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <span className="text-lg font-bold text-blue-600 mr-2">{appt.startTime.substring(0,5)} - {appt.endTime.substring(0,5)}</span>
                                        <span>Ngày {appt.slotDate.split('-').reverse().join('/')}</span>
                                    </div>

                                    <p className="text-gray-500 mt-2 text-sm"><span className="font-semibold text-gray-700">Lý do:</span> {appt.reason}</p>

                                    {appt.doctorNote && (
                                        <div className="mt-3 bg-green-50 border border-green-100 p-3 rounded-xl inline-block w-full">
                                            <p className="text-sm text-green-800"><strong className="font-bold">Kết quả khám:</strong> {appt.doctorNote}</p>
                                        </div>
                                    )}
                                </div>

                                {/* CÁC NÚT THAO TÁC */}
                                <div className="flex flex-col space-y-2 min-w-[150px]">
                                    {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                                        <>
                                            <button
                                                onClick={() => openRescheduleModal(appt)}
                                                disabled={!allowAction}
                                                className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center ${
                                                    allowAction
                                                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                                                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                }`}
                                                title={!allowAction ? "Chỉ được đổi lịch trước 2 giờ" : ""}
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                Đổi lịch
                                            </button>

                                            <button
                                                onClick={() => handleCancel(appt.id)}
                                                disabled={!allowAction}
                                                className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center ${
                                                    allowAction
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                                }`}
                                                title={!allowAction ? "Chỉ được hủy lịch trước 2 giờ" : ""}
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                Hủy lịch
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL ĐỔI LỊCH (Đã phóng to) */}
            {isModalOpen && currentAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in-up">

                        {/* Header Modal */}
                        <div className="bg-orange-500 p-8 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold">Đổi lịch khám</h2>
                                <p className="text-orange-100 mt-2 text-lg">Bác sĩ: {currentAppt.doctorName} - {currentAppt.specialtyName}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white hover:text-orange-500 rounded-full p-2 transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Cột trái: Chọn ngày */}
                            <div className="md:col-span-1">
                                <label className="block text-lg font-bold text-gray-800 mb-3">1. Chọn ngày mới</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full border-2 border-gray-300 p-4 rounded-xl text-lg font-medium outline-none focus:border-orange-500 transition-colors cursor-pointer"
                                />
                                <div className="mt-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <p className="text-sm text-orange-700 leading-relaxed">
                                        <strong>Lưu ý:</strong> Các khung giờ bị gạch ngang hoặc mờ đi là những giờ đã có người đặt. Bạn chỉ có thể chọn các khung giờ còn trống.
                                    </p>
                                </div>
                            </div>

                            {/* Cột phải: Chọn giờ */}
                            <div className="md:col-span-2">
                                <label className="block text-lg font-bold text-gray-800 mb-3">2. Chọn giờ mới</label>
                                {modalLoading ? (
                                    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                                        <p className="text-blue-500 font-medium">Đang tìm lịch trống...</p>
                                    </div>
                                ) : newSlots.length === 0 ? (
                                    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                                        <p className="text-red-500 font-medium">Bác sĩ không có lịch làm việc trong ngày này.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2">
                                        {newSlots.map(slot => {
                                            const isBooked = slot.status !== 'AVAILABLE';
                                            const isSelected = selectedNewSlot?.id === slot.id;

                                            return (
                                                <button
                                                    key={slot.id}
                                                    disabled={isBooked}
                                                    onClick={() => setSelectedNewSlot(slot)}
                                                    className={`py-3 px-2 rounded-xl border-2 text-center font-bold text-lg transition-all relative ${
                                                        isBooked
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                                            : isSelected
                                                                ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                                                    }`}
                                                >
                                                    {slot.startTime.substring(0, 5)}

                                                    {/* Icon khóa cho các slot đã đặt */}
                                                    {isBooked && (
                                                        <div className="absolute top-1 right-1">
                                                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="bg-gray-50 p-6 flex justify-end space-x-4 border-t border-gray-200">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3 rounded-xl font-bold text-gray-600 bg-white border-2 border-gray-300 hover:bg-gray-100 transition-colors text-lg"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={!selectedNewSlot}
                                className="px-8 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-200 transition-all disabled:bg-gray-300 disabled:shadow-none text-lg flex items-center"
                            >
                                Xác nhận đổi
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}