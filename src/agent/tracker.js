#!/usr/bin/env node

/**
 * AI Companion — 本地活动追踪代理 v2
 *
 * 优化:
 * - C 原生空闲检测（无 PyObjC 依赖）
 * - 单次 poll 同时获取应用+空闲
 * - 连续使用追踪（非仅切换时记录）
 * - 自动重启 + PID 文件
 * - 指数退避重试
 * - 浏览器 URL 低频采样（避免过多 AppleScript 调用）
 *
 * 编译 C helper: gcc -O2 -o src/agent/idle_helper src/agent/idle.c -framework CoreGraphics -framework Foundation
 *
 * 启动: node src/agent/tracker.js
 * 守护进程: node src/agent/tracker.js --daemon
 */

const { execSync, spawn, execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

// ============================================================
// 配置
// ============================================================
const SCRIPT_DIR = __dirname
const CONFIG = {
  apiUrl: process.env.AI_COMPANION_API_URL || 'http://localhost:3000/api/v1/activity',
  token: process.env.AI_COMPANION_TOKEN || '',
  userId: process.env.AI_COMPANION_USER_ID || 'ee851f6c-0403-4f32-a93d-89af108b2d77',
  pollIntervalMs: 5000,
  batchIntervalMs: 60000,
  heartbeatIntervalMs: 30000,   // 每30秒在同一应用内记录心跳
  idleThresholdSec: 120,        // 2分钟无操作 → 空闲
  urlCheckIntervalMs: 30000,    // 每30秒检查一次浏览器URL
  maxRetries: 5,
  retryBaseMs: 10000,
  pidFile: path.join(os.homedir(), '.ai-companion', 'tracker.pid'),
  dataDir: path.join(os.homedir(), '.ai-companion'),
  idleHelperPath: path.join(SCRIPT_DIR, 'idle_helper'),
}

// ============================================================
// 应用分类映射（同上，省略重复）
// ============================================================
const APP_CATEGORIES = {
  'Code': 'coding', 'VS Code': 'coding', 'Visual Studio Code': 'coding',
  'IntelliJ IDEA': 'coding', 'WebStorm': 'coding', 'PyCharm': 'coding',
  'Xcode': 'coding', 'Terminal': 'coding', 'iTerm': 'coding', 'iTerm2': 'coding',
  'Warp': 'coding', 'Cursor': 'coding', 'Zed': 'coding', 'Sublime Text': 'coding',
  'Vim': 'coding', 'Neovim': 'coding', 'Android Studio': 'coding',
  'Notion': 'learning', 'Obsidian': 'learning', 'Typora': 'learning',
  'Bear': 'learning', 'Ulysses': 'learning', 'Duolingo': 'learning',
  'Anki': 'learning', 'Kindle': 'learning', 'Books': 'learning',
  'PDF Expert': 'learning', 'Zotero': 'learning',
  'Word': 'productive', 'Pages': 'productive', 'Excel': 'productive',
  'Numbers': 'productive', 'Keynote': 'productive',
  'Figma': 'productive', 'Sketch': 'productive', 'Photoshop': 'productive',
  'Illustrator': 'productive', 'Canva': 'productive',
  'Google Chrome': 'browsing', 'Chrome': 'browsing', 'Safari': 'browsing',
  'Firefox': 'browsing', 'Arc': 'browsing', 'Edge': 'browsing', 'Brave': 'browsing',
  '微信': 'communication', 'WeChat': 'communication', 'Slack': 'communication',
  'Discord': 'communication', 'Telegram': 'communication',
  '钉钉': 'communication', '飞书': 'communication',
  'Mail': 'communication', 'Outlook': 'communication',
  'Netflix': 'entertainment', 'Bilibili': 'entertainment', 'Steam': 'entertainment',
  'Spotify': 'entertainment', 'Apple Music': 'entertainment',
  'NetEaseMusic': 'entertainment', 'QQMusic': 'entertainment',
  'IINA': 'entertainment', 'VLC': 'entertainment',
  'Finder': 'other', 'System Settings': 'other', 'System Preferences': 'other',
}

function isProductive(appName, category) {
  if (['coding', 'productive', 'learning'].includes(category)) return true
  if (['entertainment'].includes(category)) return false
  return null
}

function classifyApp(appName) {
  if (APP_CATEGORIES[appName]) return APP_CATEGORIES[appName]
  const lower = appName.toLowerCase()
  if (lower.includes('code') || lower.includes('editor') || lower.includes('ide') || lower.includes('terminal')) return 'coding'
  if (lower.includes('note') || lower.includes('write') || lower.includes('doc')) return 'learning'
  if (lower.includes('chat') || lower.includes('message') || lower.includes('slack')) return 'communication'
  if (lower.includes('music') || lower.includes('video') || lower.includes('game')) return 'entertainment'
  return 'other'
}

// ============================================================
// 数据采集（优化：单次 AppleScript + C helper）
// ============================================================

// 缓存 AppleScript 为文件以加速执行
const APPLESCRIPT_FILE = path.join(CONFIG.dataDir, 'get_active_app.scpt')
function ensureAppleScript() {
  if (fs.existsSync(APPLESCRIPT_FILE)) return
  const script = `
tell application "System Events"
  set frontApp to first application process whose frontmost is true
  set appName to name of frontApp
  set bundleId to bundle identifier of frontApp
  try
    set winTitle to name of front window of frontApp
  on error
    set winTitle to ""
  end try
  return appName & "|||" & bundleId & "|||" & winTitle
end tell
`.trim()
  fs.writeFileSync(APPLESCRIPT_FILE, script)
}

function getActiveApp() {
  try {
    ensureAppleScript()
    const output = execFileSync('osascript', [APPLESCRIPT_FILE], {
      encoding: 'utf8', timeout: 3000,
    }).trim()
    const [appName, bundleId, windowTitle] = output.split('|||')
    return {
      app_name: appName || 'Unknown',
      app_bundle: bundleId || '',
      window_title: windowTitle || '',
      category: classifyApp(appName),
    }
  } catch {
    return null
  }
}

// 使用编译好的 C helper 获取空闲时间（fallback: ioreg 估算）
function getIdleAndScore() {
  // 优先使用 C helper
  if (fs.existsSync(CONFIG.idleHelperPath)) {
    try {
      const output = execFileSync(CONFIG.idleHelperPath, [], { encoding: 'utf8', timeout: 2000 }).trim()
      const [sec, score] = output.split(' ').map(Number)
      return { idleSec: Math.round(sec), score: score || 50 }
    } catch {}
  }

  // Fallback: 使用 ioreg 粗略估算（检查 HID 空闲）
  try {
    const output = execSync(
      `ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print int($NF/1000000000)}'`,
      { encoding: 'utf8', timeout: 2000 }
    ).trim()
    const idleSec = parseInt(output) || 0
    let score = 50
    if (idleSec < 5) score = 100
    else if (idleSec < 30) score = 80
    else if (idleSec < 60) score = 60
    else if (idleSec < 120) score = 40
    else if (idleSec < 300) score = 20
    else score = 5
    return { idleSec, score }
  } catch {
    return { idleSec: 0, score: 50 }
  }
}

// 浏览器 URL 检测（低频）
function getBrowserURL(appName) {
  if (!['Google Chrome', 'Chrome', 'Safari', 'Arc', 'Edge', 'Brave'].includes(appName)) return null
  try {
    const app = appName === 'Safari' ? 'Safari' : `"${appName}"`
    const prop = appName === 'Safari'
      ? 'URL of front document'
      : 'URL of active tab of front window'
    const cmd = `osascript -e 'tell application ${app} to return ${prop}' 2>/dev/null`
    const output = execSync(cmd, { encoding: 'utf8', timeout: 2000, shell: true }).trim()
    return output || null
  } catch {
    return null
  }
}

// ============================================================
// 状态机
// ============================================================

let activityBatch = []
let current = null          // { app_name, category, window_title, url, started_at, ... }
let currentStartedAt = null // ISO timestamp
let lastSendTime = Date.now()
let lastHeartbeat = Date.now()
let lastUrlCheck = Date.now()
let lastUrl = null
let retryCount = 0
let isRunning = true

// ============================================================
// 批处理发送（指数退避重试）
// ============================================================

async function sendBatch() {
  if (activityBatch.length === 0) return

  const batch = [...activityBatch]
  activityBatch = []

  // 本地备份
  const backupPath = path.join(CONFIG.dataDir, 'activity-backup.json')
  try {
    if (!fs.existsSync(CONFIG.dataDir)) fs.mkdirSync(CONFIG.dataDir, { recursive: true })
    let existing = []
    if (fs.existsSync(backupPath)) {
      try { existing = JSON.parse(fs.readFileSync(backupPath, 'utf8')) } catch {}
    }
    existing.push(...batch)
    if (existing.length > 2000) existing = existing.slice(-2000)
    fs.writeFileSync(backupPath, JSON.stringify(existing))
  } catch {}

  if (!CONFIG.token) {
    log('⚠️  未设置 token，跳过发送', 'warn')
    return
  }

  try {
    const res = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.token}`,
      },
      body: JSON.stringify({
        activities: batch,
        user_id: CONFIG.userId,
        device_info: { hostname: os.hostname(), platform: os.platform(), arch: os.arch() },
      }),
    })

    if (res.ok) {
      retryCount = 0
      log(`✅ 已发送 ${batch.length} 条`, 'ok')
    } else if (res.status === 401) {
      log('🔒 Token 无效，请重新设置 AI_COMPANION_TOKEN', 'error')
      activityBatch.unshift(...batch)
    } else {
      activityBatch.unshift(...batch)
      retryCount++
      const delay = Math.min(CONFIG.retryBaseMs * Math.pow(2, retryCount - 1), 300000)
      log(`⚠️  发送失败 (${res.status})，${Math.round(delay / 1000)}s后重试`, 'warn')
      isRunning = false
      setTimeout(() => { isRunning = true; tick() }, delay)
    }
  } catch (err) {
    activityBatch.unshift(...batch)
    retryCount++
    const delay = Math.min(CONFIG.retryBaseMs * Math.pow(2, retryCount - 1), 300000)
    log(`⚠️  网络错误，${Math.round(delay / 1000)}s后重试`, 'warn')
    isRunning = false
    setTimeout(() => { isRunning = true; tick() }, delay)
  }
}

// ============================================================
// 记录活动片段
// ============================================================

function flushCurrentActivity(endedAt, reason) {
  if (!current || !currentStartedAt) return null
  const startMs = new Date(currentStartedAt).getTime()
  const endMs = new Date(endedAt).getTime()
  const durationSec = Math.round((endMs - startMs) / 1000)
  if (durationSec < 3) return null // 忽略 <3秒的片段

  const entry = {
    ...current,
    duration_sec: durationSec,
    started_at: currentStartedAt,
    ended_at: endedAt,
    metadata: { ...(current.metadata || {}), flush_reason: reason },
  }
  activityBatch.push(entry)
  return entry
}

// ============================================================
// 主循环
// ============================================================

let symbols = { ok: '✅', warn: '⚠️', error: '❌', info: '📊', idle: '💤', app: '🖥️' }
function log(msg, level = 'info') {
  const ts = new Date().toISOString().split('T')[1].split('.')[0]
  const prefix = symbols[level] || '  '
  // 减少日志噪音
  if (level === 'info') return
  console.log(`[${ts}] ${prefix} ${msg}`)
}

async function poll() {
  const now = Date.now()
  const nowISO = new Date().toISOString()

  // 获取应用和空闲状态（并行思想，但 AppleScript 和 C helper 都很快）
  const app = getActiveApp()
  const { idleSec, score } = getIdleAndScore()
  const isIdle = idleSec > CONFIG.idleThresholdSec

  // --- 状态转换 ---
  if (isIdle) {
    // 进入空闲
    if (current && current.activity_type !== 'idle') {
      flushCurrentActivity(nowISO, 'idle')
      log(`💤 进入空闲 (${idleSec}s)`, 'idle')
    }
    current = {
      activity_type: 'idle',
      app_name: null, app_bundle: null, window_title: null, url: null,
      activity_score: score,
      is_productive: false, category: 'idle',
      metadata: { idle_sec: idleSec },
    }
    currentStartedAt = nowISO
  } else if (app) {
    const category = classifyApp(app.app_name)
    const productive = isProductive(app.app_name, category)

    // 检查是否需要检查 URL
    let url = current?.url || lastUrl
    if (category === 'browsing' && (now - lastUrlCheck > CONFIG.urlCheckIntervalMs || !url)) {
      url = getBrowserURL(app.app_name)
      lastUrl = url
      lastUrlCheck = now
    }

    if (!current || current.app_name !== app.app_name || current.window_title !== app.window_title) {
      // 应用或窗口切换
      flushCurrentActivity(nowISO, current ? 'switch' : 'start')

      current = {
        activity_type: 'app_usage',
        app_name: app.app_name, app_bundle: app.app_bundle,
        window_title: app.window_title, url,
        activity_score: score,
        is_productive: productive, category,
        metadata: { idle_sec: idleSec, browser_url: url },
      }
      currentStartedAt = nowISO

      if (app.app_name !== 'Unknown') {
        const prodIcon = productive === true ? '💻' : productive === false ? '🎮' : '🌐'
        const title = app.window_title ? ` — ${app.window_title.slice(0, 40)}` : ''
        log(`${prodIcon} ${app.app_name}${title}`, 'app')
      }
    } else {
      // 同一应用，更新活跃度和窗口标题
      current.activity_score = Math.round((current.activity_score + score) / 2)
      if (app.window_title !== current.window_title) {
        current.window_title = app.window_title
      }
      if (url && url !== current.url) {
        current.url = url
        current.metadata.browser_url = url
      }
    }
  }

  // --- 定时发送 ---
  if (now - lastSendTime >= CONFIG.batchIntervalMs) {
    flushCurrentActivity(nowISO, 'batch')
    await sendBatch()
    lastSendTime = now
    currentStartedAt = nowISO
  }

  // --- 心跳记录（同一应用内持续使用） ---
  if (current && current.activity_type !== 'idle' && (now - lastHeartbeat >= CONFIG.heartbeatIntervalMs)) {
    flushCurrentActivity(nowISO, 'heartbeat')
    currentStartedAt = nowISO
    lastHeartbeat = now
  }
}

async function tick() {
  if (!isRunning) return
  try {
    await poll()
  } catch (err) {
    log(`轮询错误: ${err.message}`, 'error')
  }
  setTimeout(tick, CONFIG.pollIntervalMs)
}

// ============================================================
// 守护进程 + PID 管理
// ============================================================

function writePid() {
  try {
    if (!fs.existsSync(CONFIG.dataDir)) fs.mkdirSync(CONFIG.dataDir, { recursive: true })
    fs.writeFileSync(CONFIG.pidFile, String(process.pid))
  } catch {}
}

function cleanPid() {
  try { if (fs.existsSync(CONFIG.pidFile)) fs.unlinkSync(CONFIG.pidFile) } catch {}
}

function isAlreadyRunning() {
  try {
    if (!fs.existsSync(CONFIG.pidFile)) return false
    const pid = parseInt(fs.readFileSync(CONFIG.pidFile, 'utf8'))
    try { process.kill(pid, 0); return true } catch { return false }
  } catch { return false }
}

// ============================================================
// 启动
// ============================================================

if (process.argv.includes('--stop')) {
  if (isAlreadyRunning()) {
    const pid = parseInt(fs.readFileSync(CONFIG.pidFile, 'utf8'))
    process.kill(pid, 'SIGTERM')
    console.log('🛑 已发送停止信号')
  } else {
    console.log('⚠️  代理未在运行')
  }
  process.exit(0)
}

if (process.argv.includes('--status')) {
  if (isAlreadyRunning()) {
    const pid = parseInt(fs.readFileSync(CONFIG.pidFile, 'utf8'))
    console.log(`✅ 代理运行中 (PID: ${pid})`)
  } else {
    console.log('⚪ 代理未运行')
  }
  process.exit(0)
}

if (isAlreadyRunning()) {
  console.log('⚠️  代理已在运行中。使用 --stop 停止，或 --status 查看状态')
  process.exit(1)
}

// 信号处理
process.on('SIGINT', async () => {
  log('🛑 收到 SIGINT，正在退出...', 'warn')
  isRunning = false
  const nowISO = new Date().toISOString()
  flushCurrentActivity(nowISO, 'shutdown')
  if (activityBatch.length > 0) await sendBatch()
  cleanPid()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  isRunning = false
  const nowISO = new Date().toISOString()
  flushCurrentActivity(nowISO, 'shutdown')
  if (activityBatch.length > 0) await sendBatch()
  cleanPid()
  process.exit(0)
})

process.on('uncaughtException', async (err) => {
  log(`未捕获异常: ${err.message}`, 'error')
  isRunning = false
  const nowISO = new Date().toISOString()
  flushCurrentActivity(nowISO, 'crash')
  if (activityBatch.length > 0) await sendBatch()
  cleanPid()
  process.exit(1)
})

writePid()

console.log('')
console.log('🤖 AI Companion — 活动追踪代理 v2')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`📡 API:     ${CONFIG.apiUrl}`)
console.log(`⏱️  采样:    ${CONFIG.pollIntervalMs / 1000}s`)
console.log(`📦 发送:    ${CONFIG.batchIntervalMs / 1000}s`)
console.log(`💓 心跳:    ${CONFIG.heartbeatIntervalMs / 1000}s`)
console.log(`💤 空闲阈值: ${CONFIG.idleThresholdSec}s`)
console.log(`🆔 PID:     ${process.pid}`)
console.log(`🔧 空闲检测: ${fs.existsSync(CONFIG.idleHelperPath) ? 'C helper ✓' : 'ioreg (编译 C helper 以提升性能)'}`)
console.log(`💾 数据目录: ${CONFIG.dataDir}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (!CONFIG.token) console.log('⚠️  未设置 AI_COMPANION_TOKEN')
console.log('')

console.log('✅ 追踪代理已启动')
tick()
