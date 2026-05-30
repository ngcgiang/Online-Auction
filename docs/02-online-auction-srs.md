# SRS - Sàn đấu giá trực tuyến

## 1. Thông tin tài liệu

| Hạng mục | Giá trị |
| --- | --- |
| Tên sản phẩm | Sàn đấu giá trực tuyến |
| Loại tài liệu | Đặc tả yêu cầu phần mềm |
| Phiên bản | 1.0 |
| Trạng thái | Bản chính |
| Người phụ trách | Business Analyst |
| Ngày lập | 2026-05-29 |

## 2. Giới thiệu

### 2.1 Mục đích

Tài liệu này mô tả đầy đủ các yêu cầu phần mềm của hệ thống sàn đấu giá trực tuyến. Nội dung bao gồm phạm vi hệ thống, định nghĩa thuật ngữ, yêu cầu chức năng, quy tắc nghiệp vụ, yêu cầu phi chức năng, giao diện tích hợp và yêu cầu dữ liệu.

### 2.2 Phạm vi

Hệ thống cho phép guest xem và tìm kiếm sản phẩm, bidder tham gia đấu giá bằng giá tối đa, seller quản lý sản phẩm và câu hỏi, administrator quản lý dữ liệu và thống kê. Hệ thống hỗ trợ đấu giá tự động theo nguyên tắc giá tối đa và giá hiển thị vừa đủ để thắng.

### 2.3 Thuật ngữ

| Thuật ngữ | Diễn giải |
| --- | --- |
| Guest | Người dùng chưa đăng nhập |
| Bidder | Người tham gia đấu giá |
| Seller | Người bán sản phẩm |
| Winner | Người đang giữ vị trí dẫn đầu khi phiên đấu giá kết thúc |
| Watch list | Danh sách sản phẩm yêu thích |
| Bid tối đa | Mức giá cao nhất bidder sẵn sàng trả |
| Giá hiển thị | Mức giá hệ thống đang hiển thị trên sản phẩm |
| Proxy bidding | Cơ chế đấu giá tự động dựa trên giá tối đa |

## 3. Mô tả tổng quan

### 3.1 Góc nhìn sản phẩm

Hệ thống là web app CSR, frontend là SPA và backend là RESTful API. Các thành phần phụ trợ gồm: xác thực, email, realtime, thanh toán, cron job, logging và monitoring.

### 3.2 Nhóm người dùng

- Guest: xem category, xem danh sách và xem chi tiết sản phẩm.
- Bidder: đặt giá tối đa, lưu watch list, hỏi đáp, theo dõi trạng thái đấu giá và giao dịch.
- Seller: đăng sản phẩm, trả lời câu hỏi, từ chối bidder, quản lý giao dịch sau đấu giá.
- Administrator: quản lý category, user, product, yêu cầu nâng cấp và dashboard.

### 3.3 Môi trường vận hành

- Truy cập qua trình duyệt web.
- Có dịch vụ gửi email cho OTP và thông báo.
- Có dịch vụ thanh toán để mô phỏng hoặc tích hợp quy trình hoàn tất đơn hàng.
- Có logging và monitoring để theo dõi hoạt động hệ thống.

## 4. Yêu cầu chức năng

### 4.1 Quản lý tài khoản và xác thực

- FR-01: Người dùng có thể đăng ký bằng họ tên, địa chỉ, email, mật khẩu và xác thực OTP.
- FR-02: Email đăng ký phải duy nhất.
- FR-03: Người dùng có thể đăng nhập bằng tài khoản đã xác thực.
- FR-04: Người dùng có thể quên mật khẩu và đặt lại mật khẩu qua OTP.
- FR-05: Người dùng có thể thay đổi hồ sơ cá nhân, email liên lạc, ngày sinh và mật khẩu.
- FR-06: Người dùng khi đổi mật khẩu phải nhập mật khẩu cũ.

### 4.2 Danh mục và tìm kiếm

- FR-07: Guest có thể xem menu category hai cấp.
- FR-08: Guest có thể xem danh sách sản phẩm theo category với phân trang.
- FR-09: Guest có thể tìm kiếm theo tên sản phẩm, category hoặc kết hợp cả hai.
- FR-10: Tìm kiếm phải hỗ trợ tiếng Việt không dấu.
- FR-11: Người dùng có thể sắp xếp kết quả theo thời gian kết thúc giảm dần hoặc giá tăng dần.
- FR-12: Sản phẩm mới đăng trong một khoảng thời gian ngắn phải được làm nổi bật trên giao diện.

