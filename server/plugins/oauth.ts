import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import oauthPlugin, { FastifyOAuth2Options } from '@fastify/oauth2';

export default fp(async (fastify: FastifyInstance) => {
  const googleConfig: FastifyOAuth2Options = {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
        secret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret'
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/auth/google',
    callbackUri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    scope: ['profile', 'email']
  };

  fastify.register(oauthPlugin, googleConfig);
});
