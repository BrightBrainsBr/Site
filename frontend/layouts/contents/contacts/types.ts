import { type IModal } from '@futurebrand/types/contents'

export interface IContactsPageProps {
  params: Record<string, string>
  locale: string
  previewData?: IModal
}
