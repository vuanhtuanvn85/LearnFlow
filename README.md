# LearnFlow

Nền tảng học tập cá nhân — React + Express + MongoDB

## Chạy local

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# Mở http://localhost:5173/learnflow/
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Điền MONGODB_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET vào .env
npm install
npm start
```

## Cập nhật nội dung

```bash
# Sửa learnflow-content.xlsx → chạy:
node build-content.js
cp content.json frontend/public/content.json
```
Hoặc dùng script: `bash scripts/update-content.sh`

Sau đó commit & push → GitHub Actions tự deploy.

## Deploy

- **Frontend**: GitHub Pages (tự động qua GitHub Actions khi push lên main)
- **Backend**: Render.com — kết nối GitHub repo, root dir = `backend`
- **Database**: MongoDB Atlas Free Cluster (M0)

## Phím tắt

| Phím | Hành động |
|------|-----------|
| `←` | Bài trước |
| `→` | Bài tiếp  |
| `S` | Toggle lưu bài |
