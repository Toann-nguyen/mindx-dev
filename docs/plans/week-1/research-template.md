# Nghiên cứu Tuần 1: TDD cho Phát triển CLI với Sự hỗ trợ của AI

**Người thực hiện:** [Robert Nguyễn Minh Toàn]

> Điền đầy đủ từng phần bên dưới. Tài liệu này là deliverable của Tuần 1 — bám sát Acceptance Criteria trong [overview.md](./overview.md).

---

## 1. Nguyên lý cốt lõi của TDD

**TDD là gì?**

> Test-Driven Development (TDD) là một quy trình phát triển phần mềm trong đó các bài test tự động được viết **trước** khi viết mã sản phẩm thực tế (production code). Thay vì viết code rồi mới test, TDD đảo ngược quy trình này. Điều này mang lợi ích như là có thể có cái nhìn tổng quát về nghiệp vụ muốn xây dựng trước khi bắt đầu. Ví dụ moudle auth với social login google, lúc này bạn sẽ có cái nhìn tổng quan hơn ví dụ viết uni test , integration test và e2e.

**Red → Green → Refactor**

| Bước     | Chuyện gì xảy ra                                                                                                                                  | Vì sao quan trọng                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Red      | Viết test cho một hành vi cụ thể chưa tồn tại và chạy để đảm bảo test **fail**. Ví dụ: `create` thiếu `title` phải báo lỗi và exit code khác `0`. | Buộc mình làm rõ yêu cầu và hành vi trước khi viết code. Test fail ở bước này chứng minh test không bị pass giả, tránh viết code sai hướng hoặc thừa logic.                                |
| Green    | Viết implementation **tối thiểu nhất** để test pass. Ví dụ: thêm validation `title` và trả về lỗi phù hợp.                                        | Giữ phạm vi nhỏ, có phản hồi nhanh, tránh over-engineering. Đặc biệt quan trọng khi dùng AI: chỉ nhận code vừa đủ để vượt qua test đã định nghĩa, không blindly accept code ngoài yêu cầu. |
| Refactor | Dọn dẹp và cải thiện cấu trúc code trong khi test vẫn xanh: tách hàm, đổi tên rõ hơn, giảm trùng lặp, chuẩn hóa error handling.                   | Giúp code dễ đọc, dễ maintain và an toàn khi thay đổi. Đây là bước biến code “chạy được” thành code “viết tốt”, nhất là sau khi review code do AI sinh ra.                                 |

---

## 2. Các cấp độ testing

| Cấp độ           | Định nghĩa                                                                                 | Bao phủ những gì                                                                       | Ví dụ trong Ticket Manager CLI                                                                                      | Tốc độ / Chi phí                                              |
| ---------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Unit test        | Test một đơn vị logic nhỏ, cô lập với file system, thời gian, process.                     | Logic thuần: parse argument, validate input, tạo ID, quy tắc chuyển trạng thái ticket. | `parseCreateCommand(['create', 'Fix bug'])` phải trả về `{ title: 'Fix bug', status: 'open' }`.                     | Rất nhanh, chi phí thấp, chạy được nhiều.                     |
| Integration test | Test sự phối hợp giữa nhiều module thông qua ranh giới thật hoặc giả lập nhẹ.              | Command handler + service + repository JSON; đảm bảo dữ liệu được lưu/đọc đúng.        | Sau khi gọi `createTicket`, file `tickets.json` phải chứa ticket mới và `listTickets` đọc lại được ticket đó.       | Nhanh đến trung bình, tốn hơn unit test một chút.             |
| End-to-end test  | Test CLI như người dùng thật: chạy lệnh, kiểm tra output, exit code và trạng thái lưu trữ. | Toàn bộ luồng: argv, stdout/stderr, exit code, file JSON.                              | Chạy `node cli.js create "Fix bug"` phải in thông báo thành công, exit code `0`, file `tickets.json` có ticket mới. | Chậm hơn, chi phí cao hơn, chỉ nên dùng cho luồng quan trọng. |

---

## 3. AI Validation: Test giúp xác thực code do AI sinh ra như thế nào

**Vì sao test quan trọng khi code do AI viết:**

