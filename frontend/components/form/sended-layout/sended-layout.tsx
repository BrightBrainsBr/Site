import { RichText } from '@futurebrand/components'
import { useFormOptions } from '@futurebrand/layouts'
import React, { useEffect } from 'react'
import { tv } from 'tailwind-variants'

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

const sendedClassVariant = tv({
  base: 'form-sended-layout absolute flex items-center top-0 left-0 w-full transition-[opacity,transform] duration-500 ease-out',
  variants: {
    isSended: {
      true: 'opacity-100 pointer-events-auto translate-y-0',
      false: 'opacity-0 pointer-events-none translate-y-10',
    },
  },
})

const SendedLayout: React.FC = () => {
  const { isSended, form } = useFormOptions()

  useEffect(() => {
    if (isSended) {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'Form Success',
        formName: form.name || 'Unknown Form',
      })
    }
  }, [isSended])

  return (
    <div
      style={{ padding: 'inherit' }}
      className={sendedClassVariant({ isSended })}
      aria-hidden={isSended}
    >
      <RichText html={form.afterSent.message} className="py-10" />
    </div>
  )
}

export default SendedLayout
