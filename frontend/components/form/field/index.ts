import type { IFieldProps } from '@futurebrand/types/form'

import Check from './check'
import File from './file'
import Hidden from './hidden'
import Input from './input'
import Select from './select/dynamic'
import Textarea from './textarea'

const FIELDS: Record<string, React.ComponentType<IFieldProps<any, any>>> = {
  'forms.input-field': Input,
  'forms.textarea-field': Textarea,
  'forms.select-field': Select,
  'forms.check-field': Check,
  'forms.hidden-field': Hidden,
  'forms.file-field': File,
}

export default FIELDS
