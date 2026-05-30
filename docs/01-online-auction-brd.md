# BRD - Sàn đấu giá trực tuyến

## 1. Thông tin tài liệu

| Hạng mục | Giá trị |
| --- | --- |
| Tên sản phẩm | Sàn đấu giá trực tuyến |
| Loại tài liệu | Tài liệu yêu cầu nghiệp vụ |
| Phiên bản | 1.0 |
| Trạng thái | Bản nháp |
| Người phụ trách | Business Analyst |
| Ngày lập | 2026-05-29 |

## 2. Mục đích

Tài liệu này mô tả lý do kinh doanh, mục tiêu, phạm vi, các bên liên quan và các quy tắc nghiệp vụ cấp cao của hệ thống sàn đấu giá trực tuyến. Đây là tài liệu nền để thống nhất cách hiểu giữa người học, người phát triển, người kiểm thử và người đánh giá đồ án.

## 3. Bối cảnh kinh doanh

### 3.1 Vấn đề hiện tại

- Quy trình mua bán theo kiểu đấu giá chưa được số hóa hoàn chỉnh, khó theo dõi và thiếu minh bạch.
- Người mua khó biết trạng thái hiện tại của sản phẩm, ai đang dẫn đầu và lịch sử các lượt đặt giá.
- Người bán phải xử lý thủ công nhiều hoạt động như trả lời câu hỏi, theo dõi giao dịch và phản hồi sau đấu giá.
- Quản trị viên khó kiểm soát dữ liệu danh mục, sản phẩm, người dùng và các yêu cầu nâng cấp tài khoản nếu không có một hệ thống tập trung.

### 3.2 Cơ hội kinh doanh

- Tự động hóa toàn bộ vòng đời đấu giá, từ đăng sản phẩm đến hoàn tất giao dịch.
- Tăng sự minh bạch giữa bidder và seller thông qua lịch sử bid, thông báo và quy tắc rõ ràng.
- Hỗ trợ quy trình sau đấu giá như thanh toán, gửi địa chỉ, xác nhận giao hàng và đánh giá giao dịch.
- Tạo nền tảng có thể mở rộng cho nhiều danh mục sản phẩm và nhiều nhóm người dùng.

## 4. Mục tiêu kinh doanh

- Cho phép guest dễ dàng tìm kiếm, xem danh mục và xem chi tiết sản phẩm.
- Cho phép bidder tham gia đấu giá, lưu danh sách yêu thích, đặt câu hỏi và theo dõi sản phẩm đang quan tâm.
- Cho phép seller đăng sản phẩm, trả lời câu hỏi, xử lý người thắng và đánh giá sau giao dịch.
- Cho phép administrator quản lý category, sản phẩm, người dùng, yêu cầu nâng cấp và dashboard thống kê.
- Chuẩn hóa quy trình đấu giá tự động theo mô hình người dùng nhập giá tối đa, hệ thống chỉ hiển thị giá vừa đủ để thắng.

## 5. Mô hình đấu giá được chọn

Hệ thống áp dụng **đấu giá tự động**.

### 5.1 Nguyên tắc nghiệp vụ

- Người dùng không nhập giá hiển thị cuối cùng ngay từ đầu, mà nhập **giá tối đa** sẵn sàng trả cho sản phẩm.
- Giao diện chỉ hiển thị **giá hiện tại đủ để thắng**, không hiển thị toàn bộ giá tối đa của người giữ giá.
- Khi có bidder khác đặt giá tối đa cao hơn giá tối đa của người đang giữ, hệ thống chuyển người dẫn đầu sang bidder mới.
- Nếu hai bidder có cùng mức giá tối đa, người nhập trước sẽ được ưu tiên giữ quyền dẫn đầu.
- Giá hiển thị trên sản phẩm luôn là mức giá vừa đủ để thắng theo bước giá do seller quy định, nhưng không vượt quá giá tối đa của người đang thắng.

### 5.2 Tác động đến trải nghiệm người dùng

- Bidder không cần thao tác liên tục để giữ vị trí dẫn đầu.
- Người xem vẫn thấy giá cạnh tranh thực tế nhưng không biết toàn bộ chiến lược đặt giá tối đa của từng người.
- Hệ thống giúp phiên đấu giá công bằng, giảm tranh chấp và giảm thao tác thủ công.

## 6. Các bên liên quan

| Bên liên quan | Vai trò | Nhu cầu chính |
| --- | --- | --- |
| Guest | Người xem chưa đăng nhập | Xem sản phẩm, tìm kiếm nhanh, xem chi tiết rõ ràng |
| Bidder | Người tham gia đấu giá | Đặt giá tối đa, theo dõi trạng thái, hỏi đáp, quản lý hồ sơ |
| Seller | Người đăng bán | Đăng sản phẩm, phản hồi câu hỏi, xử lý giao dịch, đánh giá người thắng |
| Administrator | Người quản trị | Kiểm duyệt, quản lý dữ liệu, thống kê, duyệt nâng cấp tài khoản |
| Hệ thống | Dịch vụ tự động | Gửi email, tính toán đấu giá, lưu lịch sử, nhắc việc, monitoring |

