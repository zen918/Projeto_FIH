import jwt from 'jsonwebtoken';
import { env, isDemo } from '../config/env';
import { supabaseAdmin, supabasePublic } from '../config/supabase';
import type { Profile, Role } from '../domain/types';
import { ApiError, conflict, forbidden, unauthorized } from '../errors';
import { store } from '../repositories';
import { toProfile } from '../repositories/contracts';
import { verifyPassword } from '../utils/crypto';

const SELF_SERVICE_ROLES: Role[] = ['floricultura', 'comercio_cliente', 'pesquisador_lab'];

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  organizationName: string;
  city: string;
  phone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionResult {
  token: string | null;
  user: Profile;
  pending: boolean;
  demo: boolean;
}

function signDemoToken(user: Profile): string {
  return jwt.sign({ sub: user.id, role: user.role, demo: true }, env.jwtSecret, {
    expiresIn: '7d',
  });
}

function assertCanSignIn(user: Profile) {
  if (user.status === 'pending') {
    throw new ApiError(
      403,
      'ACCOUNT_PENDING',
      'Sua conta está em análise pela equipe FIH. Você poderá entrar assim que for aprovada.',
    );
  }
  if (user.status === 'blocked') {
    throw new ApiError(
      403,
      'ACCOUNT_BLOCKED',
      'Sua conta foi bloqueada. Entre em contato com a equipe FIH para mais informações.',
    );
  }
}

export class AuthService {
  async login(input: LoginInput): Promise<SessionResult> {
    const email = input.email.trim().toLowerCase();

    if (isDemo) {
      const record = await store.findUserByEmail(email);
      if (!record || !verifyPassword(input.password, record.passwordHash)) {
        throw unauthorized('E-mail ou senha inválidos.');
      }
      const user = toProfile(record);
      assertCanSignIn(user);
      return { token: signDemoToken(user), user, pending: false, demo: true };
    }

    const client = supabasePublic;
    if (!client) throw new ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');

    const { data, error } = await client.auth.signInWithPassword({ email, password: input.password });
    if (error || !data.user) {
      throw unauthorized('E-mail ou senha inválidos.');
    }

    const record = await store.findUserById(data.user.id);
    if (!record) {
      throw new ApiError(
        500,
        'PROFILE_NOT_FOUND',
        'Seu perfil ainda não foi criado. Fale com o suporte da FIH.',
      );
    }

    const user = toProfile(record);
    assertCanSignIn(user);

    return { token: data.session?.access_token ?? null, user, pending: false, demo: false };
  }

  async signup(input: SignupInput): Promise<SessionResult> {
    if (!SELF_SERVICE_ROLES.includes(input.role)) {
      throw forbidden('Perfil inválido para cadastro público.');
    }

    const email = input.email.trim().toLowerCase();
    const existing = await store.findUserByEmail(email);
    if (existing) {
      throw conflict('Este e-mail já está cadastrado. Faça login para continuar.', 'EMAIL_ALREADY_EXISTS');
    }

    const status = env.signupAutoApprove ? 'active' : 'pending';

    let record;
    try {
      record = await store.createUser({
        fullName: input.fullName,
        email,
        password: input.password,
        role: input.role,
        status,
        organizationName: input.organizationName,
        city: input.city,
        phone: input.phone,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/EMAIL_ALREADY_EXISTS|already|registered|exists/i.test(message)) {
        throw conflict('Este e-mail já está cadastrado. Faça login para continuar.', 'EMAIL_ALREADY_EXISTS');
      }
      throw new ApiError(500, 'SIGNUP_FAILED', 'Não foi possível criar sua conta. Tente novamente.');
    }

    const user = toProfile(record);

    if (isDemo) {
      if (status === 'pending') {
        return { token: null, user, pending: true, demo: true };
      }
      return { token: signDemoToken(user), user, pending: false, demo: true };
    }

    if (status === 'pending') {
      return { token: null, user, pending: true, demo: false };
    }

    const client = supabasePublic;
    if (!client) throw new ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (error || !data.session) {
      throw new ApiError(
        500,
        'SIGNUP_SESSION_FAILED',
        'Conta criada, mas não foi possível iniciar a sessão. Faça login.',
      );
    }

    return {
      token: data.session.access_token,
      user,
      pending: false,
      demo: false,
    };
  }

  async me(userId: string): Promise<Profile> {
    const record = await store.findUserById(userId);
    if (!record) throw unauthorized('Perfil não encontrado.');
    const user = toProfile(record);
    assertCanSignIn(user);
    return user;
  }

  async requestPasswordReset(email: string): Promise<{ demo: boolean; message: string }> {
    if (isDemo) {
      return {
        demo: true,
        message:
          'O modo demonstração não envia e-mails. Use a senha Demo@1234 nas contas de exemplo ou crie uma nova conta.',
      };
    }

    const client = supabasePublic;
    if (!client) throw new ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');

    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${env.publicAppUrl}/redefinir-senha`,
    });

    if (error) {
      console.warn('[auth] falha ao solicitar redefinição de senha:', error.message);
    }

    return {
      demo: false,
      message:
        'Se existir uma conta com este e-mail, enviaremos um link seguro para redefinição da senha. Verifique também a caixa de spam.',
    };
  }

  async resetPassword(accessToken: string, password: string): Promise<{ message: string }> {
    if (isDemo) {
      throw new ApiError(
        400,
        'DEMO_MODE',
        'A redefinição de senha por e-mail está disponível apenas com o Supabase Auth configurado.',
      );
    }

    const client = supabasePublic;
    const admin = supabaseAdmin;
    if (!client || !admin) {
      throw new ApiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado.');
    }

    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) {
      throw unauthorized('Link de redefinição inválido ou expirado. Solicite um novo.');
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
      password,
    });
    if (updateError) {
      throw new ApiError(
        500,
        'PASSWORD_RESET_FAILED',
        'Não foi possível atualizar a senha. Tente novamente.',
      );
    }

    return { message: 'Senha atualizada com sucesso. Faça login com a nova senha.' };
  }
}
