import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { isDemo } from '../config/env';

const authService = new AuthService();
export const authRoutes = Router();

const signupSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  email: z.string().trim().email('Informe um e-mail válido.').max(160),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72),
  role: z.enum(['floricultura', 'comercio_cliente', 'pesquisador_lab'], {
    errorMap: () => ({ message: 'Selecione um perfil válido.' }),
  }),
  organizationName: z.string().trim().min(2, 'Informe a organização.').max(160),
  city: z.string().trim().min(2, 'Informe a cidade.').max(80),
  phone: z.string().trim().min(8, 'Informe um telefone válido.').max(30),
});

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').max(160),
  password: z.string().min(1, 'Informe sua senha.').max(72),
});

authRoutes.post('/signup', validateBody(signupSchema), async (req, res, next) => {
  try {
    const session = await authService.signup(req.body);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const session = await authService.login(req.body);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').max(160),
});

authRoutes.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

const resetPasswordSchema = z.object({
  accessToken: z.string().min(10, 'Link de redefinição inválido.'),
  password: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres.').max(72),
});

authRoutes.post('/reset-password', validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body.accessToken, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRoutes.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

authRoutes.post('/logout', (_req, res) => {
  res.status(204).end();
});

authRoutes.get('/demo-accounts', (_req, res) => {
  if (!isDemo) {
    res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Recurso disponível apenas no modo demo.' } });
    return;
  }
  res.json({
    password: 'Demo@1234',
    accounts: [
      { email: 'admin@fih.com', role: 'superadmin', label: 'Equipe FIH · SuperAdmin' },
      { email: 'floricultura@jau.com', role: 'floricultura', label: 'Floricultura Rosa de Jaú' },
      { email: 'lab@senai.com', role: 'pesquisador_lab', label: 'Laboratório SENAI' },
      { email: 'cliente@embalagens.com', role: 'comercio_cliente', label: 'EcoEmbalagens B2B' },
    ],
  });
});
