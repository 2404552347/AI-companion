/**
 * GET /api/v1/wecom/test-verify
 *
 * 诊断端点——模拟企业微信回调验证，确认加解密配置正确。
 */

import { NextResponse } from 'next/server'
import { decryptMsg, verifySignature } from '@/lib/wecom/crypto'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const token = process.env.WECOM_TOKEN ?? ''
  const encodingAESKey = process.env.WECOM_ENCODING_AES_KEY ?? ''
  const corpId = process.env.WECOM_CORP_ID ?? ''

  if (!token || !encodingAESKey || !corpId) {
    return NextResponse.json({
      ok: false,
      error: 'missing env vars',
      has_token: !!token,
      has_aes_key: !!encodingAESKey,
      has_corp_id: !!corpId,
      aes_key_len: encodingAESKey.length,
    })
  }

  try {
    // 1. 模拟加密（跟 WeCom 一样的逻辑）
    const aesKey = Buffer.from(encodingAESKey + '=', 'base64')
    if (aesKey.length !== 32) {
      return NextResponse.json({
        ok: false,
        error: `AES key wrong length: ${aesKey.length} (expected 32)`,
        aes_key_base64_len: encodingAESKey.length,
      })
    }

    const iv = aesKey.subarray(0, 16)
    const random = crypto.randomBytes(16)
    const plaintext = 'test1234567890'
    const msgBuf = Buffer.from(plaintext, 'utf8')
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32BE(msgBuf.length, 0)
    const corpIdBuf = Buffer.from(corpId, 'utf8')

    let data = Buffer.concat([random, lenBuf, msgBuf, corpIdBuf])
    const padLen = 32 - (data.length % 32)
    if (padLen > 0) data = Buffer.concat([data, Buffer.alloc(padLen, padLen)])

    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv)
    cipher.setAutoPadding(false)
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
    const echostr = encrypted.toString('base64')

    // 2. 生成签名
    const timestamp = String(Math.floor(Date.now() / 1000))
    const nonce = 'diagnose123'
    const signature = crypto.createHash('sha1')
      .update([token, timestamp, nonce, echostr].sort().join(''))
      .digest('hex')

    // 3. 验证签名（模拟我们自己的验证逻辑）
    const sigVerified = verifySignature(token, timestamp, nonce, echostr, signature)

    // 4. 解密
    const decrypted = decryptMsg(echostr, encodingAESKey, corpId)

    const success = decrypted === plaintext && sigVerified

    return NextResponse.json({
      ok: success,
      sig_verified: sigVerified,
      decrypted: success ? plaintext : `mismatch: got "${decrypted.slice(0, 20)}..."`,
      expected: plaintext,
      env: {
        corp_id_ok: corpId === 'wwe92dcb37e30f0478',
        corp_id_len: corpId.length,
        aes_key_len: encodingAESKey.length,
        token_len: token.length,
      },
      echostr_sample: echostr.slice(0, 30) + '...',
      signature_sample: signature.slice(0, 20) + '...',
    })
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
