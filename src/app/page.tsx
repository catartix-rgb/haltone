import { Studio } from '@/components/Studio'

/**
 * The whole app lives inside a single client component (Studio).
 * Server rendering would force us to serialize ImageBitmaps and project
 * state across the wire — pointless for a tool that runs entirely on
 * the user's GPU/CPU. We keep this page lean and ship the studio as a
 * client island.
 */
export default function Page() {
  return <Studio />
}
