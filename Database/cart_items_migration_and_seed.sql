-- =============================================================================
-- MIGRATION & SEED DỮ LIỆU GIỎ HÀNG THẬT (HALMBOOK)
-- File: Database/cart_items_migration_and_seed.sql
-- =============================================================================

USE halmbook;

-- 1. Tạo bảng cart_items chuẩn theo đặc tả (kèm UNIQUE(user_id, book_id))
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    rental_days INT NOT NULL DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_book UNIQUE (user_id, book_id),
    CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Đồng bộ cột created_at, updated_at và ràng buộc UNIQUE(cart_id, book_id) cho bảng cart_item
ALTER TABLE cart_item
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3. Cập nhật giá thuê gốc (rent_price - đơn vị Khoai) và tóm tắt nội dung (description) cho sách thật
UPDATE book SET
    rent_price = 25,
    description = 'Kiệt tác châm biếm của Lỗ Tấn khắc họa hình tượng AQ với "phép thắng lợi tinh thần" đặc trưng trong bối cảnh xã hội Trung Hoa giao thời.'
WHERE book_id = 'KD001';

UPDATE book SET
    rent_price = 22,
    description = 'Bài diễn thuyết tâm huyết của nhà chí sĩ Phan Châu Trinh so sánh nền tảng đạo đức và luân lý phương Đông với phương Tây.'
WHERE book_id = 'LS001';

UPDATE book SET
    rent_price = 24,
    description = 'Tác phẩm lý luận cách mạng quan trọng của Nguyễn Ái Quốc tập hợp các bài giảng đào tạo cán bộ tại Quảng Châu (1925–1927).'
WHERE book_id = 'LS002';

UPDATE book SET
    rent_price = 20,
    description = 'Hồi ký cảm động viết trong ngục Quảng Đông của cụ Phan Bội Châu ghi lại chặng đường hoạt động cứu nước đầy gian truân.'
WHERE book_id = 'LS003';

UPDATE book SET
    rent_price = 22,
    description = 'Công trình biên khảo văn hóa kinh điển của Phan Kế Bính về phong tục tập quán trong gia đình, làng xã và xã hội Việt Nam.'
WHERE book_id = 'LS004';

UPDATE book SET
    rent_price = 18,
    description = 'Phóng sự sắc sảo của Vũ Trọng Phụng vạch trần những mánh khóe gian lận tinh vi trong giới cờ bạc bịp đầu thế kỷ XX.'
WHERE book_id = 'PS001';

UPDATE book SET
    rent_price = 18,
    description = 'Thiên phóng sự chân thực của Vũ Trọng Phụng về thân phận những người đi ở và giới môi giới người làm tại Hà Nội xưa.'
WHERE book_id = 'PS002';

UPDATE book SET
    rent_price = 20,
    description = 'Tập tùy bút trữ tình nổi tiếng của Thạch Lam tôn vinh vẻ đẹp văn hóa, ẩm thực và tâm hồn người Hà Nội ba mươi sáu phố phường.'
WHERE book_id = 'PS003';

UPDATE book SET
    rent_price = 20,
    description = 'Phóng sự nổi tiếng của Vũ Trọng Phụng phản ánh hiện thực bi hài của những cuộc hôn nhân thực dụng thời Pháp thuộc.'
WHERE book_id = 'PS004';

UPDATE book SET
    rent_price = 18,
    description = 'Phóng sự điều tra xã hội của Vũ Trọng Phụng ghi lại góc khuất đầy bi kịch nơi nhà lục xì Hà Nội.'
WHERE book_id = 'PS005';

UPDATE book SET
    rent_price = 16,
    description = 'Phóng sự nông thôn sắc bén của Ngô Tất Tố phơi bày những hủ tục nặng nề xoay quanh ngôi đình làng cổ truyền.'
WHERE book_id = 'PS006';

UPDATE book SET
    rent_price = 18,
    description = 'Tác phẩm phóng sự xuất sắc của Ngô Tất Tố khắc họa bức tranh sinh động nhưng đầy trăn trở về hủ tục làng xã Việt Nam.'
WHERE book_id = 'PS007';

UPDATE book SET
    rent_price = 18,
    description = 'Tiểu thuyết giàu tính nhân văn của Hồ Biểu Chánh ca ngợi tình phụ tử thiêng liêng và đạo lý nghĩa tình Nam Bộ.'
WHERE book_id = 'TT001';

UPDATE book SET
    rent_price = 18,
    description = 'Tiểu thuyết hiện thực Nam Bộ tiêu biểu của Hồ Biểu Chánh kể về nghị lực vươn lên và lòng tự trọng của những phận đời nghèo khó.'
WHERE book_id = 'TT002';

UPDATE book SET
    rent_price = 18,
    description = 'Tiểu thuyết tâm lý xã hội của Vũ Trọng Phụng xoay quanh bi kịch tình yêu và xung đột lễ giáo gia đình.'
