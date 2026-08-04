# Docs/Plans — Hướng dẫn tổng 5 tuần Onboarding

> File này là điểm bắt đầu khi bạn vào `docs/plans/`. Nó giải thích **logic chạy** xuyên suốt 5 tuần: đọc gì trước, làm gì, đối chiếu với reference nào, và lệnh cụ thể để chạy từng deliverable.

---

## Tinh thần chung — đọc trước khi bắt đầu bất kỳ tuần nào

Mỗi tuần đều có **reference/example implementation** (research mẫu, code CLI, bài nộp scenario, automation script...). Tất cả đều được đánh dấu rõ **"reference — không phải để copy"**. Đúng tinh thần Week 1 (workflow *Iterative Refinement*): bạn tự làm trước bằng chính sức mình, sau đó mới đối chiếu với reference để học cách tiếp cận, phát hiện chỗ mình làm khác/sai, chứ không phải chép lại rồi nộp.

Mỗi tuần theo cùng một layout tài liệu:

```
docs/plans/week-N/
├─ overview.md        Mục tiêu + Acceptance Criteria (đọc đầu tiên)
├─ architecture.md     Kiến trúc kỹ thuật, ASCII diagram (nếu tuần có phần code)
├─ tasks.md            Task breakdown theo ngày + Sys Admin/DevOps + Learning Hints
└─ ...                 Tài liệu riêng của tuần (scenarios/, data/, submissions/...)
```

---

## Sơ đồ tiến trình 5 tuần

```
Week 1                Week 2              Week 3               Week 4                Week 5
AI Workflows    →     TDD nền tảng   →    Mở rộng CLI    →     Vận hành/Giao tiếp →  Phân tích + Automation
(research doc)        (Ticket CLI)        (KB integration)     (Odoo, email)         (report + Python script)
      │                    │                    │                     │                     │
      ▼                    ▼                    ▼                     ▼                     ▼
research-template    ticket-manager-cli/  ticket-manager-cli/   submissions/          pattern-analysis.md
  .md (tự điền)         (Week 2 code)      (thêm `kb` commands)  (6 scenario)          + login-issue-automation/
```

Kiến thức/kỹ năng của tuần trước là nền cho tuần sau: Week 1 (cách làm việc với AI) → Week 2 (TDD thật trên 1 CLI nhỏ) → Week 3 (mở rộng cùng CLI đó bằng tích hợp API ngoài) → Week 4 (kỹ năng vận hành/giao tiếp, không còn viết code) → Week 5 (quay lại viết code, nhưng để tự động hoá vấn đề phát hiện được từ vận hành).

---

## Week 1 — AI Training (Research)

**Đọc:** [`week-1/overview.md`](./week-1/overview.md) → `slides-ai-training.md` (thư mục gốc)

**Làm:** Điền [`week-1/research-template.md`](./week-1/research-template.md) — nghiên cứu TDD, testing levels, AI validation, common mistakes; ghi lại bằng chứng áp dụng 3 workflow (Layered Questioning, Solution Exploration, Iterative Refinement).

**Đối chiếu:** [`week-1/research-example.md`](./week-1/research-example.md) — bản mẫu đã điền đầy đủ, chỉ dùng tham khảo format/độ sâu.

**Không có phần code** — deliverable tuần này thuần tài liệu.

---

## Week 2 — TDD: Ticket Manager CLI

**Đọc:** [`week-2/overview.md`](./week-2/overview.md) → [`week-2/architecture.md`](./week-2/architecture.md) → [`week-2/tasks.md`](./week-2/tasks.md)

**Làm:** Tự viết Ticket Manager CLI bằng TDD (Red → Green → Refactor) theo đúng breakdown Days 1-5 trong `tasks.md` — domain model, `TicketRepository` (JSON storage), `TicketService` (validation), CLI commands `tickets create|list|show|update`.

**Đối chiếu:** [`ticket-manager-cli/`](../../ticket-manager-cli) (ở thư mục gốc repo, không nằm trong `docs/`) — reference implementation, có sẵn 75 test pass.

**Chạy thử reference:**

```bash
cd ticket-manager-cli
npm install
npm run build
npm test                                  # 75/75 test

node dist/cli/index.js tickets create --title "Fix login bug" --priority high
node dist/cli/index.js tickets list
```

(Chi tiết đầy đủ mọi command + flag: xem [`ticket-manager-cli/README.md`](../../ticket-manager-cli/README.md))

---

## Week 3 — Mở rộng CLI: Knowledge Base Integration

**Đọc:** [`week-3/overview.md`](./week-3/overview.md) → [`week-3/architecture.md`](./week-3/architecture.md) (API contract, KB structure) → [`week-3/tasks.md`](./week-3/tasks.md)

**Làm:** Thêm nhóm lệnh `kb ...` vào chính CLI của Week 2 — `KBClient` interface, `MockKBClient` (in-memory, seed sẵn tài liệu mẫu), `HTTPKBClient` (gọi KB server thật qua HTTP), commands `kb search|list|retrieve|add`, switch client qua biến môi trường `KB_CLIENT`.

