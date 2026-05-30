# Use Case Specification - Sàn đấu giá trực tuyến

## 1. Thông tin tài liệu

| Hạng mục | Giá trị |
| --- | --- |
| Tên sản phẩm | Sàn đấu giá trực tuyến |
| Loại tài liệu | Đặc tả trường hợp sử dụng |
| Phiên bản | 1.0 |
| Trạng thái | Bản chính |
| Người phụ trách | Business Analyst |
| Ngày lập | 2026-05-29 |

## 2. Danh sách trường hợp sử dụng

| Mã UC | Tên trường hợp sử dụng | Diễn viên chính |
| --- | --- | --- |
| UC-01 | Đăng ký tài khoản | Guest |
| UC-02 | Đăng nhập | Người dùng đã có tài khoản |
| UC-03 | Tìm kiếm sản phẩm | Guest |
| UC-04 | Xem danh sách sản phẩm | Guest |
| UC-05 | Xem chi tiết sản phẩm | Guest |
| UC-06 | Thêm sản phẩm vào watch list | Bidder |
| UC-07 | Đặt giá tối đa | Bidder |
| UC-08 | Xem lịch sử đấu giá | Bidder |
| UC-09 | Hỏi người bán về sản phẩm | Bidder |
| UC-10 | Trả lời câu hỏi sản phẩm | Seller |
| UC-11 | Từ chối bidder | Seller |
| UC-12 | Yêu cầu nâng cấp thành seller | Bidder |
| UC-13 | Duyệt nâng cấp thành seller | Administrator |
| UC-14 | Hoàn tất đơn hàng sau đấu giá | Winner và Seller |
| UC-15 | Đánh giá giao dịch | Winner và Seller |
| UC-16 | Quản lý category | Administrator |
| UC-17 | Quản lý sản phẩm | Administrator |

## 3. Mẫu chung cho một trường hợp sử dụng

### Mã trường hợp sử dụng

### Tên trường hợp sử dụng

### Mục tiêu

### Diễn viên chính

### Diễn viên phụ

### Kích hoạt

### Tiền điều kiện

### Hậu điều kiện

### Luồng chính

### Luồng thay thế

### Luồng ngoại lệ

### Quy tắc nghiệp vụ

### Màn hình liên quan

### API liên quan

## 4. Đặc tả chi tiết các trường hợp sử dụng

### UC-01 Đăng ký tài khoản

Mục tiêu: Tạo tài khoản mới cho người dùng để có thể tham gia các chức năng của hệ thống.

Diễn viên chính: Guest

Diễn viên phụ: Hệ thống email, hệ thống xác thực OTP

Kích hoạt: Guest chọn chức năng đăng ký tài khoản.

Tiền điều kiện:

- Guest chưa có tài khoản với email đã nhập.
- Hệ thống gửi được email OTP.

Hậu điều kiện:

- Tài khoản mới được tạo.
- Email được xác thực thành công.

Luồng chính:

1. Guest mở màn hình đăng ký.
2. Nhập họ tên, địa chỉ, email và mật khẩu.
3. Hệ thống kiểm tra định dạng và sự duy nhất của email.
4. Hệ thống gửi OTP tới email đã đăng ký.
5. Guest nhập OTP.
6. Hệ thống kiểm tra OTP hợp lệ.
7. Hệ thống tạo tài khoản và chuyển người dùng sang màn hình đăng nhập.

Luồng thay thế:

- A1: Email đã tồn tại thì hệ thống thông báo và không cho tạo tài khoản.
- A2: OTP hết hạn thì người dùng được yêu cầu gửi lại OTP.

Luồng ngoại lệ:

- E1: Email gửi không thành công.
- E2: OTP không đúng.

Quy tắc nghiệp vụ:

- Email phải duy nhất.
- Mật khẩu phải được băm trước khi lưu.

### UC-07 Đặt giá tối đa

Mục tiêu: Bidder nhập giá tối đa cho sản phẩm và hệ thống tự tính giá hiển thị hiện tại.

Diễn viên chính: Bidder

Diễn viên phụ: Seller, Notification Service, Realtime Service

Kích hoạt: Bidder chọn đặt giá tại trang chi tiết sản phẩm.

Tiền điều kiện:

- Bidder đã đăng nhập.
- Sản phẩm đang ở trạng thái đang đấu giá.
- Bidder không bị seller từ chối.
- Bidder đạt điều kiện rating hoặc seller cho phép.

Hậu điều kiện:

- Giá tối đa của bidder được lưu.
- Giá hiển thị hiện tại được cập nhật.
- Hệ thống xác định người đang dẫn đầu.

