// Session middleware for dashboard auth
app.use(session({
  secret: process.env.SESSION_SECRET || 'speedroom-dashboard-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,  // Permitir HTTP e HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'  // Menos restritivo
  }
}));