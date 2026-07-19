# Pi Business Market - Enterprise Deployment Guide

## Architecture Overview
The platform is built on a Serverless Full-Stack architecture:
- **Frontend**: React 18 + Vite (SPA)
- **Backend**: Firebase (Firestore, Auth)
- **Governance**: Enterprise Ops Console
- **Analytics**: Real-time BI Engine

## Production Prerequisites
1. **Firebase Project**: Production-tier project with Blaze plan.
2. **Pi Network Credentials**: API Keys and Wallet configuration.
3. **Domain**: SSL-certified custom domain.

## Deployment Pipeline
We use GitHub Actions for zero-downtime deployments:
1. **Stage**: Validation (Lint, Test, Build)
2. **Stage**: Integration (E2E on Preview Environment)
3. **Stage**: Production (Deploy to Cloud Run / Firebase Hosting)

## Disaster Recovery
### Backup Strategy
- **Firestore**: Daily automated backups via GCP Backup Service.
- **Media**: Versioned GCS buckets.
- **Audit Logs**: Exported to BigQuery monthly for long-term retention.

### Recovery Playbook
1. Identify incident (via Ops Console Monitoring).
2. Triage severity (P0-P4).
3. If data corruption: Restore Firestore to point-in-time snapshot.
4. If code regression: Execute GitHub Action `Rollback` workflow.

## Security Configuration
- **MFA**: Required for all Admin and Super Admin roles.
- **CORS**: Restricted to production domains.
- **Rules**: Firestore Security Rules must be deployed with every change.

## Monitoring & SLOs
- **Availability**: 99.9% Target.
- **Latency**: <200ms for P90 API requests.
- **Payment Success**: >98% Target.
