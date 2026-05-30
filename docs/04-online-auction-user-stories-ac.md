# User Stories + Acceptance Criteria - Sàn đấu giá trực tuyến

## 1. Thông tin tài liệu

| Hạng mục | Giá trị |
| --- | --- |
| Tên sản phẩm | Sàn đấu giá trực tuyến |
| Loại tài liệu | User Stories và Acceptance Criteria |
| Phiên bản | 1.0 |
| Trạng thái | Bản chính |
| Người phụ trách | Business Analyst |
| Ngày lập | 2026-05-29 |

## 2. Danh mục Epic

- Epic 01: Tài khoản và xác thực
- Epic 02: Xem và tìm kiếm sản phẩm
- Epic 03: Đấu giá và watch list
- Epic 04: Hỏi đáp sản phẩm
- Epic 05: Quản lý của seller
- Epic 06: Hoàn tất giao dịch sau đấu giá
- Epic 07: Quản trị hệ thống

## 3. Mẫu user story

| Trường | Nội dung |
| --- | --- |
| Mã story | Mã định danh duy nhất |
| Epic | Nhóm nghiệp vụ liên quan |
| Vai trò | Người dùng thực hiện |
| Câu chuyện | As a... I want... so that... |
| Mức ưu tiên | Cao / Trung bình / Thấp |
| Acceptance Criteria | Điều kiện chấp nhận theo Given / When / Then |
| Ghi chú | Quy tắc nghiệp vụ hoặc phụ thuộc |

## 4. Danh sách user story chi tiết

### US-01 Đăng ký tài khoản bằng email đã xác thực

Vai trò: Guest

Câu chuyện: Là một guest, tôi muốn đăng ký tài khoản bằng email đã xác thực để có thể tham gia đấu giá.

Ưu tiên: Cao

Acceptance Criteria:

- Given tôi đang ở màn hình đăng ký
- When tôi nhập họ tên, địa chỉ, email duy nhất và mật khẩu hợp lệ
- Then hệ thống gửi OTP tới email
- And tài khoản chỉ được tạo sau khi OTP được xác thực thành công

### US-02 Đăng nhập an toàn

Vai trò: Người dùng đã có tài khoản

Câu chuyện: Là một người dùng đã có tài khoản, tôi muốn đăng nhập an toàn để truy cập các chức năng theo vai trò.

Acceptance Criteria:

- Given tài khoản của tôi đang hoạt động
- When tôi nhập đúng thông tin đăng nhập
- Then hệ thống xác thực thành công và chuyển tôi đến màn hình phù hợp với vai trò

### US-03 Tìm kiếm sản phẩm theo từ khóa và category

Vai trò: Guest

Câu chuyện: Là một guest, tôi muốn tìm kiếm sản phẩm theo từ khóa và category để tìm đúng sản phẩm mình quan tâm.

Acceptance Criteria:

- Given tôi đang ở màn hình tìm kiếm
- When tôi nhập từ khóa tiếng Việt không dấu hoặc chọn category
- Then hệ thống trả về danh sách sản phẩm phù hợp có phân trang

### US-04 Xem danh sách sản phẩm

Vai trò: Guest

Câu chuyện: Là một guest, tôi muốn xem danh sách sản phẩm theo category để dễ so sánh các phiên đấu giá.

Acceptance Criteria:

- Given tôi đang ở trang danh sách sản phẩm
- When tôi chọn một category
- Then hệ thống hiển thị sản phẩm thuộc category đó kèm ảnh đại diện, giá hiện tại và thời gian còn lại

### US-05 Xem chi tiết sản phẩm

Vai trò: Guest

Câu chuyện: Là một guest, tôi muốn xem chi tiết sản phẩm để hiểu rõ trước khi quyết định tham gia đấu giá.

Acceptance Criteria:

- Given tôi đang ở trang chi tiết sản phẩm
- When tôi mở sản phẩm bất kỳ
- Then hệ thống hiển thị đầy đủ ảnh, mô tả, seller, bidder dẫn đầu, lịch sử hỏi đáp và sản phẩm cùng chuyên mục

### US-06 Thêm sản phẩm vào watch list

Vai trò: Bidder

Câu chuyện: Là một bidder, tôi muốn thêm sản phẩm vào watch list để theo dõi những sản phẩm quan tâm.

Acceptance Criteria:

- Given tôi đã đăng nhập
- When tôi nhấn thêm vào watch list từ danh sách hoặc trang chi tiết sản phẩm
- Then sản phẩm được lưu vào danh sách yêu thích của tôi

### US-07 Đặt giá tối đa cho sản phẩm

Vai trò: Bidder

Câu chuyện: Là một bidder, tôi muốn nhập giá tối đa có thể chi trả cho sản phẩm để hệ thống tự đấu giá thay tôi.