WHERE book_id = 'TT003';

UPDATE book SET
    rent_price = 18,
    description = 'Tiểu thuyết hiện thực của Vũ Trọng Phụng phân tích sâu sắc nguyên nhân xã hội đẩy người phụ nữ vào cảnh ngộ éo le.'
WHERE book_id = 'TT004';

UPDATE book SET
    rent_price = 18,
    description = 'Tiểu thuyết của Vũ Trọng Phụng đặt ra câu hỏi lớn về tình yêu lãng mạn khi đối diện với thực tế hôn nhân và đồng tiền.'
WHERE book_id = 'TT005';

UPDATE book SET
    rent_price = 20,
    description = 'Tiểu thuyết lãng mạn nổi tiếng của Khái Hưng kể về mối tình thanh cao nhưng đầy trắc trở giữa Mai và Lộc.'
WHERE book_id = 'TT006';

UPDATE book SET
    rent_price = 20,
    description = 'Tiểu thuyết tâm lý mở đầu văn xuôi hiện đại Việt Nam của Hoàng Ngọc Phách về mối tình bi thương giữa Đạm Thủy và Tố Tâm.'
WHERE book_id = 'TT007';

UPDATE book SET
    rent_price = 20,
    description = 'Tuyệt tác văn học hiện thực phê phán của Nam Cao về bi kịch bị tha hóa và khát vọng lương thiện của người nông dân Chí Phèo.'
WHERE book_id = 'VH001';

UPDATE book SET
    rent_price = 22,
    description = 'Tiểu thuyết đồ sộ của Vũ Trọng Phụng dựng lại bức tranh xã hội đầy biến động xoay quanh nhân vật Nghị Hách.'
WHERE book_id = 'VH002';

UPDATE book SET
    rent_price = 20,
    description = 'Tiểu thuyết phóng sự của Ngô Tất Tố tái hiện sinh động cảnh thi cử khoa bảng cuối thời phong kiến.'
WHERE book_id = 'VH003';

UPDATE book SET
    rent_price = 25,
    description = 'Kiệt tác trào phúng bất hủ của Vũ Trọng Phụng xoay quanh cuộc đời Xuân Tóc Đỏ và sự lố lăng của xã hội "âu hóa" nửa mùa.'
WHERE book_id = 'VH004';

UPDATE book SET
    rent_price = 22,
    description = 'Tiểu thuyết tâm lý đặc sắc của Nam Cao khắc họa bi kịch tinh thần mòn mỏi của người trí thức nghèo Thứ.'
WHERE book_id = 'VH005';

UPDATE book SET
    rent_price = 20,
    description = 'Tiểu thuyết hiện thực xuất sắc của Ngô Tất Tố về nỗi thống khổ của gia đình chị Dậu trong mùa sưu thuế.'
WHERE book_id = 'VH006';

UPDATE book SET
    rent_price = 20,
    description = 'Tiểu thuyết trào phúng của Vũ Trọng Phụng về sự đổi đời đột ngột và những hệ lụy dở khóc dở cười của tấm vé số độc đắc.'
WHERE book_id = 'VH007';

UPDATE book SET
    rent_price = 20,
    description = 'Tiểu thuyết hiện thực của Vũ Trọng Phụng phản ánh cuộc sống cơ cực của người dân lao động trước thiên tai và bất công xã hội.'
WHERE book_id = 'VH008';

-- 4. Đảm bảo các sách còn lại nếu có rent_price <= 0 đều được gán mức cơ bản 20 Khoai
UPDATE book SET rent_price = 20 WHERE rent_price IS NULL OR rent_price <= 0;

-- 5. Seed dữ liệu mẫu vào giỏ hàng của khách hàng đầu tiên (nếu có customer trong DB)
INSERT IGNORE INTO cart (customer_id)
SELECT customer_id FROM customer LIMIT 1;

INSERT INTO cart_item (cart_id, book_id, plan_key, rental_days, selected_price)
SELECT c.cart_id, 'KD001', '7', 7, 25
FROM cart c
WHERE NOT EXISTS (
    SELECT 1 FROM cart_item ci WHERE ci.cart_id = c.cart_id AND ci.book_id = 'KD001'
)
LIMIT 1;

INSERT INTO cart_item (cart_id, book_id, plan_key, rental_days, selected_price)
SELECT c.cart_id, 'VH004', '14', 14, 45
FROM cart c
WHERE NOT EXISTS (
    SELECT 1 FROM cart_item ci WHERE ci.cart_id = c.cart_id AND ci.book_id = 'VH004'
)
LIMIT 1;

INSERT INTO cart_item (cart_id, book_id, plan_key, rental_days, selected_price)
SELECT c.cart_id, 'PS003', '30', 30, 70
FROM cart c
WHERE NOT EXISTS (
    SELECT 1 FROM cart_item ci WHERE ci.cart_id = c.cart_id AND ci.book_id = 'PS003'
)
LIMIT 1;
