import React from 'react'

/**
 * Renders a JSON-LD <script> tag for structured data.
 * Accepts any Schema.org object and serializes it safely.
 */
interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}

export default JsonLd
