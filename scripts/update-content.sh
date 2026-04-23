#!/bin/bash
# Cập nhật content từ Excel + sync images/audios vào frontend
set -e

cd "$(dirname "$0")/.."

echo "📊 Build content từ Excel..."
node build-content.js

echo "📁 Copy content.json vào frontend/public..."
cp content.json frontend/public/content.json

echo "🖼️  Sync images..."
cp -r images/. frontend/public/images/

echo "🔊 Sync audios..."
cp -r audios/. frontend/public/audios/

echo ""
echo "✅ Xong! Bây giờ chạy:"
echo "   git add -A && git commit -m 'update content' && git push"
echo "   GitHub Actions sẽ tự deploy lên GitHub Pages."
