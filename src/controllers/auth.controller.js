// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { z } from 'zod';
// import { prisma } from '../prisma.js';
// import { zodToLaravelErrors } from '../utils/validation.js';

// const RegisterSchema = z.object({
//   name: z.string().min(1).max(255),
//   email: z.string().email().max(255),
//   password: z.string().min(6),
//   password_confirmation: z.string()
// }).refine((d) => d.password === d.password_confirmation, {
//   path: ['password'],
//   message: 'The password confirmation does not match.'
// });

// const LoginSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(1)
// });

// export async function register(req, res) {
//   const parsed = RegisterSchema.safeParse(req.body);
//   if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

//   const { name, email, password } = parsed.data;

//   const exists = await prisma.user.findUnique({ where: { email } });
//   if (exists) {
//     return res.status(422).json({ errors: { email: ['The email has already been taken.'] } });
//   }

//   const hash = await bcrypt.hash(password, 10);
//   const user = await prisma.user.create({ data: { name, email, password: hash } });

//   const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

//   return res.status(201).json({
//     user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
//     token
//   });
// }

// export async function login(req, res) {
//   const parsed = LoginSchema.safeParse(req.body);
//   if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

//   const { email, password } = parsed.data;
//   const user = await prisma.user.findUnique({ where: { email } });

//   if (!user || !(await bcrypt.compare(password, user.password))) {
//     // Même message/clé que ton ValidationException Laravel
//     return res.status(422).json({ errors: { email: ['Les identifiants sont incorrects.'] } });
//   }

//   const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

//   return res.json({
//     user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
//     token
//   });
// }




// controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import axios from 'axios';
import { prisma } from '../prisma.js';
import { zodToLaravelErrors } from '../utils/validation.js';

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6),
  password_confirmation: z.string()
}).refine((d) => d.password === d.password_confirmation, {
  path: ['password'],
  message: 'The password confirmation does not match.'
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function register(req, res) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(422).json({ errors: { email: ['The email has already been taken.'] } });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hash } });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
    token
  });
}

export async function login(req, res) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json(zodToLaravelErrors(parsed.error));

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(422).json({ errors: { email: ['Les identifiants sont incorrects.'] } });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
    token
  });
}

/** ============== SOCIAL LOGIN ============== */
const SocialSchema = z.object({
  provider: z.enum(['google', 'facebook']),
  access_token: z.string().min(10),
});

// Helpers: récupérer le profil depuis le provider
async function getGoogleProfile(accessToken) {
  // Renvoie { sub, email?, name?, given_name?, family_name?, picture? }
  const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return data;
}

async function getFacebookProfile(accessToken) {
  // Renvoie { id, email?, name? }
  const { data } = await axios.get('https://graph.facebook.com/v19.0/me', {
    params: { fields: 'id,name,email', access_token: accessToken }
  });
  return data;
}

export async function socialLogin(req, res) {
  const parsed = SocialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Bad request' });
  }

  const { provider, access_token } = parsed.data;

  try {
    let profile = null;
    if (provider === 'google') {
      profile = await getGoogleProfile(access_token);
    } else if (provider === 'facebook') {
      profile = await getFacebookProfile(access_token);
    }

    // Normaliser les champs
    const providerId = profile.sub || profile.id; // google=sub, facebook=id
    const email = profile.email || `${provider}_${providerId}@no-email.fansbetliga.com`;
    const name =
      profile.name ||
      [profile.given_name, profile.family_name].filter(Boolean).join(' ') ||
      `${provider.toUpperCase()} User`;

    // Upsert par email (pas de champ "provider" dans Prisma pour éviter l'erreur)
    // Si "password" est NOT NULL en DB, on met un hash random.
    const randomSecret = await bcrypt.hash(`social_${provider}_${providerId}_${Date.now()}`, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name, // on peut mettre à jour le nom
      },
      create: {
        name,
        email,
        password: randomSecret, // satisfait NOT NULL sans jamais servir pour login classique
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
      token
    });
  } catch (err) {
    // Erreurs typiques: token expiré/invalid, domaine non autorisé, etc.
    console.error('socialLogin error:', err?.response?.data || err.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
