import React, { useEffect } from "react";
import halmToast from "@/utils/toast";

function Popup({ message, type = 'error', duration = 3000, onClose }) {
  useEffect(() => {
    if (!message) return;

    halmToast.show({
      title: type === 'success' ? 'Thành công' : 'Thông báo',
      message,
      type: type === 'success' ? 'success' : 'error',
      duration,
    });

    if (onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [message, type, duration, onClose]);

  return null;
}

export default Popup;
