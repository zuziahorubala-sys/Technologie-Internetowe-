import helmet from 'helmet';

export const security = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", 'data:'],
      "script-src": ["'self'"]
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  xContentTypeOptions: true
});
