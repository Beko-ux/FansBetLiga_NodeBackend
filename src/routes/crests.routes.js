// import { Router } from 'express';
// import axios from 'axios';

// const r = Router();

// // /api/crests/86.png  ou /api/crests/760.svg
// r.get('/:filename', async (req, res) => {
//   try {
//     const { filename } = req.params;
//     if (!/^[0-9a-zA-Z._-]+$/.test(filename)) {
//       return res.status(400).json({ error: 'Bad filename' });
//     }
//     const upstream = `https://crests.football-data.org/${filename}`;
//     const upstreamRes = await axios.get(upstream, { responseType: 'arraybuffer' });

//     const contentType = upstreamRes.headers['content-type'] ||
//       (filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png');

//     res.setHeader('Content-Type', contentType);
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

//     return res.status(200).send(Buffer.from(upstreamRes.data));
//   } catch {
//     const onePx = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
//     res.setHeader('Content-Type', 'image/gif');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cache-Control', 'no-store');
//     return res.status(200).send(onePx);
//   }
// });

// // /api/crests?u=https://crests.football-data.org/86.png
// r.get('/', async (req, res) => {
//   try {
//     const { u } = req.query;
//     if (!u) return res.status(400).json({ error: 'Missing ?u=' });

//     const url = new URL(u);
//     if (url.hostname !== 'crests.football-data.org') {
//       return res.status(400).json({ error: 'Host not allowed' });
//     }

//     const upstreamRes = await axios.get(u, { responseType: 'arraybuffer' });
//     const contentType = upstreamRes.headers['content-type'] || 'image/png';

//     res.setHeader('Content-Type', contentType);
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

//     return res.status(200).send(Buffer.from(upstreamRes.data));
//   } catch {
//     const onePx = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
//     res.setHeader('Content-Type', 'image/gif');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cache-Control', 'no-store');
//     return res.status(200).send(onePx);
//   }
// });

// export default r;








import { Router } from 'express';
import axios from 'axios';

const r = Router();

// /api/crests/86.png  ou /api/crests/760.svg
r.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (!/^[0-9a-zA-Z._-]+$/.test(filename)) {
      return res.status(400).json({ error: 'Bad filename' });
    }
    const upstream = `https://crests.football-data.org/${filename}`;
    const upstreamRes = await axios.get(upstream, { responseType: 'arraybuffer' });

    const contentType =
      upstreamRes.headers['content-type'] ||
      (filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    return res.status(200).send(Buffer.from(upstreamRes.data));
  } catch {
    const onePx = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(onePx);
  }
});

// /api/crests?u=https://crests.football-data.org/86.png
r.get('/', async (req, res) => {
  try {
    const { u } = req.query;
    if (!u) return res.status(400).json({ error: 'Missing ?u=' });

    const url = new URL(u);
    if (url.hostname !== 'crests.football-data.org') {
      return res.status(400).json({ error: 'Host not allowed' });
    }

    const upstreamRes = await axios.get(u, { responseType: 'arraybuffer' });
    const contentType = upstreamRes.headers['content-type'] || 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    return res.status(200).send(Buffer.from(upstreamRes.data));
  } catch {
    const onePx = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(onePx);
  }
});

export default r;
