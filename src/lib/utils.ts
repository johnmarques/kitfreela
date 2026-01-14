import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte qualquer URL do YouTube para formato embed.
 * Aceita:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID (retorna como está)
 *
 * @param url URL do YouTube em qualquer formato
 * @returns URL no formato embed ou null se inválida
 */
export function youtubeToEmbed(url: string): string | null {
  if (!url || typeof url !== 'string') return null

  const trimmedUrl = url.trim()
  if (!trimmedUrl) return null

  // Regex para extrair o video ID de diferentes formatos
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID ou youtube.com/watch?v=VIDEO_ID&...
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern)
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }

  return null
}

/**
 * Converte número de telefone ou link do WhatsApp para formato wa.me.
 * Aceita:
 * - Número: 5511999999999, (55) 11 99999-9999, +55 11 99999-9999
 * - Link: https://wa.me/5511999999999, https://api.whatsapp.com/send?phone=...
 *
 * @param input Número ou link do WhatsApp
 * @returns Link no formato https://wa.me/... ou null se inválido
 */
export function whatsappToLink(input: string): string | null {
  if (!input || typeof input !== 'string') return null

  const trimmedInput = input.trim()
  if (!trimmedInput) return null

  // Se já é um link wa.me, extrair o número e normalizar
  const waMeMatch = trimmedInput.match(/wa\.me\/(\d+)/)
  if (waMeMatch && waMeMatch[1]) {
    return `https://wa.me/${waMeMatch[1]}`
  }

  // Se é um link api.whatsapp.com, extrair o número
  const apiMatch = trimmedInput.match(/api\.whatsapp\.com\/send\?phone=(\d+)/)
  if (apiMatch && apiMatch[1]) {
    return `https://wa.me/${apiMatch[1]}`
  }

  // Remove todos os caracteres não numéricos para obter apenas os dígitos
  const digits = trimmedInput.replace(/\D/g, '')

  // Valida se tem pelo menos 10 dígitos (DDD + número)
  if (digits.length >= 10) {
    return `https://wa.me/${digits}`
  }

  return null
}
