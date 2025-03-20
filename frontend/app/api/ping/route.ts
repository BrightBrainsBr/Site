import { getHelpersRouter } from '~/hooks/get-helpers-router'

export const fetchCache = 'force-no-store'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  await getHelpersRouter()
  return new Response('PONG', {
    status: 200,
  })
}