Acceptance Criteria:

- Given sản phẩm đang trong trạng thái đấu giá
- When tôi nhập giá tối đa hợp lệ và xác nhận
- Then hệ thống lưu giá tối đa của tôi
- And hệ thống chỉ hiển thị giá hiện tại vừa đủ để thắng
- And nếu giá tối đa của tôi cao hơn người đang dẫn đầu thì tôi trở thành người dẫn đầu mới

### US-08 Xem lịch sử đấu giá

Vai trò: Bidder

Câu chuyện: Là một bidder, tôi muốn xem lịch sử đấu giá để biết diễn biến cạnh tranh của sản phẩm.

Acceptance Criteria:

- Given tôi đang xem chi tiết sản phẩm
- When tôi mở lịch sử đấu giá
- Then hệ thống hiển thị thời điểm, tên người mua đã được che một phần và giá bid

### US-09 Hỏi người bán về sản phẩm

Vai trò: Bidder

Câu chuyện: Là một bidder, tôi muốn hỏi seller về sản phẩm để làm rõ thông tin trước khi đặt giá.

Acceptance Criteria:

- Given tôi đang ở màn hình chi tiết sản phẩm
- When tôi gửi một câu hỏi hợp lệ
- Then câu hỏi được lưu và seller nhận được email thông báo

### US-10 Trả lời câu hỏi của bidder

Vai trò: Seller

Câu chuyện: Là một seller, tôi muốn trả lời câu hỏi để hỗ trợ người mua tiềm năng.

Acceptance Criteria:

- Given có câu hỏi mới từ bidder
- When tôi gửi câu trả lời
- Then câu trả lời được lưu vào luồng hỏi đáp
- And những người liên quan nhận được thông báo

### US-11 Từ chối bidder trên một sản phẩm

Vai trò: Seller

Câu chuyện: Là một seller, tôi muốn từ chối một bidder trên một sản phẩm cụ thể để không cho họ tiếp tục đấu giá sản phẩm đó.

Acceptance Criteria:

- Given tôi đang quản lý chi tiết sản phẩm
- When tôi chọn một bidder và xác nhận từ chối
- Then bidder đó không thể tiếp tục bid vào sản phẩm này
- And nếu bidder đó đang dẫn đầu thì hệ thống chuyển quyền dẫn đầu sang người có giá tối đa kế tiếp

### US-12 Yêu cầu nâng cấp thành seller

Vai trò: Bidder

Câu chuyện: Là một bidder, tôi muốn gửi yêu cầu nâng cấp thành seller để có thể bán sản phẩm trong tương lai.

Acceptance Criteria:

- Given tôi có tài khoản bidder hợp lệ
- When tôi gửi yêu cầu nâng cấp
- Then yêu cầu được lưu ở trạng thái chờ duyệt

### US-13 Duyệt yêu cầu nâng cấp

Vai trò: Administrator

Câu chuyện: Là một administrator, tôi muốn duyệt yêu cầu nâng cấp để cấp quyền seller cho bidder đủ điều kiện.

Acceptance Criteria:

- Given có yêu cầu chờ duyệt
- When tôi bấm duyệt
- Then role của người dùng được chuyển sang seller

### US-14 Hoàn tất đơn hàng sau khi đấu giá kết thúc

Vai trò: Winner và Seller

Câu chuyện: Là người thắng và seller, chúng tôi muốn hoàn tất giao dịch sau đấu giá để kết thúc đơn hàng.

Acceptance Criteria:

- Given phiên đấu giá đã kết thúc và tôi là winner hoặc seller
- When tôi mở trang chi tiết sản phẩm
- Then hệ thống chuyển tôi sang luồng hoàn tất đơn hàng
- And hệ thống hỗ trợ thanh toán, gửi địa chỉ, xác nhận nhận tiền, xác nhận nhận hàng và đánh giá giao dịch

### US-15 Đánh giá giao dịch

Vai trò: Winner và Seller

Câu chuyện: Là hai bên tham gia giao dịch, chúng tôi muốn đánh giá lẫn nhau để phản ánh chất lượng giao dịch.

Acceptance Criteria:

- Given đơn hàng đã hoàn tất hoặc bị hủy theo quy trình nghiệp vụ
- When một bên gửi đánh giá +/- và nhận xét ngắn
- Then hệ thống lưu kết quả đánh giá và hiển thị trong hồ sơ cá nhân

## 5. Quy tắc áp dụng cho acceptance criteria

- Mỗi story liên quan đến đấu giá phải xác minh giá tối đa, giá hiển thị, bước giá và điều kiện quyền bid.
- Mỗi story liên quan đến tài khoản phải xác minh email và mật khẩu.
- Mỗi story sau đấu giá phải tôn trọng trạng thái cuối của sản phẩm và quy tắc hủy giao dịch của seller.