> Test là đặc tả hành vi có thể chạy được. Khi dùng AI, test giúp mình xác nhận code thật sự đáp ứng yêu cầu thay vì chỉ “trông có vẻ đúng”. Test cũng buộc mình làm rõ input, output, edge case và hành vi lỗi trước khi để AI tạo implementation. Đây là hàng rào chống lại hallucination, giả định sai và việc copy-paste thiếu kiểm soát.

**Ví dụ cụ thể:**

- Code/function do AI sinh ra: AI viết hàm `updateTicketStatus(id, newStatus)` chỉ tìm ticket và gán trạng thái mới, không kiểm tra trạng thái hợp lệ, không xử lý file JSON bị hỏng.
- Test viết trước/sau: Viết test trước cho các hành vi:
  - Ticket không tồn tại phải báo lỗi rõ ràng và không ghi file.
  - Trạng thái không hợp lệ phải bị từ chối.
  - File JSON rỗng/hỏng phải được xử lý an toàn.
- Lỗi mà test phát hiện được: Test phát hiện AI cho phép chuyển trạng thái không hợp lệ và crash khi `tickets.json` rỗng. Sau đó yêu cầu AI thêm validation trạng thái, xử lý lỗi đọc file và trả về thông báo lỗi phù hợp.

---

## 4. Checklist test CLI — Ticket Manager CLI

| Khu vực      | Cần test gì                                                    | Ví dụ test case                                                                                                                                           |
| ------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands     | `create`, `list`, `show`, `update` hoạt động đúng như mong đợi | `create "Fix bug"` tạo ticket với trạng thái `open`; `list --status open` chỉ trả về ticket đang mở; `show 123` hiển thị đúng ticket có id `123`.         |
| Validation   | Input không hợp lệ/thiếu bị từ chối kèm thông báo lỗi rõ ràng  | `create` thiếu title phải báo lỗi và exit code khác `0`; `update 123 --status invalid` phải từ chối và gợi ý trạng thái hợp lệ.                           |
| File storage | Đọc/ghi JSON, xử lý file bị hỏng/không tồn tại                 | Nếu `tickets.json` không tồn tại, CLI khởi tạo danh sách rỗng hoặc xử lý an toàn; nếu file chứa JSON hỏng, CLI không crash mà báo lỗi rõ ràng.            |
| Errors       | Ticket không tồn tại, chuyển trạng thái không hợp lệ, v.v.     | `show 999` báo “Ticket not found”; `update 123 --status done` thất bại nếu ticket không tồn tại; chuyển trạng thái sai quy tắc nghiệp vụ phải bị từ chối. |

---

## 5. Các lỗi thường gặp

| Lỗi                                                    | Vì sao là vấn đề                                                                                                                                                                       | Cách tránh                                                                                                                                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Over-testing (test quá nhiều)                          | Tạo ra bộ test phình to, trùng lặp, chạy chậm nhưng không bảo vệ đúng hành vi quan trọng. Coverage cao không đồng nghĩa với phần mềm đúng.                                             | Chỉ test những hành vi có rủi ro cao và giá trị nghiệp vụ rõ ràng: commands, validation, file storage, error handling. Tự hỏi: “Nếu test này fail, người dùng có bị ảnh hưởng không?” |
| Weak assertions (assertion yếu)                        | Chỉ kiểm tra `defined`, `truthy`, “không crash” hoặc “có output” sẽ bỏ sót lỗi sai giá trị, sai trạng thái, sai thông báo lỗi, sai exit code.                                          | Assert cụ thể: đúng ticket được tạo, đúng trạng thái được lưu, đúng error message, đúng exit code, đúng nội dung file JSON. Test cả success path lẫn failure path.                    |
| Testing implementation details (test chi tiết cài đặt) | Test bám vào hàm nội bộ, số lần gọi private function hoặc cấu trúc dữ liệu nội bộ sẽ dễ fail khi refactor, dù hành vi bên ngoài vẫn đúng.                                              | Test thông qua hành vi công khai: input → output/side effect. Chỉ mock ở ranh giới ngoài như file system, time, process. Nếu dùng Hexagonal, mock adapters tại ports.                 |
| Blindly trusting AI output (tin AI mù quáng)           | AI có thể sinh code trông hợp lý nhưng sai logic, thiếu edge case, dùng API không tồn tại hoặc đưa ra giả định sai. Copy-paste không kiểm chứng làm mất khả năng kiểm soát chất lượng. | Xem AI như pair programmer. Đọc hiểu, hỏi assumptions, yêu cầu edge cases, chạy test, chạy CLI thật và refine. Nếu AI sai, chỉ ra lỗi sai và yêu cầu sửa dựa trên context đúng.       |

