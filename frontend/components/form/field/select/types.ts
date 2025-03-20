export interface ISelectOption {
  id: string
  value: string | number
  label: string
}

export interface ISelectProps<Element extends HTMLElement = HTMLSelectElement>
  extends React.HTMLProps<Element> {
  name: string
  options: ISelectOption[]
  placeholder?: string
  containerClassName?: string
  label?: string
  required?: boolean
}
