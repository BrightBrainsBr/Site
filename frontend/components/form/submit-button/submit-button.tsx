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
        'flex flex-col col-span-full mt-3 md:mt-2 gap-3',
        buttonPosition === 'center' && 'md:items-center',
        buttonPosition === 'right' && 'md:items-end',
        buttonPosition === 'left' && 'md:items-start'
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
      <p className="text-sm text-midnight-950/70">
        Ao clicar você está consentindo o compartilhamento dos seus dados, de
        acordo com a Lei LGPD.
      </p>
    </div>
  )
}

export default SubmitButton
