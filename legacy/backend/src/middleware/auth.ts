import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env, isDemo } from '../config/env';
import { supabasePublic } from '../config/supabase';
import { toProfile } from '../repositories/contracts';
import { store } from '../repositories';
import { forbidden, unauthorized } from '../errors';

interface DemoTokenPayload {
  sub?: string;
  role?: string;
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header('authorization');
    if (!header || !header.startsWith('Bearer ')) {
      throw unauthorized('Envie o token de acesso no cabeçalho Authorization.');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) throw unauthorized('Token de acesso ausente.');

    let userId: string;

    if (isDemo) {
      let payload: DemoTokenPayload;
      try {
        payload = jwt.verify(token, env.jwtSecret) as DemoTokenPayload;
      } catch {
        throw unauthorized('Sessão expirada ou inválida. Faça login novamente.');
      }
      if (!payload.sub) throw unauthorized('Token de acesso inválido.');
      userId = payload.sub;
    } else {
      if (!supabasePublic) {
        throw unauthorized('Supabase Auth não configurado no servidor.');
      }
      const { data, error } = await supabasePublic.auth.getUser(token);
      if (error || !data.user) {
        throw unauthorized('Sessão expirada ou inválida. Faça login novamente.');
      }
      userId = data.user.id;
    }

    const record = await store.findUserById(userId);
    if (!record) throw unauthorized('Perfil não encontrado.');

    const user = toProfile(record);
    if (user.status === 'pending') {
      throw forbidden(
        'Sua conta ainda está em análise pela equipe FIH. Aguarde a aprovação.',
        'ACCOUNT_PENDING',
      );
    }
    if (user.status === 'blocked') {
      throw forbidden('Sua conta está bloqueada. Fale com a equipe FIH.', 'ACCOUNT_BLOCKED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