**Đối chiếu:** Vẫn là [`ticket-manager-cli/`](../../ticket-manager-cli) — Week 3 nằm trong cùng project, thư mục `src/kb/` và `src/server/`. Project này bao gồm luôn một **mock KB HTTP server** implement đúng API contract, để `HTTPKBClient` có server thật để gọi (vì không có KB server production nào khả dụng trong môi trường training).

**Chạy thử reference:**

```bash
cd ticket-manager-cli

# Mock client (mặc định, không cần server)
node dist/cli/index.js tickets kb search "template"

# HTTP client: cần chạy mock KB server trước, ở 1 terminal khác
npm run kb-server                          # mặc định cổng 4000

# rồi ở terminal khác:
KB_CLIENT=http KB_API_URL=http://localhost:4000 node dist/cli/index.js tickets kb search "devops"
```

---

## Week 4 — Ticket Handling & Professional Communication

**Đọc:** [`week-4/overview.md`](./week-4/overview.md) → [`week-4/architecture.md`](./week-4/architecture.md) (7-step process, Class of Service, communication patterns) → [`week-4/tasks.md`](./week-4/tasks.md) → 6 file trong [`week-4/scenarios/`](./week-4/scenarios/)

**Làm:** Không có code — thực hành trực tiếp trên **Odoo thật** (hoặc trial account, xem hướng dẫn Sys Admin/DevOps trong `tasks.md`): tạo/cập nhật ticket, soạn email/chat theo từng scenario, áp dụng đúng 7-step process và Class of Service.

**Đối chiếu:** [`week-4/submissions/`](./week-4/submissions/) — 6 bài nộp mẫu (bản ghi ticket mô phỏng + toàn bộ email/chat draft đã điền đầy đủ, không còn placeholder), kèm README index giải thích lựa chọn branch cho scenario 3 và 5.

**Không có lệnh để "chạy"** — nộp bài bằng link/screenshot Odoo thật + email draft thật, theo đúng mục "Kết quả cần nộp" của từng scenario.

---

## Week 5 — Reporting, Analysis & Automation

**Đọc:** [`week-5/overview.md`](./week-5/overview.md) → [`week-5/architecture.md`](./week-5/architecture.md) (Reporting Framework, Analysis Process) → [`week-5/tasks.md`](./week-5/tasks.md)

**Làm — Days 1-2 (Reporting & Analysis):** Dùng Odoo reporting tools phân tích dữ liệu ticket thật ([`week-5/data/sample.xlsx`](./week-5/data/sample.xlsx)), tìm top pattern lặp lại, định lượng impact.

**Đối chiếu:** [`week-5/pattern-analysis.md`](./week-5/pattern-analysis.md) — phân tích đầy đủ trên đúng file `sample.xlsx` (131 ticket, đã forward-fill đúng định dạng grouped-kanban export của Odoo), kết luận chọn "Login/Account Access" làm mục tiêu automation, có justify bằng số liệu thật + bảng đối chiếu tiêu chí "When to Create Automation".

**Làm — Days 3-4 (Automation):** Implement automation Operating Engineer cho Scenario 1 (Login Issue) — phân tích ticket, check HR system, quyết định (reactivate/reset/manual review), auto-response, tích hợp webhook Odoo.

**Đối chiếu:** [`login-issue-automation/`](../../login-issue-automation) (ở thư mục gốc repo) — Python, 23 test pass, có cả webhook server và scheduled-check làm 2 kiểu trigger.

**Chạy thử reference:**

```bash
cd login-issue-automation
python -m venv venv
source venv/Scripts/activate               # Git Bash trên Windows; venv\Scripts\Activate.ps1 nếu dùng PowerShell
pip install -r requirements.txt

pytest -q                                  # 23/23 test

python -m app.webhook_server               # chạy server tại http://127.0.0.1:5000
# ở terminal khác, mô phỏng ticket mới (xem thêm 2 case còn lại trong README):
curl -X POST http://127.0.0.1:5000/webhook/ticket \
  -H "Content-Type: application/json" \
  -d '{"id": 201, "subject": "Khong the dang nhap vao LMS", "description": "", "reporter_email": "active@mindx.edu.vn"}'
```

(Chi tiết đầy đủ, gồm cả case Deactivated-còn-làm-việc và Deactivated-đã-nghỉ: xem [`login-issue-automation/README.md`](../../login-issue-automation/README.md))

---

## Tổng hợp nhanh

| Tuần | Loại deliverable | Reference implementation | Lệnh chạy chính |
|---|---|---|---|
| 1 | Research doc | `week-1/research-example.md` | — (không có code) |
| 2 | Code (TDD) | `ticket-manager-cli/` | `npm test` |
| 3 | Code (mở rộng CLI) | `ticket-manager-cli/` (`src/kb/`) | `npm run kb-server` |
| 4 | Thao tác Odoo + email | `week-4/submissions/` | — (không có code) |
| 5 | Report + Automation | `week-5/pattern-analysis.md`, `login-issue-automation/` | `pytest -q`, `python -m app.webhook_server` |
