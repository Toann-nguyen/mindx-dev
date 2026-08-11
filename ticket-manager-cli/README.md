# Ticket Manager CLI (Week 2)

CLI quản lý ticket lưu trong file JSON local, xây dựng theo TDD (Red → Green → Refactor)
với kiến trúc 3 lớp `commands → service → storage`.

**Yêu cầu:** Node.js >= 18, npm.

---

## Cài đặt

Project này có `package.json` riêng, dùng `npm`:

```bash
cd ticket-manager-cli
npm install     # cài dependencies
npm run build   # biên dịch TypeScript -> dist/
```

Sau khi build, chạy CLI:

```bash
node dist/cli/index.js tickets list
```

Hoặc cài lệnh `tickets` toàn cục (dùng field `bin` trong package.json):

```bash
npm link
tickets tickets list
```

Trong các ví dụ dưới đây mình viết tắt là `tickets <command>` — nếu bạn không
`npm link`, thay bằng `node dist/cli/index.js <command>`.

## Cấu hình

Dữ liệu ticket lưu trong **1 file JSON local**. Mặc định:
`./data/tickets.json` (tính từ thư mục đang chạy lệnh).

Đổi đường dẫn bằng biến môi trường:

```bash
TICKETS_FILE=/path/to/tickets.json tickets list
```

Mọi lệnh đều có flag `--json` để in kết quả dạng JSON thô — tiện cho script và test.

---

## Usage

### `tickets create`

```bash
tickets create --title "Fix login bug" --priority high --tags bug,auth
tickets create --title "Investigate outage" --description "Prod is down" --status in-progress
```

Options: `--title <t>` (**bắt buộc**), `--description <d>`, `--status <s>`
(`open|in-progress|done`, mặc định `open`), `--priority <p>` (`low|medium|high`, mặc định `medium`),
`--tags <a,b,c>` (phân tách bằng dấu phẩy).

### `tickets list`

```bash
tickets list
tickets list --status open
tickets list --priority high --tags bug
```

Có thể kết hợp nhiều filter cùng lúc (AND). Filter `--tags` yêu cầu ticket phải có
**đủ tất cả** tag được liệt kê.

### `tickets show <id>`

```bash
tickets show 6f1e2c3a-1111-2222-3333-444455556666
```

### `tickets update <id>`

```bash
tickets update 6f1e2c3a-1111-2222-3333-444455556666 --status done
tickets update 6f1e2c3a-1111-2222-3333-444455556666 --priority low --tags urgent,customer
```

Chỉ field nào được truyền mới bị thay đổi; riêng `--tags` sẽ **thay thế toàn bộ**
danh sách tag cũ (không merge).

### Exit code & thông báo lỗi

Mọi lỗi (thiếu `--title`, `status`/`priority` sai, ticket không tồn tại, file JSON
hỏng...) đều in ra `stderr` với message rõ ràng và **exit code khác 0** — không có
raw stack trace.

---

## Chạy test

```bash
npm test          # build rồi chạy toàn bộ test suite (Jest)
npm run test:watch
```

Test suite gồm:

- **Unit tests** (`tests/unit/`) — `TicketRepository`, `TicketService`: valid/invalid
  input, error cases (file thiếu/hỏng, not-found), round-trip.
- **Integration tests** (`tests/integration/`) — spawn **CLI đã build**
  (`dist/cli/index.js`) như một subprocess thật (không import source trực tiếp),
  mỗi test dùng một file JSON tạm riêng (`mkdtempSync` + `TICKETS_FILE`) nên cô lập,
  không share state; test đủ luồng create → list → show → update và các error case.

## Cấu trúc project

```
ticket-manager-cli/
├─ src/
│  ├─ models/       Ticket (interface + enum guards), error classes
│  ├─ storage/      TicketRepository — đọc/ghi JSON file (atomic write)
│  ├─ services/     TicketService — validation + business logic
│  └─ cli/          entrypoint + Commander.js commands (tickets)
├─ tests/
│  ├─ unit/         TicketRepository, TicketService
│  ├─ integration/  cliTickets.test.ts — chạy CLI đã build end-to-end
│  └─ helpers/      runCli.ts — spawn CLI đã build cho integration test
└─ README.md        (file này)
```

## Troubleshooting

- **`tickets: command not found`** → chưa `npm link`, hoặc dùng
  `node dist/cli/index.js ...` thay vì `tickets ...`
- **Lỗi khi chạy CLI nhưng chưa build** → chạy `npm run build` trước (CLI chạy từ
  `dist/`, không chạy trực tiếp từ `src/`)
- **File JSON bị hỏng** → CLI báo lỗi rõ ràng kèm đường dẫn file; sửa hoặc xóa file
  rồi chạy lại

---

## Bài học rút ra khi build project này

Trong quá trình làm, có 2 lỗi thật đã gặp mà TDD nghiêm túc (assertion cụ thể,
không chỉ "chạy không throw") giúp phát hiện:

1. **`err instanceof Error` không đáng tin cậy giữa các môi trường/realm khác nhau.**
   `TicketRepository` ban đầu check `err instanceof Error && 'code' in err` để nhận
   diện lỗi `ENOENT` từ `fs.readFileSync`. Chạy trực tiếp bằng Node thì đúng, nhưng
   trong môi trường test của Jest thì `instanceof Error` lại `false` với đúng lỗi đó
   — khiến file chưa tồn tại bị coi nhầm thành "file hỏng". Sửa bằng cách check shape
   (`typeof err === 'object' && 'code' in err`) thay vì `instanceof`.
2. **Global option của Commander.js có thể đụng tên với option của subcommand.**
   Ban đầu dùng `--file` cho cả option global (đường dẫn file ticket) lẫn option
   riêng của một subcommand — Commander không báo lỗi rõ ràng, chỉ âm thầm không
   nhận đúng giá trị. Giải pháp: đặt tên riêng (tree hiện tại dùng `TICKETS_FILE`
   cho đường dẫn file, tránh đụng độ `--file`).

Đây chính là lý do Week 2 nhấn mạnh test có ý nghĩa và integration test chạy CLI
thật — nếu chỉ test "không throw" thì những lỗi trên đều lọt qua.