### 4.3 Xem sản phẩm

- FR-13: Người dùng có thể xem danh sách sản phẩm với ảnh đại diện, tên, giá hiện tại, bidder đang dẫn đầu, giá mua ngay nếu có, ngày đăng, thời gian còn lại và số lượt bid.
- FR-14: Người dùng có thể xem chi tiết sản phẩm với ảnh lớn, tối thiểu 3 ảnh phụ, mô tả đầy đủ và thông tin seller.
- FR-15: Người dùng có thể xem thông tin bidder đang giữ vị trí dẫn đầu và điểm đánh giá của người này.
- FR-16: Người dùng có thể xem thông tin seller và điểm đánh giá của seller.
- FR-17: Người dùng có thể xem 5 sản phẩm cùng chuyên mục.
- FR-18: Khi thời điểm kết thúc còn dưới 3 ngày, hệ thống hiển thị thời gian còn lại theo dạng tương đối.

### 4.4 Danh sách yêu thích

- FR-19: Bidder có thể thêm hoặc bỏ sản phẩm khỏi watch list ngay tại danh sách hoặc trang chi tiết.
- FR-20: Bidder có thể xem toàn bộ danh sách watch list của mình.

### 4.5 Đấu giá

- FR-21: Bidder có thể nhập giá tối đa cho một sản phẩm đang đấu giá.
- FR-22: Hệ thống chỉ hiển thị giá hiện tại vừa đủ để thắng, không hiển thị toàn bộ giá tối đa của bidder.
- FR-23: Hệ thống phải tính giá hiển thị theo bước giá do seller thiết lập.
- FR-24: Hệ thống phải xác định người dẫn đầu dựa trên giá tối đa cao nhất.
- FR-25: Khi một bidder khác nhập giá tối đa cao hơn giá tối đa hiện tại, hệ thống chuyển quyền dẫn đầu sang bidder mới.
- FR-26: Nếu hai bidder có cùng giá tối đa, người nhập trước giữ quyền dẫn đầu.
- FR-27: Hệ thống lưu lịch sử đấu giá và che một phần tên người dùng trong lịch sử hiển thị.
- FR-28: Bidder chỉ được phép đấu giá khi đạt điều kiện rating hoặc khi seller cho phép bidder chưa từng được đánh giá tham gia.
- FR-29: Seller có thể từ chối một bidder đối với sản phẩm cụ thể.
- FR-30: Khi bid mới phát sinh gần thời điểm kết thúc, hệ thống tự động gia hạn theo tham số cấu hình của quản trị viên.

### 4.6 Hỏi đáp sản phẩm

- FR-31: Bidder có thể gửi câu hỏi cho seller ngay tại màn hình chi tiết sản phẩm.
- FR-32: Seller có thể trả lời câu hỏi.
- FR-33: Hệ thống gửi email thông báo cho seller khi có câu hỏi mới.
- FR-34: Hệ thống gửi email cho các bidder liên quan khi seller trả lời.

### 4.7 Hoàn tất đơn hàng

- FR-35: Sau khi phiên đấu giá kết thúc, seller và winner được chuyển sang luồng hoàn tất đơn hàng.
- FR-36: Hệ thống hỗ trợ thanh toán, gửi địa chỉ giao hàng, xác nhận nhận tiền, gửi hóa đơn vận chuyển và xác nhận nhận hàng.
- FR-37: Seller có thể hủy giao dịch trong quá trình hoàn tất đơn hàng.
- FR-38: Khi seller hủy giao dịch, hệ thống tự động ghi nhận đánh giá -1 cho winner và lưu lý do.
- FR-39: Winner và seller có thể đánh giá chất lượng giao dịch bằng điểm +/- và nhận xét ngắn.
- FR-40: Người bán và người mua được phép thay đổi kết quả đánh giá của mình trong giới hạn nghiệp vụ cho phép.

### 4.8 Quản trị

- FR-41: Administrator có thể xem, thêm, sửa, xoá category.
- FR-42: Administrator không được xoá category đã có sản phẩm.
- FR-43: Administrator có thể gỡ bỏ sản phẩm vi phạm.
- FR-44: Administrator có thể xem danh sách bidder xin nâng cấp thành seller.
- FR-45: Administrator có thể duyệt yêu cầu nâng cấp bidder thành seller.
- FR-46: Administrator có thể xem dashboard với các biểu đồ và thống kê kinh doanh.

## 5. Quy tắc nghiệp vụ

