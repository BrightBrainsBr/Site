export interface IValidationError {
  target: string
  message: string
}

export interface IFormResponse {
  success: boolean
  error?: {
    validations: IValidationError[]
    message: string
    details: any
  }
}
