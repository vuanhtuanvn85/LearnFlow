#!/bin/bash
# Cập nhật content từ Excel → copy vào frontend → commit
set -e

cd "$(dirname "$0")/.."

echo "📊 Build content từ Excel..."
node build-content.js

echo "📁 Copy content.json vào frontend/public..."
cp content.json frontend/public/content.json

echo "✅ Xong! Bây giờ chạy: git add -A && git commit -m 'update content' && git push"
echo "   GitHub Actions sẽ tự deploy lên GitHub Pages."
