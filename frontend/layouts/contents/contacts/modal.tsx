import { ContentService } from '@futurebrand/helpers-nextjs/services'
import type { IModal } from '@futurebrand/types/contents'

import Layout from './layout'
import type { IContactsPageProps } from './types'

const ContactSingle: React.FC<IContactsPageProps> = async ({
  locale,
  params,
}) => {
  const service = new ContentService()
  const pageData = await service.single<IModal>({
    type: 'modals',
    locale,
    params,
  })

  return (
    <div
      className="px-6 py-12 sm:px-8 sm:py-10 md:p-10"
      style={{ maxWidth: '40rem' }}
    >
      <Layout pageData={pageData} isModalType={true} />
    </div>
  )
}

export default ContactSingle
