import { Text, View } from '@react-pdf/renderer'
import React from 'react'

import { BRAND, s } from './pdf-constants'

export function parseSections(markdown: string) {
  const parts = markdown.split(/(?=^##\s)/m).filter((p) => p.trim())
  return parts.map((part) => {
    const lines = part.trim().split('\n')
    const rawTitle = lines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '') || ''
    const numMatch = rawTitle.match(/^(\d+)\.?\s*(.*)/)
    const num = numMatch ? numMatch[1] : null
    const title = numMatch ? numMatch[2] : rawTitle
    const body = lines.slice(1).join('\n').trim()
    return { num, title, body }
  })
}

export function renderInlineText(
  text: string,
  baseStyle: Record<string, string | number>,
  key: string | number
) {
  const stripped = text.replace(/\*\*/g, '')
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  const hasInlineBold = parts.length > 1

  if (!hasInlineBold) {
    return React.createElement(
      Text,
      { key, style: baseStyle as never },
      stripped
    )
  }

  const children = parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return React.createElement(
        Text,
        {
          key: `${key}-${j}`,
          style: { fontWeight: 'bold', color: BRAND.gray900 },
        },
        part.slice(2, -2)
      )
    }
    return part
  })

  return React.createElement(
    Text,
    { key, style: baseStyle as never },
    ...children
  )
}

export function formatBody(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      elements.push(
        React.createElement(
          Text,
          { key: `space-${i}`, style: { marginBottom: 6 } },
          ' '
        )
      )
      i++
      continue
    }

    if (trimmed.startsWith('---')) {
      elements.push(
        React.createElement(View, {
          key: `hr-${i}`,
          style: {
            borderBottomWidth: 0.5,
            borderBottomColor: BRAND.gray300,
            marginVertical: 8,
          },
        })
      )
      i++
      continue
    }

    if (trimmed.startsWith('### ')) {
      const title = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '')
      elements.push(
        React.createElement(
          Text,
          {
            key: `h3-${i}`,
            style: {
              fontSize: 9.5,
              fontWeight: 'bold',
              color: BRAND.navy,
              marginTop: 10,
              marginBottom: 4,
            },
          },
          title
        )
      )
      i++
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.replace(/^[-*]\s*/, '')
      elements.push(
        renderInlineText(
          `  •  ${content}`,
          { ...s.bodyText, marginLeft: 4 },
          `bullet-${i}`
        )
      )
      i++
      continue
    }

    const isFullBold =
      trimmed.startsWith('**') &&
      trimmed.endsWith('**') &&
      trimmed.indexOf('**', 2) === trimmed.length - 2
    if (isFullBold) {
      elements.push(
        React.createElement(
          Text,
          { key: `bold-${i}`, style: { ...s.boldLine, marginTop: 4 } },
          trimmed.slice(2, -2)
        )
      )
      i++
      continue
    }

    elements.push(renderInlineText(trimmed, s.bodyText, `line-${i}`))
    i++
  }

  return elements
}
