#!/bin/bash
# Cập nhật content từ Excel + sync assets vào frontend
set -e

cd "$(dirname "$0")/.."

echo "📊 Build content từ Excel..."
node build-content.js

echo "📁 Copy content.json vào frontend/public..."
cp content.json frontend/public/content.json

echo "🖼️  Sync images (block image+audio)..."
if [ -d "images" ]; then
  cp -r images/. frontend/public/images/
fi

echo "🔊 Sync audios (block image+audio)..."
if [ -d "audios" ]; then
  cp -r audios/. frontend/public/audios/
fi

echo "📂 Sync thư mục slideshow (mỗi thư mục có images/ và audio/)..."
# Mỗi thư mục slideshow nằm ở gốc project, bên trong có images/ và audio/
# Ví dụ: buoi1/images/slide_1.png  buoi1/audio/slide_1.mp3
for dir in */; do
  dir="${dir%/}"
  # Bỏ qua các thư mục hệ thống
  case "$dir" in
    frontend|backend|scripts|node_modules|images|audios|.git|.github) continue ;;
  esac
  # Chỉ sync nếu có thư mục images/ hoặc audio/ bên trong
  if [ -d "$dir/images" ] || [ -d "$dir/audio" ]; then
    echo "   → $dir"
    mkdir -p "frontend/public/$dir"
    if [ -d "$dir/images" ]; then
      cp -r "$dir/images" "frontend/public/$dir/images"
    fi
    if [ -d "$dir/audio" ]; then
      cp -r "$dir/audio" "frontend/public/$dir/audio"
    fi
  fi
done

echo ""
echo "✅ Xong! Bây giờ chạy:"
echo "   git add -A && git commit -m 'update content' && git push"
echo "   GitHub Actions sẽ tự deploy lên GitHub Pages."
