# Enterprise Business Identity & Onboarding Engine - Architecture Guide

## 1. Core Philosophy
The Pi Business Market architecture treats the **Business** entity as the root of all marketplace operations. No transaction, product, or interaction exists without being anchored to a verified Business Identity.

## 2. Entity Hierarchy
- **Business**: Root container for all commercial data.
- **Business Member**: Junction between Users and Businesses, defining roles and ABAC permissions.
- **Business Document**: Verification layer for regulatory compliance and trust scores.
- **Business Invitation**: Lifecycle management for workforce expansion.

## 3. Onboarding Workflow
We utilize a **9-Step Multi-Phase Wizard** to ensure high-quality data entry:
1. **Classification**: Defining the legal structure.
2. **Identity**: Basic branding and legal naming.
3. **Presence**: Physical operational coordinates.
4. **Governance**: Direct contact channels for official communications.
5. **Specialization**: Industry and category mapping for recommendation engines.
6. **Compliance**: Regulatory document submission.
7. **Branding**: Visual assets (Logo/Cover).
8. **Review**: Pre-deployment audit.
9. **Launch**: Atomic creation of business, owner-member, and audit trails via Firestore Transactions.

## 4. Security Model
- **Ownership**: Immutable `ownerUid` linked to the creator.
- **ABAC (Attribute-Based Access Control)**: Permissions derived from `businessMembers` roles.
- **Isolation**: Rules guarantee zero cross-business data leakage.
- **Immutability**: Audit logs and verified documents are write-once/append-only.

## 5. Performance Optimization
- **Transactional Atomicity**: Business creation is wrapped in a transaction to ensure consistent member records.
- **Retry Logic**: All commerce-critical paths use the `withRetry` wrapper to handle transient network/database errors.
- **Lazy Loading**: Dashboards utilize modular tab-based loading to minimize initial payload.

## 6. Future Integration Path
- **Store Engine**: Stores will be children of Businesses.
- **Product Engine**: Products will be linked to `businessId`.
- **Accounting**: General ledgers will be generated per Business Identity.
- **AI Analytics**: The AI engine will aggregate data at the Business level for cross-store insights.
