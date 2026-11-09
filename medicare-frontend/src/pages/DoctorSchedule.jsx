import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export default function DoctorSchedule() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    // State quản lý việc tạo mới hay chỉnh sửa
    const [editingId, setEditingId] = useState(null);

    const defaultForm = {
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '12:00',
        effectiveFrom: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState(defaultForm);

    const fetchSchedules = () => {
        axiosClient.get('/doctor/schedules')
            .then(res => setSchedules(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Gọi API cập nhật
                await axiosClient.put(`/doctor/schedules/${editingId}`, formData);
                alert('Cập nhật ca làm việc thành công!');
                setEditingId(null);
            } else {
                // Gọi API tạo mới
                await axiosClient.post('/doctor/schedules', formData);
                alert('Thêm ca làm việc thành công!');
            }
            setFormData(defaultForm);
            fetchSchedules();
        } catch (err) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa ca làm việc này? Các slot chưa đặt sẽ bị hủy.')) return;
        try {
            await axiosClient.delete(`/doctor/schedules/${id}`);
            if (editingId === id) {
                setEditingId(null);
                setFormData(defaultForm);
            }
            fetchSchedules();
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể xóa ca này!');
        }
    };

    const handleEditClick = (shift) => {
        setEditingId(shift.id);
        setFormData({
            dayOfWeek: shift.dayOfWeek,
            startTime: shift.startTime.substring(0, 5),
            endTime: shift.endTime.substring(0, 5),
            effectiveFrom: shift.effectiveFrom
        });
        // Cuộn lên đầu trang để thấy form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(defaultForm);
    };

    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    return (
        // Sử dụng w-full để tràn viền màn hình
        <div className="w-full px-4 lg:px-8 xl:px-12 mt-8 mb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800">Quản lý Ca làm việc</h1>
                <p className="text-gray-500 mt-2 text-lg">Thiết lập thời gian biểu để hệ thống tự động tạo các khung giờ khám.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* CỘT TRÁI: FORM (3/12) */}
                <div className="xl:col-span-3 space-y-6">
                    <div className={`bg-white p-8 rounded-3xl shadow-lg border relative overflow-hidden transition-all ${editingId ? 'border-orange-400 shadow-orange-100' : 'border-blue-50'}`}>
                        <h2 className={`text-2xl font-bold mb-6 flex items-center ${editingId ? 'text-orange-600' : 'text-gray-800'}`}>
                            {editingId ? (
                                <><svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> Sửa ca làm việc</>
                            ) : (
                                <><svg className="w-7 h-7 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> Đăng ký ca mới</>
                            )}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-base font-bold text-gray-700 block mb-2">Thứ trong tuần</label>
                                <select
                                    value={formData.dayOfWeek}
                                    onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}
                                    className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg outline-none focus:border-blue-500 font-medium cursor-pointer bg-gray-50 focus:bg-white"
                                >
                                    {dayNames.map((day, index) => (
                                        <option key={index + 1} value={index + 1}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-base font-bold text-gray-700 block mb-2">Bắt đầu</label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                                        className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg outline-none focus:border-blue-500 bg-gray-50 focus:bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-base font-bold text-gray-700 block mb-2">Kết thúc</label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                                        className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg outline-none focus:border-blue-500 bg-gray-50 focus:bg-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-base font-bold text-gray-700 block mb-2">Hiệu lực từ</label>
                                <input
                                    type="date"
                                    value={formData.effectiveFrom}
                                    onChange={e => setFormData({...formData, effectiveFrom: e.target.value})}
                                    className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg outline-none focus:border-blue-500 bg-gray-50 focus:bg-white cursor-pointer"
                                    required
                                />
                            </div>

                            <div className="flex flex-col space-y-3 pt-2">
                                <button type="submit" className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all transform hover:-translate-y-1 ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                                    {editingId ? 'Lưu thay đổi' : 'Tạo ca làm việc'}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={cancelEdit} className="w-full py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                        Hủy bỏ
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* CỘT PHẢI: LỊCH TUẦN (9/12) */}
                <div className="xl:col-span-9">
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 h-full min-h-[600px]">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                <svg className="w-8 h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                Thời khóa biểu tuần
                            </h2>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>
                        ) : (
                            // Lưới 7 cột nới rộng không gian
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-7 gap-4">
                                {dayNames.map((dayName, index) => {
                                    const dayOfWeek = index + 1;
                                    const shifts = schedules.filter(s => s.dayOfWeek === dayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime));

                                    return (
                                        <div key={dayOfWeek} className="flex flex-col">
                                            {/* Header Ngày */}
                                            <div className={`text-center py-3 rounded-t-xl text-lg font-bold ${shifts.length > 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                                                {dayName}
                                            </div>

                                            {/* Body chứa các ca */}
                                            <div className="bg-gray-50/50 border border-t-0 border-gray-100 rounded-b-xl p-3 flex-grow min-h-[250px] flex flex-col gap-3">
                                                {shifts.length === 0 ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <span className="text-sm text-gray-400 italic text-center">Trống</span>
                                                    </div>
                                                ) : (
                                                    shifts.map(shift => (
                                                        <div
                                                            key={shift.id}
                                                            className={`bg-white border-2 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${editingId === shift.id ? 'border-orange-400 ring-2 ring-orange-100' : 'border-blue-100 hover:border-blue-300'}`}
                                                            onClick={() => handleEditClick(shift)}
                                                        >
                                                            <div className="font-extrabold text-blue-700 text-xl text-center mb-1">
                                                                {shift.startTime.substring(0, 5)}
                                                            </div>
                                                            <div className="w-8 h-0.5 bg-gray-200 mx-auto my-1 rounded"></div>
                                                            <div className="font-extrabold text-gray-600 text-lg text-center">
                                                                {shift.endTime.substring(0, 5)}
                                                            </div>

                                                            <div className="text-xs text-center text-gray-400 mt-2">
                                                                Từ {shift.effectiveFrom.split('-').reverse().join('/')}
                                                            </div>

                                                            {/* Nút Xóa (hiện khi hover) */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(shift.id); }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white shadow-md border-2 border-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-110"
                                                                title="Xóa ca"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}