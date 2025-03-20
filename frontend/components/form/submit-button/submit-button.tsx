import { useFormOptions } from '@futurebrand/layouts/form'
import React from 'react'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

import CMSButton from '~/components/button/cms'

const submitClassNames = tv({
  slots: {
    button: 'relative transition-all w-full sm:w-auto',
    spin: 'submit-loading',
  },
  variants: {
    isSending: {
      true: {
        button: 'pr-12',
      },
      false: {
        spin: 'opacity-0',
      },
    },
  },
})

const SubmitButton: React.FC = () => {
  const { buttonPosition, isSending, isSended, isHidden, form } =
    useFormOptions()

  const classNames = submitClassNames({ isSending })

  return (
    <div
      className={twMerge(
        'flex col-span-full mt-3 md:mt-2',
        buttonPosition === 'center' && 'md:justify-center',
        buttonPosition === 'right' && 'md:justify-right',
        buttonPosition === 'left' && 'md:justify-left'
      )}
    >
      <CMSButton
        component="button"
        type="submit"
        disabled={isSended || isSending}
        tabIndex={isHidden ? -1 : 0}
        attributes={form.sendButton}
        className={classNames.button()}
      >
        <div className={classNames.spin()} />
      </CMSButton>
    </div>
  )
}

export default SubmitButton