---

## 6. Bằng chứng áp dụng 3 workflow

Link NoteBookLM https://notebook.google.com/notebook/2a501d8a-26ee-4954-8030-53a65036e184
Link Research: https://chat.qwen.ai/s/defa2ce6-7de6-40ee-85e1-c8aa52ad0693?fev=0.2.81

### 6.1 Layered Questioning (Research → Brief → Example → Validation)

| Giai đoạn  | Bạn đã hỏi/làm gì                                                                                                                                                                                                                                                                                                                                                                                                                                           | Tóm tắt phản hồi của AI                                                                                                                                                                                                                                                                                                                                                                                                                       | Cách bạn kiểm chứng         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Research   | Tìm hiểu nguyên lý cơ bản của TDD, mục đích và vai trò của nó trong quá trình phát triển phần mềm, các bước trong TDD loop (Red → Green → Refactor), các cấp độ test (unit, integration, end-to-end), và cách TDD áp dụng để validate code do AI sinh ra.                                                                                                                                                                                                   | AI giải thích TDD là vòng lặp "viết test trước → code vừa đủ pass → refactor". Red là viết test fail để định nghĩa hành vi mong đợi; Green là code tối thiểu để test pass; Refactor là cải thiện code khi test vẫn xanh. AI nhấn mạnh TDD giúp làm rõ yêu cầu, tránh code thừa, phát hiện edge case sớm và đặc biệt quan trọng khi validate code AI sinh ra. Kèm ví dụ CLI cụ thể: test `add ""` phải báo lỗi trước khi implement validation. | ![Search Google](image.png) |
| Brief      | AI liệt kê hành vi cần test theo 4 nhóm: (1) Commands — create/list/show/update phải tạo, hiển thị đúng dữ liệu, exit code 0; (2) Validation — từ chối title rỗng, status/priority không hợp lệ kèm error message rõ ràng, exit code ≠ 0; (3) File Storage — lưu/đọc/cập nhật tickets.json đúng, không mất dữ liệu; (4) Errors — xử lý ticket không tồn tại và file JSON hỏng mà không crash. Mỗi test case đều chỉ rõ input, expected output và exit code. |                                                                                                                                                                                                                                                                                                                                                                                                                                               |                             |
| Example    |                                                                                                                                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                                                                                                                                                                                                                                                                                               |                             |
| Validation |                                                                                                                                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                                                                                                                                                                                                                                                                                               |                             |

### 6.2 Solution Exploration (Explore → Compare → Choose)

| Phương án cân nhắc       | Ưu điểm                                                                                                                               | Nhược điểm                                                                                                                                  | Có chọn không? | Vì sao (Tư duy đánh đổi)                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest**               | - Native TS/ESM, zero-config.<br>- Watch mode cực nhanh, phản hồi tức thì.<br>- API `expect` mượt mà, mocking (`vi.mock`) linh hoạt.  | - Thêm 1 dependency vào project.<br>- Ecosystem trẻ và ít tài liệu cũ hơn Jest.                                                             | **Có**         | **Tối ưu cho "Flow" của TDD.** Chấp nhận thêm 1 dependency để đổi lấy Developer Experience (DX) mượt mà. Giúp duy trì kỷ luật Red-Green-Refactor liên tục mà không bị đứt quãng vì chờ đợi hay ức chế khi fix config. |
| **Jest**                 | - Ecosystem khổng lồ, tài liệu phong phú.<br>- Mocking cực mạnh, hỗ trợ snapshot testing.<br>- Là chuẩn mực trong nhiều doanh nghiệp. | - Setup TS/ESM nhiều ma sát (`ts-jest`, flag thử nghiệm).<br>- Tốc độ chậm hơn Vitest khi chạy TS/ESM.<br>- Config nặng nề cho một CLI nhỏ. | Không          | **Bẫy "Overkill".** Chọn công cụ vì nó _phổ biến nhất_ thay vì _phù hợp nhất_ sẽ tạo ra gánh nặng cấu hình không cần thiết. Với project nhỏ, việc dành thời gian fix config thay vì viết test là một sự đánh đổi sai. |
| **node:test** (Built-in) | - Zero-dependency, có sẵn trong Node.<br>- Hỗ trợ ESM tự nhiên.<br>- Tốc độ thực thi (execution) rất nhanh.                           | - Chạy TS cần thêm loader (`tsx`).<br>- Assertion (`assert`) cứng nhắc, kém mượt.<br>- Mocking `fs` phức tạp, watch mode chưa hoàn thiện.   | Không          | **Bẫy "Zero-dependency".** Tiết kiệm 1 dependency nhưng trả giá bằng DX tệ. TDD đòi hỏi phải viết và chạy hàng trăm test, assertion rườm rà và mocking khó khăn sẽ giết chết động lực và làm chậm tốc độ phản hồi.    |

