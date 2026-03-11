/**
 * Web Page module - generates the HTML page for the Markdown to PDF converter UI.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.3, 5.4, 6.3
 */

export function getWebPageHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown 转 PDF</title>
<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC",
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f5f7fa;
  color: #24292e;
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

header {
  text-align: center;
  margin-bottom: 32px;
}

header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a2e;
}

header p {
  color: #6a737d;
  margin-top: 4px;
  font-size: 0.95rem;
}

.upload-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.file-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.file-input-wrapper input[type="file"] {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 2px dashed #d0d7de;
  border-radius: 8px;
  background: #fafbfc;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.file-input-wrapper input[type="file"]:hover {
  border-color: #0366d6;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0366d6;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #0256b9;
}

.btn-success {
  background: #28a745;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background: #22903c;
}

.error-area {
  display: none;
  background: #ffeef0;
  border: 1px solid #d73a49;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  color: #b31d28;
  font-size: 0.9rem;
  word-break: break-word;
}

.error-area.visible {
  display: block;
}

.preview-section {
  display: none;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 24px;
  overflow: hidden;
}

.preview-section.visible {
  display: block;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e1e4e8;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
}

#previewFrame {
  width: 100%;
  min-height: 400px;
  border: none;
  display: block;
}

.loading-overlay {
  display: none;
  text-align: center;
  padding: 48px 16px;
  color: #6a737d;
  font-size: 0.95rem;
}

.loading-overlay.visible {
  display: block;
}

.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #e1e4e8;
  border-top-color: #0366d6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .container {
    padding: 16px 12px;
  }

  header h1 {
    font-size: 1.35rem;
  }

  .file-input-wrapper {
    flex-direction: column;
  }

  .file-input-wrapper input[type="file"] {
    width: 100%;
  }

  .btn {
    width: 100%;
  }

  .preview-header {
    flex-direction: column;
    align-items: stretch;
  }

  #previewFrame {
    min-height: 300px;
  }
}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Markdown 转 PDF</h1>
    <p>上传 Markdown 文件，在线预览并下载 PDF</p>
  </header>

  <div class="upload-section">
    <div class="file-input-wrapper">
      <input type="file" id="fileInput" accept=".md,.markdown" aria-label="选择 Markdown 文件">
      <button class="btn btn-primary" id="convertBtn" disabled>转换</button>
    </div>
  </div>

  <div class="error-area" id="errorArea" role="alert"></div>

  <div class="loading-overlay" id="loadingOverlay">
    <div class="spinner"></div>
    <div>正在转换，请稍候…</div>
  </div>

  <div class="preview-section" id="previewSection">
    <div class="preview-header">
      <h2>预览</h2>
      <button class="btn btn-success" id="downloadBtn">下载 PDF</button>
    </div>
    <iframe id="previewFrame" sandbox="allow-same-origin" title="HTML 预览"></iframe>
  </div>
</div>

<script>
(function() {
  const fileInput = document.getElementById('fileInput');
  const convertBtn = document.getElementById('convertBtn');
  const errorArea = document.getElementById('errorArea');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const previewSection = document.getElementById('previewSection');
  const previewFrame = document.getElementById('previewFrame');
  const downloadBtn = document.getElementById('downloadBtn');

  let convertedHTML = '';
  let currentFilename = '';

  fileInput.addEventListener('change', function() {
    convertBtn.disabled = !fileInput.files.length;
    hideError();
    previewSection.classList.remove('visible');
  });

  convertBtn.addEventListener('click', async function() {
    const file = fileInput.files[0];
    if (!file) return;

    currentFilename = file.name;
    hideError();
    previewSection.classList.remove('visible');
    setLoading(true);
    convertBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '转换失败（状态码: ' + res.status + '）');
      }

      convertedHTML = data.html;
      previewFrame.srcdoc = data.html;
      previewSection.classList.add('visible');
    } catch (err) {
      showError(err.message || '网络错误，请检查连接后重试');
    } finally {
      setLoading(false);
      convertBtn.disabled = !fileInput.files.length;
    }
  });

  downloadBtn.addEventListener('click', async function() {
    if (!convertedHTML) return;

    downloadBtn.disabled = true;
    hideError();

    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: convertedHTML,
          filename: currentFilename
        })
      });

      if (!res.ok) {
        let errMsg = '生成 PDF 失败（状态码: ' + res.status + '）';
        try {
          const data = await res.json();
          if (data.error) errMsg = data.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFilename.replace(/\\.(md|markdown)$/i, '') + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showError(err.message || '下载失败，请重试');
    } finally {
      downloadBtn.disabled = false;
    }
  });

  function showError(msg) {
    errorArea.textContent = msg;
    errorArea.classList.add('visible');
  }

  function hideError() {
    errorArea.textContent = '';
    errorArea.classList.remove('visible');
  }

  function setLoading(show) {
    loadingOverlay.classList.toggle('visible', show);
  }
})();
</script>
</body>
</html>`;
}
