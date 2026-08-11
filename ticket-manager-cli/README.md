# Ticket Manager CLI (Week 2 + Week 3 — Reference Implementation)

> **Đây là bản tham khảo/mẫu (reference/example implementation) cho Week 2 và Week 3.**
> Hãy tự làm bài tập bằng TDD (Red → Green → Refactor) trước, rồi mới đọc code ở đây để đối chiếu cách tiếp cận.
> Đừng copy trực tiếp — mục tiêu là bạn tự trải qua quy trình TDD và tự đưa ra quyết định thiết kế của riêng mình.

Xem thêm:
- [`docs/plans/week-2/overview.md`](../docs/plans/week-2/overview.md), [`architecture.md`](../docs/plans/week-2/architecture.md), [`tasks.md`](../docs/plans/week-2/tasks.md) — đề bài & kiến trúc Ticket Manager CLI
- [`docs/plans/week-3/overview.md`](../docs/plans/week-3/overview.md), [`architecture.md`](../docs/plans/week-3/architecture.md), [`tasks.md`](../docs/plans/week-3/tasks.md) — đề bài & kiến trúc tích hợp Knowledge Base (KB)

---

## Mục lục

1. [Cài đặt](#cài-đặt)
2. [Ticket Manager CLI (Week 2)](#ticket-manager-cli-week-2)
3. [Knowledge Base CLI (Week 3)](#knowledge-base-cli-week-3)
4. [Chạy test](#chạy-test)
5. [Cấu trúc project](#cấu-trúc-project)
6. [Troubleshooting](#troubleshooting)
7. [Vài bài học rút ra khi build project này](#vài-bài-học-rút-ra-khi-build-project-này)

---

## Cài đặt

Project này **độc lập** với repo Slidev ở thư mục gốc — có `package.json` riêng, dùng `npm` (không dùng `pnpm`), không đụng tới `pnpm-lock.yaml` hay `package.json` ở root.

```bash
cd ticket-manager-cli
npm install     # cài dependencies
npm run build   # biên dịch TypeScript -> dist/
```

Sau khi build, có 2 cách chạy CLI:

```bash
# Cách 1: chạy trực tiếp file đã build
node dist/cli/index.js tickets list

# Cách 2: cài "tickets" như một lệnh global/local (dùng field "bin" trong package.json)
npm link
tickets tickets list
```

Trong các ví dụ bên dưới, để ngắn gọn mình dùng `tickets <command>` — nếu bạn không `npm link`, thay bằng `node dist/cli/index.js <command>`.

**Yêu cầu:** Node.js >= 18 (khuyến nghị Node 18/20/22), npm.

---

## Ticket Manager CLI (Week 2)

Dữ liệu ticket được lưu trong 1 file JSON local. Mặc định là `./tickets.json` (tại thư mục đang chạy lệnh); có thể đổi bằng:
- flag `--tickets-file <path>` (ưu tiên cao nhất), hoặc
- biến môi trường `TICKETS_FILE`

### `tickets create`

```bash
tickets create --title "Fix login bug" --priority high --tags bug,auth
tickets create --title "Investigate outage" --description "Prod is down" --status in-progress
```

Options: `--title <t>` (**bắt buộc**), `--description <d>`, `--status <s>` (`open|in-progress|done`, mặc định `open`), `--priority <p>` (`low|medium|high`, mặc định `medium`), `--tags <a,b,c>` (phân tách bằng dấu phẩy).

### `tickets list`

```bash
tickets list
tickets list --status open
tickets list --priority high --tags bug
```

Có thể kết hợp nhiều filter cùng lúc (AND). Filter `--tags` yêu cầu ticket phải có **đủ tất cả** tag được liệt kê.

### `tickets show <id>`

```bash
tickets show 6f1e2c3a-...-abcd
```

### `tickets update <id>`

```bash
tickets update 6f1e2c3a-...-abcd --status done
tickets update 6f1e2c3a-...-abcd --priority low --tags urgent,customer
```

Chỉ field nào được truyền mới bị thay đổi; riêng `--tags` sẽ **thay thế toàn bộ** danh sách tag cũ (không merge).

### Output: human-readable vs `--json`

Mọi lệnh đều hỗ trợ flag `--json` (global option) để in JSON thô — tiện cho script hoặc test, thay vì output dạng bảng/text cho người đọc:

```bash
tickets list --json
tickets show <id> --json
```

### Exit code & thông báo lỗi

Mọi lỗi (thiếu `--title`, `status`/`priority` sai, ticket không tồn tại, file JSON hỏng...) đều in ra `stderr` với thông báo rõ ràng và exit code khác 0 — không có raw stack trace.

---

## Knowledge Base CLI (Week 3)

CLI mở rộng thêm nhóm lệnh `kb ...` để truy vấn một Knowledge Base (KB): tài liệu được tổ chức theo `nodePath` dạng cây (ví dụ `/templates/email`, `/team/devops`).

### Chọn client: `KB_CLIENT=mock|http`

```bash
# Mặc định: dùng MockKBClient (in-memory, seed sẵn 3 tài liệu mẫu) — không cần server nào cả
tickets kb search "template"

# Dùng HTTPKBClient để gọi một KB server thật (hoặc mock server của chính project này)
KB_CLIENT=http KB_API_URL=http://localhost:4000 tickets kb search "template"
```

- `KB_CLIENT` — `mock` (mặc định) hoặc `http`
- `KB_API_URL` — chỉ cần khi `KB_CLIENT=http`, mặc định `http://localhost:4000`

> **Lưu ý quan trọng:** `MockKBClient` là in-memory và **chỉ tồn tại trong 1 lần chạy process**. Vì mỗi lần gọi CLI là một process mới, `kb add` bằng mock client ở lần chạy này sẽ **không** xuất hiện khi bạn `kb retrieve` ở lần chạy CLI tiếp theo. Muốn dữ liệu tồn tại xuyên suốt nhiều lần gọi CLI, hãy dùng `KB_CLIENT=http` với KB server đang chạy (xem phần dưới).

### `kb search`

```bash
tickets kb search "response" --top-k 3
```

### `kb list`

```bash
tickets kb list --node /templates/email --limit 10
tickets kb list   # không filter -> liệt kê tất cả (giới hạn bởi --limit, mặc định 10)
```

### `kb retrieve`

```bash
tickets kb retrieve doc-001
```

### `kb add`

```bash
tickets kb add --file ./new-template.md --path /templates/sms --tags sms,template
tickets kb add --file ./new-template.md --path /templates/sms --title "SMS OTP Template" --tags sms
```

Nội dung tài liệu = nội dung file `--file`. Nếu không truyền `--title`, mặc định lấy tên file (bỏ phần mở rộng).

### Chạy Mock KB HTTP Server độc lập

Vì không có KB server thật nào để gọi, project này có sẵn một **mock KB HTTP server** implement đúng API contract trong [`docs/plans/week-3/architecture.md`](../docs/plans/week-3/architecture.md) (`POST /search`, `/list`, `/retrieve`, `/add`). Đây chính là server mà `HTTPKBClient` được test end-to-end.

```bash
npm run kb-server            # build rồi chạy dist/server/runKbServer.js, mặc định cổng 4000
PORT=4321 npm run kb-server  # đổi cổng

npm run dev:kb-server        # chạy trực tiếp qua ts-node, không cần build trước (tiện khi develop)
```

Sau khi server chạy, ở một terminal khác:

```bash
KB_CLIENT=http KB_API_URL=http://localhost:4000 tickets kb search "devops"
KB_CLIENT=http KB_API_URL=http://localhost:4000 tickets kb add --file ./doc.md --path /team/hr --tags hr
KB_CLIENT=http KB_API_URL=http://localhost:4000 tickets kb retrieve doc-004   # tài liệu vừa add — vẫn còn vì server giữ state
```

### API Contract (tóm tắt)

| Endpoint | Request body | Response |
|---|---|---|
| `POST /search` | `{ query, topK }` | `{ results: [{ id, title, nodePath, matchType }] }` |
| `POST /list` | `{ nodePath, limit }` | `{ documents: Document[] }` |
| `POST /retrieve` | `{ docId }` | `{ document: Document }` (404 nếu không tồn tại) |
| `POST /add` | `{ title, content, nodePath, tags }` | `{ document: Document }` (201) |

Chi tiết đầy đủ (kể cả ví dụ JSON) xem [`docs/plans/week-3/architecture.md`](../docs/plans/week-3/architecture.md).

---

## Chạy test

```bash
npm test          # build rồi chạy toàn bộ test suite (Jest)
npm run test:watch
```

Test suite gồm:
- **Unit tests** (`tests/unit/`) — `TicketRepository`, `TicketService`, `MockKBClient`
- **Integration tests** (`tests/integration/`) — chạy **CLI đã build** như một subprocess thật (không import source trực tiếp), mỗi test dùng file JSON tạm riêng (cô lập, không share state); `HTTPKBClient` test end-to-end với mock KB HTTP server thật (spin lên cổng ngẫu nhiên trong test); test "parity" đối chiếu `MockKBClient` và `HTTPKBClient` cho cùng một thao tác để đảm bảo 2 client hoán đổi được cho nhau

Tại thời điểm viết tài liệu này: **75/75 test pass** (7 test suite).

---

## Cấu trúc project

```
ticket-manager-cli/
├─ src/
│  ├─ models/       Ticket, error classes dùng chung (Week 2)
│  ├─ storage/       TicketRepository — đọc/ghi JSON file
│  ├─ services/      TicketService — validation + business logic
│  ├─ kb/             Document/SearchResult/KBQuery, KBClient interface,
│  │                  MockKBClient, HTTPKBClient, KBStore (logic dùng chung) (Week 3)
│  ├─ server/         mock KB HTTP server + script chạy độc lập (Week 3)
│  └─ cli/            entrypoint + Commander.js commands (tickets, kb)
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ helpers/        runCli.ts — spawn CLI đã build cho integration test
└─ README.md          (file này)
```

---

## Troubleshooting

- **`tickets: command not found`** → chưa `npm link`, hoặc dùng `node dist/cli/index.js ...` thay vì `tickets ...`
- **Lỗi khi chạy CLI nhưng chưa build** → chạy `npm run build` trước (CLI chạy từ `dist/`, không chạy trực tiếp từ `src/`)
- **`kb retrieve` báo "Document not found" ngay sau khi `kb add`** → xem lưu ý ở mục [Chọn client](#chọn-client-kb_clientmockhttp): mock client không giữ state giữa các lần gọi CLI khác nhau; dùng `KB_CLIENT=http` với server đang chạy nếu cần state tồn tại lâu dài
- **`kb ... --json` báo lỗi kết nối khi `KB_CLIENT=http`** → kiểm tra `npm run kb-server` (hoặc `dev:kb-server`) đang chạy, và `KB_API_URL` trỏ đúng cổng
- **Test integration bị treo (hang)** → xem mục bên dưới, đây là lỗi thật mình đã gặp khi build project này

---

## Vài bài học rút ra khi build project này

Phần này để lại có chủ đích — vì đây đúng là những thứ TDD nghiêm túc (test có assertion thật, không phải "chạy không throw là được") giúp phát hiện ra:

1. **`err instanceof Error` không đáng tin cậy giữa các môi trường/realm khác nhau.** `TicketRepository` ban đầu check `err instanceof Error && 'code' in err` để nhận diện lỗi `ENOENT` từ `fs.readFileSync`. Chạy trực tiếp bằng Node thì đúng, nhưng chạy trong môi trường test của Jest thì `instanceof Error` lại `false` với đúng lỗi đó — khiến file chưa tồn tại bị coi nhầm thành "file hỏng". Sửa bằng cách check shape (`typeof err === 'object' && 'code' in err`) thay vì `instanceof`.
2. **Global option của Commander.js có thể đụng tên với option của subcommand.** Ban đầu dùng `--file` cho cả option global (đường dẫn file ticket) lẫn option riêng của `kb add` (file nội dung tài liệu) — Commander không báo lỗi rõ ràng, chỉ âm thầm không nhận đúng giá trị. Đổi option global thành `--tickets-file` để tránh đụng độ.
3. **`spawnSync` + server chạy cùng process = deadlock.** Test "gọi CLI qua HTTPKBClient" ban đầu start mock KB server ngay trong tiến trình Jest, rồi dùng `spawnSync` để gọi CLI con. `spawnSync` chặn (block) toàn bộ event loop của process cha cho tới khi tiến trình con thoát — nhưng server (chạy trong process cha) cần chính event loop đó để trả lời request từ tiến trình con. Kết quả: treo vĩnh viễn. Fix: dùng `spawn` (bất đồng bộ) + `Promise` cho riêng trường hợp này, giữ `spawnSync` cho các test không có server cùng-process.
4. **Node's global `fetch` (undici) có thể giữ kết nối keep-alive treo tiến trình.** Khi `HTTPKBClient` từng dùng `fetch`, tiến trình CLI (và cả tiến trình test) đôi khi không tự thoát vì socket keep-alive vẫn mở. Giải pháp cuối cùng: chuyển `HTTPKBClient` sang dùng module `http`/`https` built-in của Node (không dùng `fetch`), và server luôn trả header `Connection: close`.

Đây chính xác là lý do vì sao Week 2/3 nhấn mạnh test có ý nghĩa và integration test chạy CLI thật (không chỉ unit test in-process) — nếu chỉ test "không throw" thì cả 4 lỗi trên đều lọt qua.