### 6.3 Iterative Refinement (Review → Summarize → Refine → Feedback → Validate)

| Vòng | AI đề xuất gì                                                                                                                                 | Bạn review thế nào                                                                                                                                                                                 | Yêu cầu tinh chỉnh gì                                                                                                                                                                                                     | Kết quả sau tinh chỉnh                                                                                                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Hàm `readTickets` đồng bộ (`readFileSync`), parse JSON và trả về dữ liệu. AI cố tình không xử lý lỗi (file missing, JSON hỏng) để tôi review. | Code quá "ngây thơ" cho production. Nguy hiểm nhất là bẫy **silent failure**: nếu AI tự ý `try/catch` lỗi JSON hỏng và trả về `[]`, CLI sẽ ghi đè và làm mất sạch dữ liệu của user ở lần chạy sau. | (1) Chuyển sang `fs/promises` (async).<br>(2) Phân biệt rõ: `ENOENT` (file chưa có) ➔ `[]`, còn JSON hỏng/sai format ➔ `Throw Error`.<br>(3) Viết 3 test dùng `mkdtempSync` (thư mục tạm thật) thay vì mock `fs` giả tạo. | AI refine lại hàm async, xử lý chuẩn xác 3 nhánh lỗi với message rõ ràng. 3 test chạy trên file system thật chứng minh không có silent data loss. Bài học lớn: **Phân biệt rõ "file chưa tồn tại" và "file bị hỏng"**. |
| 2    | Test cho lệnh `list` chỉ assert `stdout` có chứa chữ "ticket" hoặc kiểm tra hàm không ném lỗi.                                                | Assertion cực kỳ yếu (**weak assertion**). Test vẫn pass nếu CLI in ra "No tickets found" hoặc in sai dữ liệu. Đây là **false confidence** - test xanh nhưng không bắt được bug thật.              | Assert cụ thể: parse stdout, kiểm tra đúng số lượng/id/status, check exit code. Thêm case filter `--status done` và case danh sách rỗng.                                                                                  | Test mới phát hiện bug thật (CLI in tất cả thay vì lọc theo status). Assertion chặt chẽ bảo vệ đúng behavior và exit code. Bài học: **Test yếu nguy hiểm hơn không có test**.                                          |

---

## 7. Tự kiểm tra theo Acceptance Criteria

Copy từ [overview.md](./overview.md) — xác nhận từng mục trước khi nộp:

- [x] Nội dung nghiên cứu đầy đủ: nguyên lý TDD, các cấp độ test, ví dụ test CLI, AI validation
- [x] Quá trình nghiên cứu với AI được ghi lại: đã áp dụng workflow và ghi rõ các vòng lặp (Mục 6 hoàn chỉnh)
- [x] Có thể trình bày rõ ràng kết quả nghiên cứu khi nộp bài
- [x] Có thể trả lời câu hỏi về TDD, các loại test, và validate code AI dựa trên nghiên cứu này

## 8. Chuẩn bị Q&A

Dự đoán các câu hỏi có thể gặp khi trình bày nghiên cứu này, và chuẩn bị sẵn câu trả lời ngắn gọn.

| Câu hỏi có thể gặp                                                                               | Câu trả lời của bạn |
| ------------------------------------------------------------------------------------------------ | ------------------- |
| Sự khác biệt giữa unit test và integration test là gì?                                           |                     |
| Vì sao viết test trước khi viết implementation?                                                  |                     |
| Làm sao biết một implementation do AI sinh ra là "hoàn thành"?                                   |                     |
| Vấn đề của việc test chi tiết cài đặt (implementation details) thay vì hành vi (behavior) là gì? |                     |
