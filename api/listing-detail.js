import { fetchIs24Expose } from './_lib/is24.js'
import { fetchImmoweltExpose } from './_lib/immowelt.js'

export default async function handler(req, res) {
  const source = String(req.query.source || '').trim().toLowerCase()
  const id = String(req.query.id || '').trim()

  if (!source || !id) {
    return res.status(400).json({ error: 'source_and_id_required' })
  }

  try {
    if (source === 'is24') {
      const detail = await fetchIs24Expose(id)
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(200).json(detail)
    }

    if (source === 'immowelt') {
      const detail = await fetchImmoweltExpose(id)
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(200).json(detail)
    }

    return res.status(400).json({ error: 'unsupported_source', source })
  } catch (error) {
    return res.status(502).json({ error: 'listing_detail_failed', detail: String(error) })
  }
}
