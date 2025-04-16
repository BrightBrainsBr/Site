'use client'

import { useField } from '@futurebrand/layouts/form'
import type { IFieldProps } from '@futurebrand/types/form'
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { twMerge } from 'tailwind-merge'
import { tv } from 'tailwind-variants'

import { ReactComponent as Icon } from '~/assets/icons/attachment.svg'
import { uploadFileAction } from '~/services/file'

import InputErrorMessage from '../../error-message'

const inputClassVariant = tv({
  slots: {
    container: 'form-field file',
    input: 'h-full w-full',
  },
  variants: {
    hasError: {
      true: {
        input: '!border-error',
      },
    },
  },
})

const File: React.FC<IFieldProps> = ({
  id,
  // className,
  name,
  containerClassName,
  label,
  required,
  // type,
  // fieldData,
  placeholder,
  ...rest
}) => {
  const [fileName, setFileName] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const { field, error, setValue } = useField(name)

  const classNames = inputClassVariant({
    hasError: !!error,
  })

  const onUploadFile = useCallback(
    async (file: File) => {
      if (isLoading) {
        return
      }

      setIsLoading(true)

      try {
        const data = new FormData()

        data.append('files', file)

        const url = await uploadFileAction(data)

        if (!url) {
          throw new Error('No URL returned')
        }

        setValue(url)
        setHasLoaded(true)
      } catch (error) {
        console.error(error)
        setHasLoaded(false)
        setFileName('')
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return
      }

      const file = acceptedFiles[0]

      setFileName(file.name)
      void onUploadFile(file)
    },
    [onUploadFile]
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
    },
    multiple: false,
  })

  return (
    <fieldset
      {...getRootProps()}
      className={classNames.container({ className: containerClassName })}
    >
      <legend>
        {label && (
          <label htmlFor={id} className="legend-label">
            {label}
            {required && ' *'}
          </label>
        )}
      </legend>
      <div className="file-container">
        <input
          {...rest}
          {...field}
          type="hidden"
          required={required}
          name={name}
        />
        <div className={twMerge('file-dropzone', hasLoaded && 'loaded')}>
          <input id={id} {...getInputProps()} />
          <Icon />
          <p>{fileName || placeholder}</p>
          <div
            className={twMerge(
              'submit-loading',
              isLoading ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>
      </div>
      {error && <InputErrorMessage message={error} />}
    </fieldset>
  )
}

export default File
