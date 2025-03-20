import { RichText } from '@futurebrand/components'
import type { IModalContent } from '@futurebrand/types/contents'
import { notFound } from 'next/navigation'

import Form from '~/components/form'

interface Props {
  pageData: IModalContent
  isModalType?: boolean
}

const ContactSingle: React.FC<Props> = ({ pageData }) => {
  const { form } = pageData

  if (!form) {
    notFound()
  }

  return (
    <>
      <div
        className="mb-5 flex flex-col gap-2 pr-5"
        style={{ minHeight: '40px' }}
      >
        {pageData.title && (
          <h1 className="text-3xl md:text-4xl leading-[1.1] font-extralight">
            {pageData.title}
          </h1>
        )}
        {pageData.description && <RichText html={pageData.description} />}
        <p className="text-sm">{pageData.requiredText}</p>
      </div>
      <Form
        form={form}
        formKey={`contact-${pageData.id}`}
        containerClassName="w-full"
        buttonPosition="center"
      />
    </>
  )
}

export default ContactSingle
