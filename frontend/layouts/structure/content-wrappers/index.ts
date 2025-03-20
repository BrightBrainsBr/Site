import ModalLayout from './modal-context'
import ModalLoading from './modal-loading'
import ModalNotMatch from './modal-not-match'
import ModalPage from './modal-page'
import ContentSingle from './single-layout'

const ContentWrappers = {
  Context: ModalLayout,
  Page: ModalPage,
  Single: ContentSingle,
  Loading: ModalLoading,
  NotMatch: ModalNotMatch,
}

export default ContentWrappers
