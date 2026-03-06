export const BRAND = {
  navy: [10, 25, 47] as const,
  dark: [13, 27, 42] as const,
  lime: [197, 225, 85] as const,
  limeDark: [140, 170, 40] as const,
  white: [255, 255, 255] as const,
  gray50: [249, 250, 251] as const,
  gray100: [243, 244, 246] as const,
  gray200: [229, 231, 235] as const,
  gray300: [209, 213, 219] as const,
  gray400: [156, 163, 175] as const,
  gray500: [107, 114, 128] as const,
  gray700: [55, 65, 81] as const,
  gray900: [17, 24, 39] as const,
}

export const LOGO_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEcAAABGCAYAAACe7Im6AAAACXBIWXMAAAsSAAALEgHS3X78AAAEM0lEQVR4nO2cwXWjOhSGv+G8vbNmE3dApgCO3UH8KgipIH4VDKlgMh3gDjwVPPvQQKhgnA3r5wryFrr2YAxYSJpAMN852RB0kX/ElXSvpC/v7++4JM38O2AB3ABT4BXYAeswyP9zYH8B3IltxPZrGORrW9tlvrgSRyr9Atw23LYClm1FSjP/BljK36Tmtj3wEgZ53MZ2E07ESTM/AR40b98D8zDIXzVt3wEJEGja3wILF63UszWQZv4L+sKAevMb+dGXbN8AG/SFAZgBTj4xK3HSzJ8DTwZFJ8BafnwTa+o/oyZmaebHBuVOsG05iUXZW5QPqUSEn1nYX2qI34ixOFL5JeerQ9Twv1rhNJlcsH8Rm5azsHmwcNvge+4d2I9sCnctDqgxywk6zlqTIM38qWlhI3EcfVIHphXXrHxFici0oGnLiU0f2AHGjrm1ONJF2vQiH80Ew161lThp5kfAN5MHdcy9jOJb8ZfOTdIsY8wGfH3hQZxzFAb5TqdAozjieBcop2YyUu0bM+BXmvkrVJSgcZpxJo6oG6NEGYIgVTygWhLAT9RsflO+6cTnpJm/BH5J4aEKU+Ye+DfN/Jdyr3YURxzW9w+uWJ94QkUAjnhwDFS1CTsMlUBCMAB40pSS7urTO54OUw6PYTteU2L4Lc7IKQtQ4sy7rUcvmaSZP/UYP6k6ptYB9iHjoVIlI+fsPEoDnxEA3sIg33moLOXIKQmAJxOubZc16Rl7pMEcHHLE6HsORIdUsgcgwZ85o0CPxRjPsSuXxP41j5b/CYM8KV44GeeI//nxcfXpDdswyM86pqpB4DX2XknVxTNxdIPPA2NTdXGcPigqk35n4kjG4dqYV12sajnxH61GP4mrUsbl7EPC50r1umJCxVK5YvYh5rqD7LNyyriYffiMOXDXPBTXEh5azjWOber4dsw+yMoJVwuRhkIMY/ahjjH70MCYfbjAmH1owgPeOq6D9QaOP8TOQ+2H6pKun1/FMfuQdF2THpKAyj6sGbMPRc6yD0vG4PqBs+zDK2P2AS5kH+64zk8sA76Wsw8nS20P+SuJBkYMe9XXHhU7TurWI1cu0pYUzQaO4YwlwwmCvaEmlhe3cl9c3i+qrmWNcsznbknPbbZWa08fJOk15/M67ce2e85bza3EaUdtyvSE57Kz1aH1xFM+s1Xbch3yZnpKwTXs1ItNCxqJI11+ZvpQDfsbh7YS07I28RxXp47saq67CKX8tCnctThZw8KFjQP7VnU0Fkd6LtupRlNKKLa0vacrcQSbIxW2Tf5AWpTNQqro0gj4ElbiSOt5NCiaoZESCoN8idmwYeXiJCbrALu8/b/RHzlvUYcLab3VMMgj2gn0LGWscXks1WF7dUT1/CtDbTRNDO3PUZ9x3QEgKyB2uTLNmThF5KCO4nqXnatKy0s4OQjE5bioyP+lymHR/S+uawAAAABJRU5ErkJggg=='

export interface PdfInput {
  evaluationId: string
  formData: {
    nome?: string
    nascimento?: string
    cpf?: string
    sexo?: string
    publico?: string
    profissao?: string
    email?: string
  }
  scores: Record<string, number>
  reportMarkdown: string
}
