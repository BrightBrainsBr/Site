import type { ContentTypes } from '@futurebrand/types/contents'

import { getHelpersRouter } from '~/hooks/get-helpers-router'

interface ILiveRouteBody {
  type: ContentTypes
  locale: string
  params: Record<string, string>
}

export const revalidate = 300

export async function POST(request: Request) {
  const data: ILiveRouteBody = await request.json()

  const router = await getHelpersRouter()

  console.log('api', data)

  try {
    const url = router.getUrl(data.params, data.locale, data.type)

    return Response.json(
      {
        path: url,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate`,
        },
      }
    )
  } catch (error) {
    return new Response((error as Error).message, {
      status: 500,
    })
  }
}