## 7. Phạm vi

### 7.1 Phạm vi bao gồm

- Đăng ký, đăng nhập, quên mật khẩu, đổi mật khẩu.
- Xem danh mục, xem danh sách sản phẩm và tìm kiếm sản phẩm.
- Xem chi tiết sản phẩm, ảnh, thông tin seller, thông tin bidder đang dẫn đầu và lịch sử đấu giá.
- Lưu sản phẩm yêu thích, đặt câu hỏi, trả lời câu hỏi.
- Đấu giá tự động bằng giá tối đa, từ chối bidder, tự động gia hạn khi gần hết thời gian.
- Quy trình hoàn tất đơn hàng sau khi phiên đấu giá kết thúc.
- Quản trị category, user, product, seller upgrade và dashboard thống kê.

### 7.2 Phạm vi không bao gồm

- Ứng dụng mobile native.
- Mạng xã hội, livestream, chat cộng đồng ngoài phạm vi hoàn tất giao dịch.
- Nhiều mô hình đấu giá cùng lúc trên một hệ thống.
- Tích hợp quá nhiều cổng thanh toán thương mại ngoài phạm vi đồ án.

## 8. Các chỉ số thành công

- Tỷ lệ sản phẩm có ít nhất 5 lượt đấu giá.
- Tỷ lệ người dùng hoàn thành thanh toán sau khi thắng đấu giá.
- Tỷ lệ sản phẩm có đầy đủ ảnh, mô tả và dữ liệu lịch sử.
- Số lượng câu hỏi và câu trả lời trên mỗi sản phẩm.
- Tỷ lệ yêu cầu nâng cấp bidder lên seller được duyệt thành công.

## 9. Giả định

- Người dùng có email hoạt động để nhận OTP và thông báo.
- Hệ thống có dịch vụ lưu ảnh, gửi email và lưu trữ dữ liệu ổn định.
- Dữ liệu ban đầu có ít nhất 20 sản phẩm thuộc 4 đến 5 category.
- Chọn một cơ chế đấu giá duy nhất là đấu giá tự động.

## 10. Ràng buộc

- Email đăng ký không được trùng.
- Mật khẩu phải được băm bằng bcrypt hoặc scrypt.
- Chỉ bidder đạt điều kiện rating mới được tham gia đấu giá, trừ khi seller cho phép.
- Người bị seller từ chối sẽ không được đặt giá vào sản phẩm đó.
- Khi sản phẩm kết thúc, seller và người thắng bước sang luồng hoàn tất đơn hàng.

## 11. Rủi ro kinh doanh

- Người dùng không hiểu đúng cơ chế giá tối đa nếu giao diện giải thích chưa rõ.
- Email thông báo hoặc OTP có thể bị chậm khiến người dùng gián đoạn trải nghiệm.
- Nếu không kiểm soát transaction tốt, dữ liệu đấu giá có thể không nhất quán.
- Quy trình thanh toán sau đấu giá có thể kéo dài do người dùng không phản hồi đúng hạn.

## 12. Yêu cầu kinh doanh cấp cao

### 12.1 Chức năng

- BR-01: Người dùng có thể tạo tài khoản bằng email duy nhất và xác thực OTP.
- BR-02: Guest có thể xem category, tìm kiếm và xem danh sách sản phẩm.
- BR-03: Bidder có thể nhập giá tối đa và theo dõi giá hiển thị hiện tại.
- BR-04: Seller có thể quản lý sản phẩm, câu hỏi và giao dịch.
- BR-05: Hệ thống tự động gửi email khi xảy ra các sự kiện quan trọng.
- BR-06: Administrator có thể quản lý toàn bộ dữ liệu và thống kê vận hành.

### 12.2 Phi chức năng

- BR-NF-01: Hệ thống phải có phản hồi tốt cho thao tác xem và tìm kiếm.
- BR-NF-02: Các thao tác đấu giá phải đảm bảo tính nhất quán và công bằng.
- BR-NF-03: Hệ thống phải có logging, monitoring và swagger documentation.
- BR-NF-04: Dữ liệu nhạy cảm phải được bảo vệ bằng cơ chế xác thực an toàn.

## 13. Các câu hỏi còn mở

- Cổng thanh toán chính thức sẽ được chọn là gì?
- Có chốt ngưỡng rating cụ thể là 80 phần trăm hay cần cấu hình theo hệ thống?
- Có cần cho phép seller bật hoặc tắt quyền bid với người chưa từng được đánh giá hay không?
- Dashboard nên thể hiện thống kê theo ngày, tuần, tháng hay cả ba mức?
