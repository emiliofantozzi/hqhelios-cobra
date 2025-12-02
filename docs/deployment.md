# Deployment Configuration

## GitHub Repository

- **Repository**: [emiliofantozzi/hqhelios-cobra](https://github.com/emiliofantozzi/hqhelios-cobra)
- **Branch**: `master`
- **URL**: `https://github.com/emiliofantozzi/hqhelios-cobra.git`

## Vercel Deployment

### Project Information

| Property | Value |
|----------|-------|
| Project Name | `cobra-app` |
| Project ID | `prj_AZd7U0hOnsZfEz0CgS2oE8cRKtKr` |
| Team/Account | `emilios-projects-3cca1cd4` |
| Dashboard | [Vercel Project](https://vercel.com/emilios-projects-3cca1cd4/cobra-app) |

### Setup Instructions (Future)

1. **Connect GitHub Repository to Vercel**
   - Go to Vercel Dashboard > Project Settings > Git
   - Connect the `emiliofantozzi/hqhelios-cobra` repository
   - Set production branch to `master`

2. **Environment Variables**
   Configure the following in Vercel Dashboard > Project Settings > Environment Variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
   CLERK_SECRET_KEY=<your-clerk-secret>
   ```

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Deployment URLs

| Environment | URL Pattern |
|-------------|-------------|
| Production | `https://cobra-app.vercel.app` |
| Preview | `https://cobra-app-*-emilios-projects-3cca1cd4.vercel.app` |

### Branch Strategy

- `master` - Production deployments
- Feature branches - Preview deployments (automatic)

---

*Last updated: 2025-12-01*
