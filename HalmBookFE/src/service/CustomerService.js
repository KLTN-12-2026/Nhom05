import axiosInstance from "./AxiosInstance";

const handleError = (error) => {
    if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
            console.error("LỖI XÁC THỰC: Người dùng chưa đăng nhập hoặc Session đã hết hạn. Đang chuyển hướng đến trang đăng nhập....");
            window.location.href = "/dangnhap";
            return;
        }
        console.error("LỖI SERVER:", error.response.data);
        throw new Error(error.response.data?.message || `Lỗi HTTP : ${error.response.status}`)


    } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error("Không nhận được phản hồi từ Server.");
    } else {
        console.error("Error:", error.message);
        throw new Error("Lỗi trong quá trình thiết lập yêu cầu.");
    }
};

export const getCurrentCustomer = async () => {
    try {
        const response = await axiosInstance.get("/api/home/customer/info");
        return response.data;
    } catch (error) {
        handleError(error);
        return null; 
    }
};

export const updateCustomer = async (customerDetails) => {
    try {
        const response = await axiosInstance.put("/api/home/customer/edit", customerDetails);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};