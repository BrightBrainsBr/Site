import { StyleSheet } from '@react-pdf/renderer'

export const BRAND = {
  navy: '#0a192f',
  dark: '#0d1b2a',
  teal: '#0fb8b8',
  lime: '#c5e155',
  limeLight: '#e8f5a3',
  gold: '#f0c040',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
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

export const s = StyleSheet.create({
  page: {
    fontSize: 9,
    color: BRAND.gray700,
    paddingBottom: 60,
  },
  headerBar: {
    backgroundColor: BRAND.navy,
    paddingVertical: 20,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerTitleGroup: {},
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.white,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 7.5,
    color: BRAND.teal,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerRight: {},
  badge: {
    backgroundColor: '#2d3a4a',
    borderWidth: 1,
    borderColor: BRAND.gold,
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 6.5,
    color: BRAND.gold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  accentLine: {
    height: 3,
    backgroundColor: BRAND.teal,
  },
  content: {
    paddingHorizontal: 40,
    paddingTop: 16,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 8,
    color: BRAND.gray500,
    textAlign: 'center',
    marginBottom: 14,
  },
  patientBox: {
    backgroundColor: BRAND.gray100,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.teal,
  },
  patientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patientCell: {
    width: '50%',
    marginBottom: 4,
  },
  patientLabel: {
    fontSize: 7,
    color: BRAND.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientValue: {
    fontSize: 9,
    color: BRAND.gray900,
    fontWeight: 'bold',
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND.teal,
    paddingBottom: 4,
  },
  sectionNumber: {
    backgroundColor: BRAND.teal,
    color: BRAND.white,
    fontSize: 8,
    fontWeight: 'bold',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 8,
  },
  sectionTitleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND.navy,
    flex: 1,
  },
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.6,
    color: BRAND.gray700,
  },
  boldLine: {
    fontSize: 8.5,
    lineHeight: 1.6,
    color: BRAND.gray900,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerAccent: {
    height: 2,
    backgroundColor: BRAND.teal,
  },
  footerContent: {
    backgroundColor: BRAND.navy,
    paddingVertical: 8,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 6.5,
    color: '#8899aa',
  },
  footerRight: {
    fontSize: 6.5,
    color: BRAND.gold,
  },
  disclaimer: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 4,
    padding: 10,
    marginTop: 14,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 3,
  },
  disclaimerText: {
    fontSize: 7,
    color: '#78350f',
    lineHeight: 1.5,
  },
})
