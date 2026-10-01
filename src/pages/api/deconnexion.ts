import type { APIRoute } from 'astro';
import { clientSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  await clientSession(request, cookies).auth.signOut();
  return redirect('/', 303);
};
