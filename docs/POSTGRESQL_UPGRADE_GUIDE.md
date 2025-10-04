# PostgreSQL Upgrade Guide - Phase 2 Security Enhancement

## Overview
This guide provides step-by-step instructions for upgrading your PostgreSQL database to apply important security patches as identified by the Supabase security linter.

**Current Status:** PostgreSQL version has security patches available  
**Priority:** Medium (Phase 2 - Enhanced Security)  
**Estimated Downtime:** 15-30 minutes  
**Risk Level:** Low (with proper backup)

---

## Pre-Upgrade Checklist

### 1. Schedule Maintenance Window
- [ ] Choose low-traffic time period (recommended: early morning or weekend)
- [ ] Notify users of planned maintenance
- [ ] Prepare rollback communication plan

### 2. Create Full Backup
```sql
-- Via Supabase Dashboard:
-- 1. Go to Database > Backups
-- 2. Click "Create Backup Now"
-- 3. Wait for backup to complete
-- 4. Download backup locally as additional safety measure
```

### 3. Document Current State
- [ ] Note current PostgreSQL version
- [ ] Export list of all database functions
- [ ] Export list of all RLS policies
- [ ] Save current performance metrics

### 4. Test in Staging (Recommended)
If you have a staging environment:
- [ ] Replicate production database to staging
- [ ] Perform upgrade on staging first
- [ ] Run all tests
- [ ] Verify all functions work correctly

---

## Upgrade Procedures

### Option 1: Via Supabase Console (Recommended)

1. **Access Database Settings**
   - Log in to Supabase Dashboard
   - Navigate to your project
   - Go to Settings > Database

2. **Initiate Upgrade**
   - Look for "Postgres Version" section
   - Click "Upgrade" button
   - Review upgrade information
   - Confirm upgrade

3. **Monitor Progress**
   - Watch the progress bar
   - Expected time: 15-30 minutes
   - Do not close browser during upgrade

4. **Verify Completion**
   - Wait for "Upgrade Complete" message
   - Note new PostgreSQL version

### Option 2: Via Supabase CLI

```bash
# 1. Install Supabase CLI if not already installed
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref hwxxcprqxqznselwzghi

# 4. Check current version
supabase db version

# 5. Initiate upgrade
supabase db upgrade

# 6. Follow prompts and confirm
```

---

## Post-Upgrade Validation

### 1. Verify Database Functions

Run this validation query to check all critical security functions:

```sql
-- Check all SECURITY DEFINER functions are working
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true
ORDER BY proname;

-- Expected functions to be present:
-- - encrypt_smtp_password
-- - decrypt_smtp_password  
-- - get_smtp_settings_for_admin
-- - get_smtp_settings_for_edge_function
-- - encrypt_pii
-- - decrypt_pii
-- - cleanup_expired_otps
-- - cleanup_old_campaigns
-- - cleanup_old_sms_logs
-- - cleanup_expired_lgpd_requests
-- - export_user_data
-- - request_data_deletion
```

### 2. Test RLS Policies

```sql
-- Verify RLS is enabled on critical tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'contacts', 'sms_logs', 
    'transactions', 'smtp_settings'
  );

-- All should show rowsecurity = true
```

### 3. Test Critical Functions

```sql
-- Test encryption functions
SELECT encrypt_pii('test@example.com') IS NOT NULL as encryption_works;
SELECT decrypt_pii(encrypt_pii('test@example.com')) = 'test@example.com' as decryption_works;

-- Test cleanup functions (as service role)
-- This will be tested via edge function
```

### 4. Verify Application Functionality

- [ ] Test user login/logout
- [ ] Test SMS sending
- [ ] Test contact management
- [ ] Test admin panel access
- [ ] Test SMTP settings (if configured)
- [ ] Check audit logs are recording
- [ ] Verify MFA settings for admins

### 5. Performance Validation

```sql
-- Check query performance on key tables
EXPLAIN ANALYZE 
SELECT * FROM profiles WHERE user_id = auth.uid();

EXPLAIN ANALYZE
SELECT * FROM contacts WHERE user_id = auth.uid() LIMIT 100;

-- Response times should be similar to pre-upgrade
```

---

## Rollback Procedure

If issues are detected after upgrade:

### 1. Immediate Rollback

```bash
# Via Supabase Dashboard:
1. Go to Database > Backups
2. Select the backup created before upgrade
3. Click "Restore"
4. Confirm restoration
5. Wait for completion (10-20 minutes)
```

### 2. Verify Rollback

- Check PostgreSQL version returned to previous
- Run validation queries
- Test application functionality
- Check audit logs for any data loss

### 3. Document Issues

- Note what failed
- Save error messages
- Contact Supabase support if needed
- Plan alternative upgrade strategy

---

## Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Pre-Upgrade Tasks | 2-3 hours | Backup, testing, planning |
| Maintenance Window | 30 min | Actual downtime |
| Upgrade Execution | 15-30 min | Database upgrade |
| Post-Upgrade Validation | 1-2 hours | Testing and verification |
| **Total** | **4-6 hours** | End-to-end process |

---

## Support & Emergency Contacts

### Supabase Support
- Dashboard: https://supabase.com/dashboard/support
- Email: support@supabase.com
- Discord: https://discord.supabase.com

### Internal Team
- Security Team: [Your security contact]
- DevOps Team: [Your DevOps contact]
- On-Call Engineer: [Your on-call number]

---

## Success Criteria

✅ PostgreSQL upgraded to latest version  
✅ All security functions operational  
✅ RLS policies working correctly  
✅ Application fully functional  
✅ No performance degradation  
✅ Zero data loss  
✅ All audit logs intact  

---

## Additional Notes

### Security Patches Included
The PostgreSQL upgrade will include:
- Latest security patches
- Performance improvements
- Bug fixes
- Compatibility updates

### Why This Matters
- Prevents known security vulnerabilities
- Ensures compatibility with latest Supabase features
- Improves database performance
- Maintains compliance standards

### Maintenance Best Practices
- Schedule upgrades quarterly
- Always backup before changes
- Test in staging environment
- Document all changes
- Monitor post-upgrade performance

---

**Last Updated:** 2025-10-04  
**Document Version:** 2.0  
**Next Review Date:** After upgrade completion
