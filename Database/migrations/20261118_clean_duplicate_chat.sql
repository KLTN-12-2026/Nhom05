-- Clean up duplicate admin replies in support_ticket chat_history
UPDATE support_ticket 
SET chat_history = '[{"senderName":"An Trần","sender":"USER","time":"2026-11-09 16:51","content":"giúp t với"},{"senderName":"Ban Quản Trị HALMBOOK","sender":"ADMIN","time":"2026-11-09 19:57","content":"có chuyện j đó"},{"senderName":"An Trần","sender":"USER","time":"2026-11-09 19:57","content":"tôi muốn nhờ giúp đỡ về vấn đề nạp"},{"senderName":"Ban Quản Trị HALMBOOK","sender":"ADMIN","time":"2026-11-09 19:57","content":"oke"}]' 
WHERE ticket_id = 7;

UPDATE support_ticket 
SET chat_history = '[{"senderName":"An Trần","sender":"USER","avatar":"https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1856448589125706&height=200&width=200&ext=1796926394&hash=AftvHFyzaGvoBnEqN2d7YXPv","time":"2026-11-09 19:01","content":"Hehe"},{"senderName":"Ban Quản Trị HALMBOOK","sender":"ADMIN","avatar":"","time":"2026-11-11 02:47","content":"ê"},{"senderName":"Ban Quản Trị HALMBOOK","sender":"ADMIN","avatar":"","time":"2026-11-11 02:47","content":"có j ko"},{"senderName":"An Trần","sender":"USER","time":"2026-11-11 02:47","content":"không có j đâu"}]' 
WHERE ticket_id = 8;

UPDATE support_ticket 
SET chat_history = '[{"senderName":"Nguyen An","sender":"USER","time":"2026-11-09 19:19","content":"Toi can ho tro kiem tra giao dich nap khoai thoi gian thuc"},{"senderName":"Ban Quản Trị HALMBOOK","sender":"ADMIN","time":"2026-11-09 19:20","content":"Chao ban Nguyen An, Ban Quan Tri da kiem tra giao dich nap khoai cua ban va cong 50 khoai vao tai khoan thanh cong roi nhe!"},{"senderName":"Nguyen An","sender":"USER","time":"2026-11-09 19:20","content":"Da nhan duoc 50 khoai roi a, cam on Ban Quan Tri rat nhieu!"}]' 
WHERE ticket_id = 9;
