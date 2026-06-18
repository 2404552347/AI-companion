/**
 * 企业微信消息加解密
 *
 * 企业微信回调使用 AES-256-CBC 加密消息体。
 * 参考: https://developer.work.weixin.qq.com/document/path/90968
 */

import crypto from 'crypto'

/** 解密回调消息 */
export function decryptMsg(
  encrypted: string,
  encodingAESKey: string,
  corpId: string
): string {
  // AES key = Base64 decode of EncodingAESKey (43 chars) + "="
  const aesKey = Buffer.from(encodingAESKey + '=', 'base64')

  // IV = AES key 的前 16 字节
  const iv = aesKey.subarray(0, 16)

  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv)
  decipher.setAutoPadding(false)

  let decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ])

  // 去除 PKCS7 padding
  const padLen = decrypted[decrypted.length - 1]
  if (padLen > 0 && padLen <= 32) {
    decrypted = decrypted.subarray(0, decrypted.length - padLen)
  }

  // 格式: 16 字节 random + 4 字节 msg_len (network byte order) + msg + corpid
  const msgLen = decrypted.readUInt32BE(16)
  const message = decrypted.subarray(20, 20 + msgLen).toString('utf8')
  const receivedCorpId = decrypted.subarray(20 + msgLen).toString('utf8')

  if (receivedCorpId !== corpId) {
    throw new Error(`CorpId mismatch: expected ${corpId}, got ${receivedCorpId}`)
  }

  return message
}

/** 加密回复消息 */
export function encryptMsg(
  plaintext: string,
  encodingAESKey: string,
  corpId: string
): string {
  const aesKey = Buffer.from(encodingAESKey + '=', 'base64')
  const iv = aesKey.subarray(0, 16)

  // 16 字节随机 + 4 字节 msg_len + msg + corpid
  const random = crypto.randomBytes(16)
  const msgBuf = Buffer.from(plaintext, 'utf8')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(msgBuf.length, 0)
  const corpIdBuf = Buffer.from(corpId, 'utf8')

  let data = Buffer.concat([random, lenBuf, msgBuf, corpIdBuf])

  // PKCS7 padding
  const padLen = 32 - (data.length % 32)
  if (padLen > 0) {
    const padding = Buffer.alloc(padLen, padLen)
    data = Buffer.concat([data, padding])
  }

  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv)
  cipher.setAutoPadding(false)

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  return encrypted.toString('base64')
}

/** 验证签名 */
export function verifySignature(
  token: string,
  timestamp: string,
  nonce: string,
  encrypted: string,
  signature: string
): boolean {
  const sorted = [token, timestamp, nonce, encrypted].sort().join('')
  const expected = crypto.createHash('sha1').update(sorted).digest('hex')
  return expected === signature
}

/** 解析解密后的 XML 消息，提取关键字段 */
export function parseMessageXML(xml: string): {
  toUserName: string
  fromUserName: string
  createTime: string
  msgType: string
  content: string
  msgId: string
  agentId: string
} | null {
  const getTag = (tag: string) => {
    const m = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`))
    return m?.[1] ?? ''
  }
  const simple = (tag: string) => {
    const m = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`))
    return m?.[1] ?? ''
  }

  return {
    toUserName: getTag('ToUserName'),
    fromUserName: getTag('FromUserName'),
    createTime: simple('CreateTime'),
    msgType: getTag('MsgType'),
    content: getTag('Content'),
    msgId: getTag('MsgId'),
    agentId: getTag('AgentID'),
  }
}
