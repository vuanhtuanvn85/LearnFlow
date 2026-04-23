/**
 * LearnFlow — build-content.js (ESM version)
 * Đọc learnflow-content.xlsx → tạo ra content.json cho app
 * 
 * Cài đặt: npm install xlsx
 * Chạy:    node build-content.js
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_FILE = path.join(__dirname, 'learnflow-content.xlsx');
const OUTPUT_FILE = path.join(__dirname, 'content.json');

// ── Đọc Excel ──────────────────────────────────────────────
const wb = XLSX.readFile(EXCEL_FILE);

function readSheet(name) {
  const ws = wb.Sheets[name];
  if (!ws) { console.error(`❌ Không tìm thấy tab "${name}"`); process.exit(1); }
  // range: 1 để bỏ qua dòng hướng dẫn ở dòng 1 và bắt đầu từ tiêu đề cột ở dòng 2
  return XLSX.utils.sheet_to_json(ws, { range: 1, defval: '' });
}

const subjects = readSheet('subjects');
const sessions = readSheet('sessions');
const lessons = readSheet('lessons');
const blocks = readSheet('blocks');

// ── Validate ──────────────────────────────────────────────
let errors = 0;

// Check lesson_id trong blocks có tồn tại không
const lessonIds = new Set(lessons.map(l => l.lesson_id));
blocks.forEach((b, i) => {
  if (b.lesson_id && !lessonIds.has(b.lesson_id)) {
    console.warn(`⚠️  blocks dòng ${i + 2}: lesson_id "${b.lesson_id}" không tồn tại trong tab lessons`);
    errors++;
  }
});

// Check session_id trong lessons
const sessionIds = new Set(sessions.map(s => s.session_id));
lessons.forEach((l, i) => {
  if (!sessionIds.has(l.session_id)) {
    console.warn(`⚠️  lessons dòng ${i + 2}: session_id "${l.session_id}" không tồn tại trong tab sessions`);
    errors++;
  }
});

if (errors > 0) {
  console.log(`\n⚠️  Tìm thấy ${errors} lỗi — vẫn tiếp tục build, hãy kiểm tra lại file Excel.\n`);
}

// ── Parse block content ────────────────────────────────────
function parseBlock(b) {
  const type = (b['block_type'] || '').trim();
  const content = (b['content / image_file'] || '').trim();
  const audio = (b['audio_file'] || '').trim();
  const dur = parseInt(b['audio_duration_s']) || 0;
  const caption = (b['caption / code_lang'] || '').trim();
  const url = (b['link_url'] || '').trim();
  const anOvrRaw = b['auto_next_override'];
  const anOvr = anOvrRaw === true ? 'TRUE' : anOvrRaw === false ? 'FALSE' : String(anOvrRaw || '').toUpperCase();

  if (type === 'text') {
    return { type: 'text', content };
  }

  if (type === 'image+audio') {
    const autoNext = anOvr === 'TRUE' ? true : anOvr === 'FALSE' ? false : null;
    return {
      type: 'image+audio',
      imageFile: content,
      imageLabel: caption || content,
      audioFile: audio || null,
      audioLabel: caption || (audio ? audio.replace('.mp3', '') : 'Audio'),
      audioDuration: dur,
      ...(autoNext !== null && { autoNextOverride: autoNext }),
    };
  }

  // slideshow: tự động detect số slide từ folder khi chạy trên browser
  // content = tên thư mục (ví dụ: "buoi1" hoặc "chuong1/tiet1")
  // caption = tiêu đề hiển thị
  // Naming convention: images/<folder>/slide_1.png, audios/<folder>/slide_1.mp3
  if (type === 'slideshow') {
    const autoNext = anOvr === 'TRUE' ? true : anOvr === 'FALSE' ? false : null;
    return {
      type: 'slideshow',
      folder: content.trim(),
      title: caption || content.trim(),
      slides: [], // browser tự probe số lượng slide
      ...(autoNext !== null && { autoNextOverride: autoNext }),
    };
  }

  if (type === 'code') {
    return { type: 'code', lang: caption || 'text', code: content };
  }

  if (type === 'link') {
    return { type: 'link', title: content, url, icon: '📄' };
  }

  if (type === 'submit') {
    // content = label hiển thị (ví dụ: "Nộp link GitHub bài tập")
    // caption = hướng dẫn thêm (tuỳ chọn)
    return { type: 'submit', label: content || 'Nộp bài thực hành', hint: caption || '' };
  }

  if (type === 'quiz') {
    // format: câu hỏi|A|B|C|D|index_đúng (0-based)
    const parts = content.split('|');
    if (parts.length >= 3) {
      const question = parts[0];
      const options = parts.slice(1, -1);
      const correct = parseInt(parts[parts.length - 1]);
      return { type: 'quiz', question, options, correct, explain: caption || '' };
    }
    console.warn(`⚠️  quiz block lesson="${b.lesson_id}" có format không đúng`);
    return null;
  }

  console.warn(`⚠️  Không nhận dạng được block_type: "${type}"`);
  return null;
}

// ── Assemble curriculum ────────────────────────────────────
const curriculum = subjects
  .sort((a, b) => (a.order || 0) - (b.order || 0))
  .map(sub => {
    const subSessions = sessions
      .filter(s => s.subject_id === sub.subject_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(ses => {
        const sesLessons = lessons
          .filter(l => l.session_id === ses.session_id)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(les => {
            const autoNextDefault = les.auto_next === 'TRUE' || les.auto_next === true;

            const lesBlocks = blocks
              .filter(b => b.lesson_id === les.lesson_id)
              .sort((a, b) => (a.block_order || 0) - (b.block_order || 0))
              .map(b => {
                const parsed = parseBlock(b);
                if (parsed && (parsed.type === 'image+audio' || parsed.type === 'slideshow')) {
                  // lesson-level auto_next, có thể override per-block
                  if (parsed.autoNextOverride === undefined) {
                    parsed.autoNext = autoNextDefault;
                  } else {
                    parsed.autoNext = parsed.autoNextOverride;
                    delete parsed.autoNextOverride;
                  }
                }
                return parsed;
              })
              .filter(Boolean);

            // completion: tự suy từ blocks — không cần nhập tay trong Excel
            // Ưu tiên: submit > quiz:N > null
            let completion = null;
            const hasSubmit = lesBlocks.some(b => b.type === 'submit');
            const quizCount = lesBlocks.filter(b => b.type === 'quiz').length;
            if (hasSubmit) completion = 'submit';
            else if (quizCount > 0) completion = `quiz:${quizCount}`;

            return {
              id: les.lesson_id,
              title: les.title,
              type: les.type_label || '',
              autoNext: autoNextDefault,
              notes: les.notes || '',
              completion,
              blocks: lesBlocks,
            };
          });

        return {
          id: ses.session_id,
          title: ses.title,
          lessons: sesLessons,
        };
      });

    return {
      id: sub.subject_id,
      title: sub.title,
      icon: sub.icon,
      color: sub.color_class,
      sessions: subSessions,
    };
  });

// ── Write output ──────────────────────────────────────────
const output = {
  _generated: new Date().toISOString(),
  _source: 'learnflow-content.xlsx',
  curriculum,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

// ── Summary ────────────────────────────────────────────────
const totalSessions = curriculum.reduce((n, s) => n + s.sessions.length, 0);
const totalLessons = curriculum.reduce((n, s) => n + s.sessions.reduce((m, ses) => m + ses.lessons.length, 0), 0);
const totalBlocks = curriculum.reduce((n, s) => n + s.sessions.reduce((m, ses) => m + ses.lessons.reduce((k, l) => k + l.blocks.length, 0), 0), 0);
const totalImages = blocks.filter(b => b.block_type === 'image+audio').length;

console.log('');
console.log('✅ Build thành công!');
console.log(`   📁 Output: ${OUTPUT_FILE}`);
console.log(`   📚 ${curriculum.length} môn  •  ${totalSessions} buổi  •  ${totalLessons} tiết  •  ${totalBlocks} blocks`);
console.log(`   🖼️  ${totalImages} hình ảnh được gán vào các tiết`);
console.log('');

// ── Danh sách hình theo tiết (để kiểm tra) ────────────────
console.log('📸 Danh sách hình ảnh theo tiết:');
curriculum.forEach(sub => {
  sub.sessions.forEach(ses => {
    ses.lessons.forEach(les => {
      const imgs = les.blocks.filter(b => b.type === 'image+audio');
      if (imgs.length > 0) {
        console.log(`   ${les.id}: ${imgs.map(b => b.imageFile).join(', ')}`);
      }
    });
  });
});
console.log('');