Luồng chính:

1. Bidder mở trang chi tiết sản phẩm.
2. Hệ thống hiển thị giá hiện tại đủ để thắng, bước giá và thông tin ngưỡng đấu giá.
3. Bidder nhập giá tối đa và xác nhận.
4. Hệ thống kiểm tra điều kiện đấu giá.
5. Hệ thống so sánh giá tối đa mới với giá tối đa của người đang dẫn đầu.
6. Hệ thống tính lại giá hiển thị theo bước giá.
7. Hệ thống lưu lịch sử bid, cập nhật người dẫn đầu và gửi thông báo.

Luồng thay thế:

- A1: Giá tối đa mới thấp hơn hoặc bằng giá hiển thị hiện tại thì hệ thống vẫn lưu nhưng không đổi người dẫn đầu.
- A2: Giá tối đa mới cao hơn giá tối đa hiện tại thì hệ thống chuyển người dẫn đầu sang bidder mới.
- A3: Hai giá tối đa bằng nhau thì bidder nhập trước giữ quyền dẫn đầu.

Luồng ngoại lệ:

- E1: Giá nhập nhỏ hơn giá tối thiểu hợp lệ.
- E2: Sản phẩm đã kết thúc.
- E3: Bidder bị từ chối.

Quy tắc nghiệp vụ:

- Giá hiển thị là mức giá vừa đủ để thắng, không phải giá tối đa.
- Chỉ một bidder là người dẫn đầu tại một thời điểm.
- Cùng giá tối đa thì người nhập trước thắng.

### UC-08 Xem lịch sử đấu giá

Mục tiêu: Bidder xem các lượt đấu giá trước đó với thông tin người bid được che một phần.

Luồng chính:

1. Bidder mở lịch sử đấu giá.
2. Hệ thống hiển thị thời điểm, người mua đã được mask và giá.
3. Bidder có thể lọc theo thời gian nếu cần.

### UC-09 Hỏi người bán về sản phẩm

Mục tiêu: Bidder gửi câu hỏi đến seller để làm rõ thông tin sản phẩm.

Luồng chính:

1. Bidder nhập câu hỏi tại trang chi tiết sản phẩm.
2. Hệ thống lưu câu hỏi.
3. Hệ thống gửi email thông báo đến seller.

### UC-10 Trả lời câu hỏi sản phẩm

Mục tiêu: Seller trả lời câu hỏi của người tham gia đấu giá.

Luồng chính:

1. Seller mở trang chi tiết sản phẩm hoặc khu vực quản lý câu hỏi.
2. Seller nhập câu trả lời.
3. Hệ thống lưu câu trả lời.
4. Hệ thống gửi email tới những người liên quan.

### UC-11 Từ chối bidder

Mục tiêu: Seller từ chối quyền đấu giá của một bidder cụ thể trên sản phẩm.

Luồng chính:

1. Seller chọn bidder cần từ chối.
2. Hệ thống lưu trạng thái từ chối.
3. Nếu bidder đang dẫn đầu, hệ thống chuyển quyền dẫn đầu sang bidder có mức giá tối đa kế tiếp.
4. Hệ thống gửi thông báo cho bidder bị từ chối.

### UC-13 Duyệt nâng cấp thành seller

Mục tiêu: Administrator duyệt yêu cầu nâng cấp của bidder.

Luồng chính:

1. Administrator xem danh sách yêu cầu chờ duyệt.
2. Administrator duyệt yêu cầu.
3. Hệ thống cập nhật role của người dùng thành seller.
4. Hệ thống gửi thông báo kết quả.

### UC-14 Hoàn tất đơn hàng sau đấu giá

Mục tiêu: Winner và seller hoàn tất giao dịch sau khi đấu giá kết thúc.

Luồng chính:

1. Winner mở trang chi tiết sản phẩm sau khi đấu giá kết thúc.
2. Hệ thống chuyển sang luồng hoàn tất đơn hàng.
3. Winner thanh toán.
4. Winner gửi địa chỉ giao hàng.
5. Seller xác nhận đã nhận tiền và gửi thông tin vận chuyển.
6. Winner xác nhận đã nhận hàng.
7. Hai bên đánh giá giao dịch.

Luồng ngoại lệ:

- E1: Winner không thanh toán đúng thời hạn.
- E2: Seller hủy giao dịch.
- E3: Thanh toán thất bại.

Quy tắc nghiệp vụ:

- Khi seller hủy giao dịch, hệ thống tự động ghi nhận đánh giá -1 cho winner.
- Người bán và người mua được phép thay đổi đánh giá trong giới hạn nghiệp vụ cho phép.
