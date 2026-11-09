import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function PatientBooking() {
    const navigate = useNavigate();
    const location = useLocation();

    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);

    const [selectedSpec, setSelectedSpec] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState('');

    // Lấy tham số từ URL (nếu có)
    const queryParams = new URLSearchParams(location.search);
    const urlSpecId = queryParams.get('specialtyId');
    const urlDocId = queryParams.get('doctorId');
    const urlSearch = queryParams.get('search');

    // 1. Tải chuyên khoa
    useEffect(() => {
        axiosClient.get('/specialties')
            .then(res => {
                setSpecialties(res.data);
                if (urlSpecId) setSelectedSpec(urlSpecId);
            })
            .catch(err => console.error(err));

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }, [urlSpecId]);

    // 2. Tải bác sĩ khi chọn chuyên khoa
    useEffect(() => {
        if (selectedSpec || urlSearch) {
            let apiUrl = `/doctors?`;
            if (selectedSpec) apiUrl += `specialtyId=${selectedSpec}&`;
            if (urlSearch) apiUrl += `keyword=${encodeURIComponent(urlSearch)}`;

            axiosClient.get(apiUrl)
                .then(res => {
                    setDoctors(res.data);
                    if (urlDocId) {
                        setSelectedDoctor(urlDocId);
                    } else {
                        setSelectedDoctor('');
                    }
                    setSlots([]);
                })
                .catch(err => console.error(err));
        }
    }, [selectedSpec, urlSearch, urlDocId]);

    // 3. Tải Slot trống khi chọn Bác sĩ & Ngày
    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            setLoadingSlots(true);
            setSlots([]); // Xóa danh sách cũ ngay lập tức
            setSelectedSlot(null);
            setError(''); // Xóa lỗi cũ

            axiosClient.get(`/doctors/${selectedDoctor}/slots?date=${selectedDate}`)
                .then(res => {
                    // Chỉ lấy các slot có trạng thái AVAILABLE
                    const availableSlots = res.data.filter(slot => slot.status === 'AVAILABLE');
                    setSlots(availableSlots);
                })
                .catch(err => {
                    console.error("Lỗi lấy slot:", err);
                    setSlots([]);
                })
                .finally(() => setLoadingSlots(false));
        }
    }, [selectedDoctor, selectedDate]);

    // 4. Đặt lịch
    const handleBook = async () => {
        setError('');

        // 1. Kiểm tra xem đã đăng nhập chưa
        const token = localStorage.getItem('token');
        if (!token) {
            return setError('Bạn cần đăng nhập để thực hiện đặt lịch. Vui lòng đăng nhập!');
        }

        if (!selectedSlot) return setError('Vui lòng chọn một khung giờ khám ở Bước 4.');
        if (!reason.trim()) return setError('Vui lòng nhập lý do khám ở Bước 5.');

        setLoading(true);
        try {
            await axiosClient.post('/appointments', {
                slotId: selectedSlot.id,
                reason: reason
            });
            alert('Đặt lịch khám thành công! Vui lòng theo dõi trạng thái trong mục "Lịch sử khám".');
            navigate('/patient/history');
        } catch (err) {
            // 2. Bắt lỗi 401 (Hết hạn token) hoặc 403 (Không có quyền)
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
            } else {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto mt-8 p-4 mb-20">
            <div className="text-lg text-gray-500 mb-6 flex items-center space-x-2">
                <span className="hover:text-blue-600 cursor-pointer font-medium" onClick={() => navigate('/')}>Trang chủ</span>
                <span>/</span>
                <span className="text-blue-600 font-bold">Đặt lịch khám</span>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-blue-600 p-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">Phiếu Đăng Ký Khám Bệnh</h1>
                    <p className="text-blue-100 text-lg">Vui lòng làm theo 5 bước dưới đây để hoàn tất đặt lịch.</p>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* CỘT TRÁI: BƯỚC 1, 2, 3 */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <label className="flex items-center text-xl font-bold text-gray-800 mb-3">
                                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-xl">1</span>
                                Chọn Chuyên Khoa
                            </label>
                            <select
                                className="w-full bg-gray-50 border-2 border-gray-300 text-gray-900 text-lg font-medium rounded-2xl px-5 py-4 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                                value={selectedSpec}
                                onChange={(e) => setSelectedSpec(e.target.value)}
                            >
                                <option value="">-- Bấm vào đây để chọn --</option>
                                {specialties.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center text-xl font-bold text-gray-800 mb-3">
                                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-xl">2</span>
                                Chọn Bác Sĩ
                            </label>
                            <select
                                className={`w-full bg-gray-50 border-2 border-gray-300 text-gray-900 text-lg font-medium rounded-2xl px-5 py-4 outline-none transition-all cursor-pointer ${
                                    !selectedSpec ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
                                }`}
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                disabled={!selectedSpec}
                            >
                                <option value="">{selectedSpec ? '-- Chọn bác sĩ khám --' : 'Vui lòng chọn chuyên khoa trước'}</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.fullName} - {d.degree}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center text-xl font-bold text-gray-800 mb-3">
                                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-xl">3</span>
                                Chọn Ngày Khám
                            </label>
                            <input
                                type="date"
                                className="w-full bg-gray-50 border-2 border-gray-300 text-gray-900 text-lg font-medium rounded-2xl px-5 py-4 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start">
                            <svg className="w-6 h-6 text-orange-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <p className="text-orange-700 font-medium">Lưu ý: Bạn cần đặt lịch trước ít nhất 2 tiếng so với giờ khám.</p>
                        </div>
                    </div>

                    {/* CỘT PHẢI: BƯỚC 4 & 5 */}
                    <div className="lg:col-span-7 bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200">
                        <div className="mb-8">
                            <label className="flex items-center text-xl font-bold text-gray-800 mb-4">
                                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-xl">4</span>
                                Chọn Khung Giờ Khám
                            </label>

                            {loadingSlots ? (
                                <div className="flex items-center justify-center p-8 bg-white rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 text-lg font-medium">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                                    Đang tìm lịch trống...
                                </div>
                            ) : !selectedDoctor ? (
                                <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-center">
                                    <p className="text-gray-500 text-lg font-medium">Vui lòng hoàn thành Bước 2 và Bước 3 trước.</p>
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="p-8 bg-red-50 border-2 border-red-200 rounded-2xl text-center">
                                    <p className="text-red-600 text-lg font-bold">Bác sĩ không có lịch trống trong ngày này.</p>
                                    <p className="text-red-500 mt-1">Vui lòng chọn ngày khác hoặc bác sĩ khác.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {slots.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`py-4 rounded-xl border-2 text-center text-xl font-bold transition-all relative ${
                                                selectedSlot?.id === slot.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                            }`}
                                        >
                                            {slot.startTime.substring(0, 5)}
                                            {selectedSlot?.id === slot.id && (
                                                <span className="absolute -top-2 -right-2 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="flex items-center text-xl font-bold text-gray-800 mb-3">
                                <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-xl">5</span>
                                Lý Do Khám Bệnh
                            </label>
                            <textarea
                                className="w-full bg-white border-2 border-gray-300 text-gray-900 text-lg rounded-2xl px-5 py-4 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all h-32 resize-none"
                                placeholder="Ví dụ: Tôi bị đau đầu, ho và sốt từ hôm qua..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* FOOTER: HIỂN THỊ LỖI VÀ NÚT XÁC NHẬN */}
                <div className="bg-white p-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        {error && (
                            <div className="flex items-center">
                                <p className="text-red-600 font-bold text-lg flex items-center mr-4">
                                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {error}
                                </p>
                                {/* Nếu lỗi liên quan đến đăng nhập, hiện nút chuyển hướng */}
                                {(error.includes('đăng nhập') || error.includes('Phiên')) && (
                                    <Link
                                        to="/login"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    >
                                        Đăng nhập ngay
                                    </Link>
                                )}
                            </div>
                        )}
                        {selectedSlot && (
                            <p className="text-gray-600 text-lg mt-2">
                                Bạn đang chọn: <span className="font-bold text-blue-600">Giờ {selectedSlot.startTime.substring(0, 5)} - Ngày {selectedDate.split('-').reverse().join('/')}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleBook}
                        disabled={loading}
                        className="w-full md:w-auto bg-green-600 text-white px-10 py-4 rounded-2xl font-bold text-xl hover:bg-green-700 shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 flex items-center justify-center disabled:bg-gray-400 disabled:transform-none"
                    >
                        {loading ? 'Đang xử lý...' : (
                            <>
                                Xác Nhận Đặt Lịch
                                <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}