- BR-01: Email phải duy nhất trong toàn hệ thống.
- BR-02: Mật khẩu phải được băm bằng bcrypt hoặc scrypt.
- BR-03: Người dùng chỉ được tham gia đấu giá nếu đã đăng nhập.
- BR-04: Bidder phải đạt ngưỡng rating hoặc phải có sự cho phép từ seller mới được bid.
- BR-05: Bid phải phù hợp với bước giá do seller thiết lập.
- BR-06: Hệ thống chỉ áp dụng một cơ chế đấu giá duy nhất là đấu giá tự động.
- BR-07: Giá hiển thị luôn là mức giá đủ để thắng, không phải giá tối đa của người dùng.
- BR-08: Cùng mức giá tối đa thì người nhập trước được ưu tiên.
- BR-09: Khi bị seller từ chối, bidder không thể tiếp tục đấu giá sản phẩm đó.
- BR-10: Khi sản phẩm kết thúc, chỉ seller và winner được dẫn sang luồng hoàn tất đơn hàng.
- BR-11: Khi gần hết thời gian mà có bid mới, hệ thống có thể tự động gia hạn theo tham số cấu hình.
- BR-12: Nếu seller hủy giao dịch, hệ thống phải ghi nhận điều kiện nghiệp vụ đánh giá -1 cho winner.

## 6. Yêu cầu phi chức năng

### 6.1 Hiệu năng

- NFR-01: Trang danh sách và trang chi tiết phải có phản hồi tốt với dữ liệu lớn.
- NFR-02: Thao tác đặt giá phải đảm bảo xử lý nhất quán, tránh ghi đè dữ liệu.
- NFR-03: Hệ thống phải chịu được nhiều lượt truy cập đồng thời trong giờ cao điểm.

### 6.2 Bảo mật

- NFR-04: Hệ thống sử dụng JWT access token và refresh token.
- NFR-05: Endpoint quan trọng phải có validation đầy đủ.
- NFR-06: Dữ liệu nhạy cảm không được ghi lộ trong log.
- NFR-07: OTP và token phải có thời hạn sử dụng rõ ràng.

### 6.3 Độ tin cậy

- NFR-08: Email, realtime và payment phải có cơ chế xử lý lỗi và retry phù hợp.
- NFR-09: Hệ thống phải đảm bảo không mất lịch sử đấu giá.

### 6.4 Bảo trì

- NFR-10: Hệ thống phải có swagger documentation.
- NFR-11: Hệ thống phải có logging và monitoring.
- NFR-12: Quy tắc kinh doanh phải được cấu hình rõ để dễ điều chỉnh.

## 7. Giao diện tích hợp

- EIR-01: REST API cho frontend SPA.
- EIR-02: Dịch vụ email dùng cho OTP, thông báo bid và thông báo hoàn tất giao dịch.
- EIR-03: Dịch vụ thanh toán dùng cho bước thanh toán sau khi kết thúc đấu giá.
- EIR-04: Kênh realtime dùng cho cập nhật giá, chat và thông báo.

## 8. Yêu cầu dữ liệu

- DR-01: Dữ liệu khởi tạo phải có tối thiểu 20 sản phẩm.
- DR-02: Dữ liệu phải trải đều trên 4 đến 5 category.
- DR-03: Mỗi sản phẩm phải có ít nhất 3 ảnh.
- DR-04: Mỗi sản phẩm cần có ít nhất 5 lượt đặt giá lịch sử.
- DR-05: Dữ liệu người dùng, bid, rating, order, message và question-answer phải được lưu trữ nhất quán.

## 9. Tiêu chí chấp nhận ở cấp hệ thống

- AC-01: Người dùng đăng ký được tài khoản và xác thực OTP thành công.
- AC-02: Guest tìm kiếm được sản phẩm tiếng Việt không dấu.
- AC-03: Bidder nhập giá tối đa và hệ thống hiển thị giá vừa đủ để thắng.
- AC-04: Khi có giá tối đa cao hơn, hệ thống chuyển người dẫn đầu đúng quy tắc.
- AC-05: Seller và winner được chuyển sang quy trình hoàn tất đơn hàng sau khi đấu giá kết thúc.
- AC-06: Administrator quản lý được category, sản phẩm, người dùng và dashboard.

## 10. Ánh xạ yêu cầu

Mỗi yêu cầu FR, BR và AC trong tài liệu này phải được ánh xạ sang ít nhất một user story, một use case và một test case để bảo đảm khả năng truy vết.
