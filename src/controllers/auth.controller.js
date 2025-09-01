import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
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
    // Même message/clé que ton ValidationException Laravel
    return res.status(422).json({ errors: { email: ['Les identifiants sont incorrects.'] } });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt },
    token
  });
}
